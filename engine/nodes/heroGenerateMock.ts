import { createHash } from "crypto";

import type { NodeDefinition } from "@/engine/types";

function buildStableHeroId(runId: string, nodeId: string, prompt: string) {
  const digest = createHash("sha1").update(`${runId}:${nodeId}:${prompt}`).digest("hex").slice(0, 12);
  return `hero_${digest}`;
}

export const heroGenerateMockNode: NodeDefinition = {
  type: "hero.generate",
  displayName: "Generate Hero",
  category: "Output",
  inputs: {
    text: "text",
    jsonTheme: "json",
    jsonAnimation: "json",
    image: "image",
    negative: "text",
  },
  optionalInputs: ["image", "negative"],
  outputs: {
    heroArtifact: "heroArtifact",
  },
  async run({ nodeId, config, inputs, ctx, log }) {
    const prompt = String(inputs.text ?? "").trim();
    if (!prompt) {
      throw new Error("Generate Hero requires text input");
    }

    const theme = (inputs.jsonTheme as Record<string, unknown> | undefined) ?? {
      theme: "dark",
      primaryColor: "#21d4a7",
      fontPreset: "cinematic-sans",
    };
    const animation = (inputs.jsonAnimation as Record<string, unknown> | undefined) ?? {
      preset: "fadeUp",
      speed: 1,
      intensity: 60,
    };

    const negativePrompt = typeof inputs.negative === "string" ? inputs.negative : undefined;
    const image =
      inputs.image && typeof inputs.image === "object" && inputs.image !== null
        ? (inputs.image as Record<string, unknown>)
        : undefined;

    const heroArtifact = {
      heroId: buildStableHeroId(ctx.runId, nodeId, prompt),
      createdAt: new Date().toISOString(),
      prompt,
      ...(negativePrompt ? { negativePrompt } : {}),
      theme,
      animation,
      ...(image ? { image } : {}),
      quality: String(config.quality ?? "draft"),
      includePreview:
        typeof config.includePreview === "boolean"
          ? config.includePreview
          : String(config.includePreview ?? "true") === "true",
    };

    log(`Mock hero artifact generated: ${heroArtifact.heroId}`);
    return { heroArtifact };
  },
};
