import type { NodeDefinition, WorkspaceOutput } from "@/engine/types";
import { runWorkspacePreview } from "@/engine/workspace-manager";

function asWorkspace(value: unknown): WorkspaceOutput | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const candidate = value as WorkspaceOutput;
  if (!candidate.path || !candidate.heroId) {
    return null;
  }
  return candidate;
}

export const previewRunNode: NodeDefinition = {
  type: "preview.run",
  displayName: "Run Preview",
  category: "Output",
  inputs: {
    workspace: "workspace",
  },
  outputs: {
    preview: "preview",
  },
  async run({ config, inputs, log }) {
    const workspace = asWorkspace(inputs.workspace);
    if (!workspace) {
      throw new Error("preview.run requires workspace input");
    }

    const requestedPort = Number(config.startPort ?? 3010);
    const startPort = Number.isFinite(requestedPort) ? Math.max(3010, requestedPort) : 3010;
    const preview = await runWorkspacePreview(workspace.path, workspace.heroId, startPort, log);

    log(`Preview URL ${preview.url}`);
    return {
      preview,
    };
  },
};
