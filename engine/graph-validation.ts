import type { FlowEdge, FlowNode } from "@/components/builder/types";
import { getTemplateByKind } from "@/engine/node-registry";
import { parseHandleId } from "@/engine/ports";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
) {
  if (sourceId === targetId) {
    return true;
  }

  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  const stack = [targetId];
  const visited = new Set<string>();

  while (stack.length) {
    const current = stack.pop();

    if (!current || visited.has(current)) {
      continue;
    }

    if (current === sourceId) {
      return true;
    }

    visited.add(current);
    const next = adjacency.get(current) ?? [];
    for (const nodeId of next) {
      if (!visited.has(nodeId)) {
        stack.push(nodeId);
      }
    }
  }

  return false;
}

export function validateConnection(
  connection: {
    source?: string | null;
    target?: string | null;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  },
  nodes: FlowNode[],
  edges: FlowEdge[]
): ValidationResult {
  const { source, target, sourceHandle, targetHandle } = connection;

  if (!source || !target) {
    return { valid: false, reason: "Incomplete connection" };
  }

  if (source === target) {
    return { valid: false, reason: "Cannot connect to the same node" };
  }

  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);

  if (!sourceNode || !targetNode) {
    return { valid: false, reason: "Target node not found" };
  }

  const sourceParsed = parseHandleId(sourceHandle);
  const targetParsed = parseHandleId(targetHandle);

  if (!sourceParsed || !targetParsed) {
    return { valid: false, reason: "Invalid port connection" };
  }

  if (sourceParsed.direction !== "output" || targetParsed.direction !== "input") {
    return { valid: false, reason: "Must connect output to input" };
  }

  if (sourceParsed.type !== targetParsed.type) {
    return {
      valid: false,
      reason: `Port type mismatch (${sourceParsed.type} -> ${targetParsed.type})`,
    };
  }

  const targetTemplate = getTemplateByKind(targetNode.data.kind);
  const targetPort = targetTemplate?.inputs.find((port) => port.key === targetParsed.key);

  if (!targetPort) {
    return { valid: false, reason: "Invalid target port" };
  }

  const targetAlreadyConnected = edges.some(
    (edge) => edge.target === target && edge.targetHandle === targetHandle
  );

  if (!targetPort.optional && targetAlreadyConnected) {
    return { valid: false, reason: "Input is already connected" };
  }

  const duplicateEdge = edges.some(
    (edge) =>
      edge.source === source &&
      edge.target === target &&
      edge.sourceHandle === sourceHandle &&
      edge.targetHandle === targetHandle
  );

  if (duplicateEdge) {
    return { valid: false, reason: "Connection already exists" };
  }

  if (wouldCreateCycle(source, target, nodes, edges)) {
    return { valid: false, reason: "Connection would create a cycle" };
  }

  return { valid: true };
}
