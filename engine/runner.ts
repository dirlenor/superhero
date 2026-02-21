import type {
  EngineRunResult,
  GraphDefinition,
  GraphEdge,
  GraphNode,
  NodeExecutionState,
  RunContext,
} from "@/engine/types";
import { resolveNodeDefinition } from "@/engine/registry";

function nowIso() {
  return new Date().toISOString();
}

function topoSort(nodes: GraphNode[], edges: GraphEdge[]): { order: string[]; hasCycle: boolean } {
  const nodeIds = nodes.map((node) => node.id);
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    indegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    if (!indegree.has(edge.from.nodeId) || !indegree.has(edge.to.nodeId)) {
      continue;
    }
    indegree.set(edge.to.nodeId, (indegree.get(edge.to.nodeId) ?? 0) + 1);
    adjacency.set(edge.from.nodeId, [...(adjacency.get(edge.from.nodeId) ?? []), edge.to.nodeId]);
  }

  const queue = Array.from(indegree.entries())
    .filter(([, degree]) => degree === 0)
    .map(([id]) => id);

  const order: string[] = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    order.push(current);
    for (const next of adjacency.get(current) ?? []) {
      const nextDegree = (indegree.get(next) ?? 1) - 1;
      indegree.set(next, nextDegree);
      if (nextDegree === 0) {
        queue.push(next);
      }
    }
  }

  return {
    order,
    hasCycle: order.length !== nodes.length,
  };
}

function buildAdjacency(edges: GraphEdge[]) {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const edge of edges) {
    outgoing.set(edge.from.nodeId, [...(outgoing.get(edge.from.nodeId) ?? []), edge.to.nodeId]);
    incoming.set(edge.to.nodeId, [...(incoming.get(edge.to.nodeId) ?? []), edge.from.nodeId]);
  }

  return { outgoing, incoming };
}

function collectAncestors(targetNodeId: string, incoming: Map<string, string[]>) {
  const visited = new Set<string>();
  const stack = [targetNodeId];

  while (stack.length) {
    const current = stack.pop();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);

    for (const upstream of incoming.get(current) ?? []) {
      stack.push(upstream);
    }
  }

  return visited;
}

function collectDescendants(startNodeId: string, outgoing: Map<string, string[]>) {
  const visited = new Set<string>();
  const stack = [startNodeId];

  while (stack.length) {
    const current = stack.pop();
    if (!current || visited.has(current)) {
      continue;
    }
    visited.add(current);

    for (const downstream of outgoing.get(current) ?? []) {
      stack.push(downstream);
    }
  }

  return visited;
}

function requiredInputPorts(nodeType: string) {
  const definition = resolveNodeDefinition(nodeType);
  const optional = new Set(definition.optionalInputs ?? []);
  return Object.keys(definition.inputs).filter((port) => !optional.has(port));
}

function validateGraph(graph: GraphDefinition): string[] {
  const errors: string[] = [];
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));

  const { hasCycle } = topoSort(graph.nodes, graph.edges);
  if (hasCycle) {
    errors.push("Cycle detected in workflow graph.");
  }

  for (const edge of graph.edges) {
    const fromNode = nodeMap.get(edge.from.nodeId);
    const toNode = nodeMap.get(edge.to.nodeId);

    if (!fromNode || !toNode) {
      errors.push(`Invalid edge: ${edge.from.nodeId}:${edge.from.port} -> ${edge.to.nodeId}:${edge.to.port}`);
      continue;
    }

    const fromDef = resolveNodeDefinition(fromNode.type);
    const toDef = resolveNodeDefinition(toNode.type);
    const outputType = fromDef.outputs[edge.from.port];
    const inputType = toDef.inputs[edge.to.port];

    if (!outputType) {
      errors.push(`Node ${fromNode.id} has no output port named '${edge.from.port}'.`);
      continue;
    }

    if (!inputType) {
      errors.push(`Node ${toNode.id} has no input port named '${edge.to.port}'.`);
      continue;
    }

    if (outputType !== inputType) {
      errors.push(
        `Port type mismatch on edge ${fromNode.id}:${edge.from.port} -> ${toNode.id}:${edge.to.port} (${outputType} != ${inputType}).`
      );
    }
  }

  return errors;
}

function initializeNodeStates(graph: GraphDefinition): Record<string, NodeExecutionState> {
  return Object.fromEntries(
    graph.nodes.map((node) => [
      node.id,
      {
        nodeId: node.id,
        status: "idle",
        logs: [],
      } satisfies NodeExecutionState,
    ])
  );
}

