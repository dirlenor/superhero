import type { NodeDefinition } from "@/engine/types";

export const inputImageNode: NodeDefinition = {
  type: "input.image",
  displayName: "Image Input",
  category: "Inputs",
  inputs: {},
  outputs: {
    image: "image",
  },
  async run({ config, log }) {
    const imagePath = String(config.imagePath ?? "").trim();

    if (!imagePath) {
      throw new Error("imagePath is required");
    }

    log(`Resolved image path: ${imagePath}`);
    return {
      image: { path: imagePath },
    };
  },
};
