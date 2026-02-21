import type { BuilderNodeData, NodeLogEntry } from "@/engine/types";

interface ExecutionContext {
  nodesById: Map<string, BuilderNodeData>;
  incomingByNode: Map<string, string[]>;
  outputByNodeId: Record<string, Record<string, unknown> | null>;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createLogEntry(level: NodeLogEntry["level"], message: string): NodeLogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: nowIso(),
    level,
    message,
  };
}

function buildIncomingByNode(
  nodeIds: string[],
  edges: { source: string; target: string }[]
): Map<string, string[]> {
  const incoming = new Map<string, string[]>();

  for (const id of nodeIds) {
    incoming.set(id, []);
  }

  for (const edge of edges) {
    const list = incoming.get(edge.target) ?? [];
    list.push(edge.source);
    incoming.set(edge.target, list);
  }

  return incoming;
}

export function getUpstreamTopoOrder(
  targetNodeId: string,
  nodeIds: string[],
  edges: { source: string; target: string }[]
) {
  const incoming = buildIncomingByNode(nodeIds, edges);
  const needed = new Set<string>();
  const queue = [targetNodeId];

  while (queue.length) {
    const current = queue.shift();

    if (!current || needed.has(current)) {
      continue;
    }

    needed.add(current);
    const upstream = incoming.get(current) ?? [];
    for (const src of upstream) {
      queue.push(src);
    }
  }

  return topoSort(Array.from(needed), edges.filter((edge) => needed.has(edge.source) && needed.has(edge.target)));
}

export function getWorkflowTopoOrder(nodeIds: string[], edges: { source: string; target: string }[]) {
  return topoSort(nodeIds, edges);
}

function topoSort(nodeIds: string[], edges: { source: string; target: string }[]) {
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const id of nodeIds) {
    indegree.set(id, 0);
    adjacency.set(id, []);
  }

  for (const edge of edges) {
    if (!indegree.has(edge.source) || !indegree.has(edge.target)) {
      continue;
    }

    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    const list = adjacency.get(edge.source) ?? [];
    list.push(edge.target);
    adjacency.set(edge.source, list);
  }

  const queue: string[] = [];
  for (const [id, degree] of indegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  const ordered: string[] = [];
  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    ordered.push(current);
    for (const next of adjacency.get(current) ?? []) {
      const nextValue = (indegree.get(next) ?? 1) - 1;
      indegree.set(next, nextValue);
      if (nextValue === 0) {
        queue.push(next);
      }
    }
  }

  if (ordered.length !== nodeIds.length) {
    return nodeIds;
  }

  return ordered;
}

export function buildMockOutput(
  nodeId: string,
  nodeData: BuilderNodeData,
  outputByNodeId: Record<string, Record<string, unknown> | null>,
  incomingNodeIds: string[]
) {
  const incomingOutputs = incomingNodeIds
    .map((incomingId) => outputByNodeId[incomingId])
    .filter(Boolean);

  switch (nodeData.kind) {
    case "imageInput":
      return {
        image: {
          path: nodeData.config.imagePath,
          width: 1600,
          height: 900,
          mocked: true,
        },
      };
    case "prompt":
      return {
        text: String(nodeData.config.text ?? ""),
      };
    case "combinePrompt": {
      const a = incomingOutputs[0]?.text ?? "";
      const b = incomingOutputs[1]?.text ?? "";
      const mode = String(nodeData.config.mode ?? "concat");

      if (mode === "template") {
        const template = String(nodeData.config.templateString ?? "{{textA}} {{textB}}");
        return {
          text: template.replaceAll("{{textA}}", String(a)).replaceAll("{{textB}}", String(b)),
        };
      }

      return {
        text: [a, b].filter(Boolean).join(" "),
      };
    }
    case "theme":
      return {
        theme: {
          mode: nodeData.config.theme,
          primaryColor: nodeData.config.primaryColor,
          fontPreset: nodeData.config.fontPreset,
        },
      };
    case "animation":
      return {
        animation: {
          preset: nodeData.config.preset,
          speed: nodeData.config.speed,
          intensity: nodeData.config.intensity,
        },
      };
    case "generateHero": {
      const text = incomingOutputs.find((output) => output?.text)?.text ?? "No prompt";
      const theme = incomingOutputs.find((output) => output?.theme)?.theme ?? {
        mode: "dark",
      };
      const animation = incomingOutputs.find((output) => output?.animation)?.animation ?? {
        preset: "fadeUp",
      };
      const image = incomingOutputs.find((output) => output?.image)?.image ?? null;

      return {
        heroArtifact: {
          id: `hero-${nodeId}`,
          headline: `Hero concept: ${String(text).slice(0, 64)}`,
          theme,
          animation,
          image,
          generatedAt: nowIso(),
          mocked: true,
        },
      };
    }
    default:
      return {
        raw: nodeData.config,
      };
  }
}

export function createExecutionContext(nodes: { id: string; data: BuilderNodeData }[], edges: { source: string; target: string }[]): ExecutionContext {
  const nodesById = new Map(nodes.map((node) => [node.id, node.data]));
  const incomingByNode = buildIncomingByNode(
    nodes.map((node) => node.id),
    edges
  );

  return {
    nodesById,
    incomingByNode,
    outputByNodeId: {},
  };
}

export async function waitTick(durationMs = 280) {
  await new Promise((resolve) => setTimeout(resolve, durationMs));
}
