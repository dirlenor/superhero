import type { NodeDefinition, PreviewOutput, WorkspaceOutput } from "@/engine/types";
import { createPlaceholderThumbnail } from "@/engine/workspace-manager";
import { db } from "@/lib/db";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function asWorkspace(value: unknown): WorkspaceOutput | null {
  const record = asRecord(value);
  if (!record) return null;
  if (typeof record.path !== "string" || typeof record.heroId !== "string") {
    return null;
  }
  return { path: record.path, heroId: record.heroId };
}

function asPreview(value: unknown): PreviewOutput | null {
  const record = asRecord(value);
  if (!record) return null;
  if (
    typeof record.url !== "string" ||
    typeof record.port !== "number" ||
    typeof record.pid !== "number"
  ) {
    return null;
  }
  return { url: record.url, port: record.port, pid: record.pid };
}

function toStringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export const heroPublishNode: NodeDefinition = {
  type: "hero.publish",
  displayName: "Publish",
  category: "Output",
  inputs: {
    heroArtifact: "heroArtifact",
    workspace: "workspace",
    preview: "preview",
  },
  outputs: {
    json: "json",
  },
  async run({ config, inputs, log }) {
    const artifact = asRecord(inputs.heroArtifact);
    const workspace = asWorkspace(inputs.workspace);
    const preview = asPreview(inputs.preview);

    if (!artifact || !workspace || !preview) {
      throw new Error("hero.publish requires heroArtifact, workspace, and preview inputs");
    }

    const heroId = toStringValue(artifact.heroId, workspace.heroId);
    const promptTitle = toStringValue(artifact.prompt, "Generated Hero");
    const titleOverride = toStringValue(config.titleOverride, "");
    const title = titleOverride || promptTitle;

    const thumbnail = await createPlaceholderThumbnail(heroId, title);

    const created = await db.hero.create({
      data: {
        title,
        heroId,
        workspacePath: workspace.path,
        previewUrl: preview.url,
        thumbnailPath: thumbnail.relativePath,
      },
    });

    log(`Published hero ${created.id}`);
    return {
      json: {
        id: created.id,
        title: created.title,
        heroId: created.heroId,
        workspacePath: created.workspacePath,
        previewUrl: created.previewUrl,
        thumbnailPath: created.thumbnailPath,
        createdAt: created.createdAt.toISOString(),
      },
    };
  },
};
