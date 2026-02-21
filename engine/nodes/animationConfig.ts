import type { NodeDefinition } from "@/engine/types";

export const animationConfigNode: NodeDefinition = {
  type: "animation.config",
  displayName: "Animation",
  category: "Generation",
  inputs: {},
  outputs: {
    json: "json",
  },
  async run({ config, log }) {
    const preset = String(config.preset ?? "fadeUp");
    const speed = Number(config.speed ?? 1);
    const intensity = Number(config.intensity ?? 60);

    const json = {
      preset,
      speed: Number.isFinite(speed) ? speed : 1,
      intensity: Number.isFinite(intensity) ? intensity : 60,
    };

    log(`Animation preset: ${json.preset}`);
    return { json };
  },
};
