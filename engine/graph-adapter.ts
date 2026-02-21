import type { BuilderGraphSnapshot, GraphDefinition, GraphEdge, GraphNode } from "@/engine/types";
import { uiKindToEngineType } from "@/engine/registry";
import { parseHandleId } from "@/engine/ports";

function fallbackOutputPort(nodeType: string) {
  switch (nodeType) {
    case "input.image":
      return "image";
    case "prompt.text":
    case "prompt.negative":
    case "prompt.combine":
      return "text";
    case "theme.config":
    case "animation.config":
      return "json";
    case "hero.generate":
      return "heroArtifact";
    case "patchplan.generate":
      return "patchPlan";
    case "workspace.apply":
      return "workspace";
    case "preview.run":
      return "preview";
    case "hero.publish":
      return "json";
    default:
      return "output";
  }
}

function fallbackInputPort(nodeType: string) {
  switch (nodeType) {
    case "prompt.combine":
      return "textA";
    case "hero.generate":
      return "text";
    case "patchplan.generate":
      return "heroArtifact";
    case "workspace.apply":
      return "patchPlan";
    case "preview.run":
      return "workspace";
    case "hero.publish":
      return "heroArtifact";
    default:
      return "input";
  }
}

export function toGraphDefinition(snapshot: BuilderGraphSnapshot): GraphDefinition {
  const nodes: GraphNode[] = snapshot.nodes.map((node) => {
    const engineType = uiKindToEngineType[node.data.kind];
    if (!engineType) {
      throw new Error(`Unsupported UI node kind '${node.data.kind}'`);
    }

    return {
      id: node.id,
      type: engineType,
      config: node.data.config,
    };
  });

  const nodeTypeMap = new Map(nodes.map((node) => [node.id, node.type]));

  const edges: GraphEdge[] = snapshot.edges.map((edge) => {
    const sourceType = nodeTypeMap.get(edge.source);
    const targetType = nodeTypeMap.get(edge.target);

    const parsedSource = parseHandleId(edge.sourceHandle);
    const parsedTarget = parseHandleId(edge.targetHandle);

    return {
      from: {
        nodeId: edge.source,
        port: parsedSource?.key ?? fallbackOutputPort(sourceType ?? ""),
      },
      to: {
        nodeId: edge.target,
        port: parsedTarget?.key ?? fallbackInputPort(targetType ?? ""),
      },
    };
  });

  return {
    nodes,
    edges,
  };
}