async function executeNode(
  node: GraphNode,
  graph: GraphDefinition,
  ctx: RunContext,
  outputsByNode: Record<string, Record<string, unknown>>,
  nodeStates: Record<string, NodeExecutionState>
): Promise<void> {
  const definition = resolveNodeDefinition(node.type);
  const start = Date.now();
  const startedAt = nowIso();

  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(`[${nowIso()}] ${msg}`);
  };

  const incomingEdges = graph.edges.filter((edge) => edge.to.nodeId === node.id);

  const requiredPorts = requiredInputPorts(node.type);
  for (const requiredPort of requiredPorts) {
    const hasConnection = incomingEdges.some((edge) => edge.to.port === requiredPort);
    if (!hasConnection) {
      throw new Error(`Missing required input '${requiredPort}' on node ${node.id}.`);
    }
  }

  const inputs: Record<string, unknown> = {};
  for (const edge of incomingEdges) {
    const upstreamOutput = outputsByNode[edge.from.nodeId];
    if (!upstreamOutput) {
      throw new Error(`Missing upstream output from node ${edge.from.nodeId}.`);
    }

    if (!(edge.from.port in upstreamOutput)) {
      throw new Error(`Output port '${edge.from.port}' not produced by node ${edge.from.nodeId}.`);
    }

    inputs[edge.to.port] = upstreamOutput[edge.from.port];
  }

  nodeStates[node.id] = {
    ...nodeStates[node.id],
    status: "running",
    startedAt,
    logs,
  };

  const result = await definition.run({
    nodeId: node.id,
    config: node.config,
    inputs,
    ctx,
    log,
  });

  const finishedAt = nowIso();
  const durationMs = Date.now() - start;

  outputsByNode[node.id] = result;
  nodeStates[node.id] = {
    ...nodeStates[node.id],
    status: "success",
    finishedAt,
    durationMs,
    logs,
    output: result,
  };
}

export async function runWorkflow(graph: GraphDefinition, workflowId?: string): Promise<EngineRunResult> {
  const runId = crypto.randomUUID();
  const createdAt = nowIso();
  const errors = validateGraph(graph);
  const nodeStates = initializeNodeStates(graph);

  if (errors.length > 0) {
    return {
      runId,
      workflowId,
      status: "error",
      createdAt,
      finishedAt: nowIso(),
      executedNodeIds: [],
      nodeStates,
      errors,
    };
  }

  const { order } = topoSort(graph.nodes, graph.edges);
  const outputsByNode: Record<string, Record<string, unknown>> = {};
  const ctx: RunContext = {
    runId,
    workflowId,
    startedAt: createdAt,
  };

  const executedNodeIds: string[] = [];

  for (const nodeId of order) {
    const node = graph.nodes.find((item) => item.id === nodeId);
    if (!node) {
      continue;
    }

    const incoming = graph.edges.filter((edge) => edge.to.nodeId === nodeId);
    const blocked = incoming.some((edge) => nodeStates[edge.from.nodeId]?.status !== "success");

    if (blocked) {
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        status: "error",
        startedAt: nowIso(),
        finishedAt: nowIso(),
        durationMs: 0,
        logs: [
          `[${nowIso()}] Skipped due to upstream failure.`,
        ],
        error: "Skipped due to upstream failure.",
      };
      continue;
    }

    try {
      await executeNode(node, graph, ctx, outputsByNode, nodeStates);
      executedNodeIds.push(nodeId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown execution error";
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        status: "error",
        startedAt: nodeStates[nodeId].startedAt ?? nowIso(),
        finishedAt: nowIso(),
        durationMs:
          nodeStates[nodeId].startedAt
            ? new Date().getTime() - new Date(nodeStates[nodeId].startedAt as string).getTime()
            : 0,
        logs: [...(nodeStates[nodeId].logs ?? []), `[${nowIso()}] ERROR: ${message}`],
        error: message,
      };
      errors.push(`Node ${nodeId}: ${message}`);
    }
  }

  return {
    runId,
    workflowId,
    status: errors.length > 0 ? "error" : "success",
    createdAt,
    finishedAt: nowIso(),
    executedNodeIds,
    nodeStates,
    errors,
  };
}

export async function runFromNode(
  graph: GraphDefinition,
  targetNodeId: string,
  workflowId?: string
): Promise<EngineRunResult> {
  const nodeExists = graph.nodes.some((node) => node.id === targetNodeId);
  if (!nodeExists) {
    const runId = crypto.randomUUID();
    const createdAt = nowIso();
    return {
      runId,
      workflowId,
      status: "error",
      createdAt,
      finishedAt: nowIso(),
      executedNodeIds: [],
      nodeStates: initializeNodeStates(graph),
      errors: [`Target node '${targetNodeId}' was not found in graph.`],
    };
  }

  const { outgoing, incoming } = buildAdjacency(graph.edges);
  const descendants = collectDescendants(targetNodeId, outgoing);
  const relevantNodeIds = new Set<string>();

  for (const nodeId of descendants) {
    for (const ancestorId of collectAncestors(nodeId, incoming)) {
      relevantNodeIds.add(ancestorId);
    }
    relevantNodeIds.add(nodeId);
  }

  const subGraph: GraphDefinition = {
    nodes: graph.nodes.filter((node) => relevantNodeIds.has(node.id)),
    edges: graph.edges.filter(
      (edge) => relevantNodeIds.has(edge.from.nodeId) && relevantNodeIds.has(edge.to.nodeId)
    ),
  };

  return runWorkflow(subGraph, workflowId);
}
