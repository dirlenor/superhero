import type { NodeDefinition } from "@/engine/types";

export const promptNegativeNode: NodeDefinition = {
  type: "prompt.negative",
  displayName: "Negative Prompt",
  category: "Prompts",
  inputs: {},
  outputs: {
    text: "text",
  },
  async run({ config, log }) {
    const text = String(config.text ?? "").trim();
    if (!text) {
      throw new Error("Negative prompt text is required");
    }

    log(`Negative prompt length: ${text.length} chars`);
    return { text };
  },
};
