import type { NodeDefinition, PatchPlanOutput } from "@/engine/types";
import { applyPatchPlanToWorkspace } from "@/engine/workspace-manager";

function asPatchPlan(value: unknown): PatchPlanOutput | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as PatchPlanOutput;
  if (!candidate.heroId || !Array.isArray(candidate.ops) || !candidate.workspaceName) {
    return null;
  }
  return candidate;
}

export const workspaceApplyNode: NodeDefinition = {
  type: "workspace.apply",
  displayName: "Apply Workspace",
  category: "Output",
  inputs: {
    patchPlan: "patchPlan",
  },
  outputs: {
    workspace: "workspace",
  },
  async run({ config, inputs, ctx, log }) {
    const plan = asPatchPlan(inputs.patchPlan);
    if (!plan) {
      throw new Error("workspace.apply requires patchPlan input");
    }

    const keepExisting =
      typeof config.keepExisting === "boolean"
        ? config.keepExisting
        : String(config.keepExisting ?? "false") === "true";

    const workspace = await applyPatchPlanToWorkspace(ctx.runId, plan, {
      keepExisting,
      log,
    });

    log(`Workspace ready at ${workspace.path}`);
    return {
      workspace,
    };
  },
};
