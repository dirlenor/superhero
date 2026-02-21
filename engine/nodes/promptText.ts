import type { NodeDefinition } from "@/engine/types";

export const promptTextNode: NodeDefinition = {
  type: "prompt.text",
  displayName: "Prompt",
  category: "Prompts",
  inputs: {},
  outputs: {
    text: "text",
  },
  async run({ config, log }) {
    const text = String(config.text ?? "").trim();
    if (!text) {
      throw new Error("Prompt text is required");
    }

    log(`Prompt length: ${text.length} chars`);
    return { text };
  },
};
