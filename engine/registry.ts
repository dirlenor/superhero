import type { NodeDefinition, NodeKind } from "@/engine/types";
import { animationConfigNode } from "@/engine/nodes/animationConfig";
import { heroGenerateMockNode } from "@/engine/nodes/heroGenerateMock";
import { inputImageNode } from "@/engine/nodes/inputImage";
import { promptCombineNode } from "@/engine/nodes/promptCombine";
import { promptNegativeNode } from "@/engine/nodes/promptNegative";
import { promptTextNode } from "@/engine/nodes/promptText";
import { themeConfigNode } from "@/engine/nodes/themeConfig";

export const nodeRegistry: Record<string, NodeDefinition> = {
  [inputImageNode.type]: inputImageNode,
  [promptTextNode.type]: promptTextNode,
  [promptNegativeNode.type]: promptNegativeNode,
  [promptCombineNode.type]: promptCombineNode,
  [themeConfigNode.type]: themeConfigNode,
  [animationConfigNode.type]: animationConfigNode,
  [heroGenerateMockNode.type]: heroGenerateMockNode,
};

export const uiKindToEngineType: Record<NodeKind, string> = {
  imageInput: "input.image",
  prompt: "prompt.text",
  promptNegative: "prompt.negative",
  combinePrompt: "prompt.combine",
  theme: "theme.config",
  animation: "animation.config",
  generateHero: "hero.generate",
};

export function resolveNodeDefinition(nodeType: string) {
  const definition = nodeRegistry[nodeType];
  if (!definition) {
    throw new Error(`No node definition registered for type: ${nodeType}`);
  }
  return definition;
}
