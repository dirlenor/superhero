import type { NodeDefinition } from "@/engine/types";

export const themeConfigNode: NodeDefinition = {
  type: "theme.config",
  displayName: "Theme",
  category: "Generation",
  inputs: {},
  outputs: {
    json: "json",
  },
  async run({ config, log }) {
    const theme = String(config.theme ?? "dark");
    const primaryColor = String(config.primaryColor ?? "#21d4a7");
    const fontPreset = String(config.fontPreset ?? "cinematic-sans");

    const json = {
      theme: theme === "light" ? "light" : "dark",
      primaryColor,
      fontPreset,
    };

    log(`Theme prepared: ${json.theme}`);
    return { json };
  },
};
