import type { NodeDefinition, NodeKind } from "@/engine/types";
import { animationConfigNode } from "@/engine/nodes/animationConfig";
import { heroGenerateMockNode } from "@/engine/nodes/heroGenerateMock";
import { heroPublishNode } from "@/engine/nodes/heroPublish";
import { inputImageNode } from "@/engine/nodes/inputImage";
import { patchPlanGenerateNode } from "@/engine/nodes/patchPlanGenerate";
import { previewRunNode } from "@/engine/nodes/previewRun";
import { promptCombineNode } from "@/engine/nodes/promptCombine";
import { promptNegativeNode } from "@/engine/nodes/promptNegative";
import { promptTextNode } from "@/engine/nodes/promptText";
import { themeConfigNode } from "@/engine/nodes/themeConfig";
import { workspaceApplyNode } from "@/engine/nodes/workspaceApply";

export const nodeRegistry: Record<string, NodeDefinition> = {
  [inputImageNode.type]: inputImageNode,
  [promptTextNode.type]: promptTextNode,
  [promptNegativeNode.type]: promptNegativeNode,
  [promptCombineNode.type]: promptCombineNode,
  [themeConfigNode.type]: themeConfigNode,
  [animationConfigNode.type]: animationConfigNode,
  [heroGenerateMockNode.type]: heroGenerateMockNode,
  [patchPlanGenerateNode.type]: patchPlanGenerateNode,
  [workspaceApplyNode.type]: workspaceApplyNode,
  [previewRunNode.type]: previewRunNode,
  [heroPublishNode.type]: heroPublishNode,
};

export const uiKindToEngineType: Record<NodeKind, string> = {
  imageInput: "input.image",
  prompt: "prompt.text",
  promptNegative: "prompt.negative",
  combinePrompt: "prompt.combine",
  theme: "theme.config",
  animation: "animation.config",
  generateHero: "hero.generate",
  patchPlanGenerate: "patchplan.generate",
  workspaceApply: "workspace.apply",
  previewRun: "preview.run",
  heroPublish: "hero.publish",
};

export function resolveNodeDefinition(nodeType: string) {
  const definition = nodeRegistry[nodeType];
  if (!definition) {
    throw new Error(`No node definition registered for type: ${nodeType}`);
  }
  return definition;
}
