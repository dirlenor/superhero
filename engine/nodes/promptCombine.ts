import type { NodeDefinition } from "@/engine/types";

export const promptCombineNode: NodeDefinition = {
  type: "prompt.combine",
  displayName: "Combine Prompt",
  category: "Prompts",
  inputs: {
    textA: "text",
    textB: "text",
  },
  outputs: {
    text: "text",
  },
  async run({ config, inputs, log }) {
    const a = String(inputs.textA ?? "");
    const b = String(inputs.textB ?? "");
    const mode = String(config.mode ?? "concat");

    if (!a.trim() || !b.trim()) {
      throw new Error("Combine Prompt requires textA and textB");
    }

    if (mode === "template") {
      const template = String(config.templateString ?? "").trim();
      if (!template) {
        throw new Error("templateString is required in template mode");
      }

      const text = template.replaceAll("{a}", a).replaceAll("{b}", b);
      log("Combined prompt with template mode");
      return { text };
    }

    const text = `${a}\n${b}`;
    log("Combined prompt with concat mode");
    return { text };
  },
};
