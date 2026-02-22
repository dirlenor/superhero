import type {
  BuilderNodeData,
  NodeCategory,
  NodeConfig,
  NodeKind,
  NodePort,
} from "./types";

export type NodeFieldType = "text" | "textarea" | "number" | "select";

export interface NodeFieldOption {
  label: string;
  value: string;
}

export interface NodeField {
  key: string;
  label: string;
  type: NodeFieldType;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: NodeFieldOption[];
}

export interface NodeTemplate {
  kind: NodeKind;
  label: string;
  description: string;
  category: NodeCategory;
  accentColor: string;
  defaults: NodeConfig;
  fields: NodeField[];
  inputs: NodePort[];
  outputs: NodePort[];
}

export const nodeTemplates: NodeTemplate[] = [
  {
    kind: "imageInput",
    label: "Image Input",
    description: "Load image and extract prompt via OpenRouter",
    category: "Inputs",
    accentColor: "#6de0ff",
    defaults: {
      mode: "visionPrompt",
      imagePath: "",
      openRouterModel: "qwen/qwen3-vl-235b-a22b-thinking",
    },
    fields: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        options: [
          { label: "visionPrompt", value: "visionPrompt" },
          { label: "passthrough", value: "passthrough" },
        ],
      },
      {
        key: "imagePath",
        label: "Image Path",
        type: "text",
        placeholder: "Paste image URL or use upload below",
      },
      {
        key: "openRouterModel",
        label: "OpenRouter Model",
        type: "text",
        placeholder: "qwen/qwen3-vl-235b-a22b-thinking",
      },
    ],
    inputs: [],
    outputs: [
      { key: "image", label: "image", type: "image", direction: "output" },
      { key: "text", label: "text(prompt)", type: "text", direction: "output" },
    ],
  },
  {
    kind: "prompt",
    label: "Prompt",
    description: "Main text for the hero section",
    category: "Prompts",
    accentColor: "#48BB78",
    defaults: {
      text: "A cinematic superhero hero-section headline with bold call to action",
    },
    fields: [
      {
        key: "text",
        label: "Prompt",
        type: "textarea",
        placeholder: "Type what you want to get",
      },
    ],
    inputs: [],
    outputs: [{ key: "text", label: "text", type: "text", direction: "output" }],
  },
  {
    kind: "promptNegative",
    label: "Negative Prompt",
    description: "Constraints and things to avoid",
    category: "Prompts",
    accentColor: "#F56565",
    defaults: {
      text: "No clutter, no extra limbs, no blurry text",
    },
    fields: [
      {
        key: "text",
        label: "Negative Prompt",
        type: "textarea",
        placeholder: "Type what you do not want",
      },
    ],
    inputs: [],
    outputs: [{ key: "text", label: "text", type: "text", direction: "output" }],
  },
  {
    kind: "combinePrompt",
    label: "Combine Prompt",
    description: "Combine two text inputs",
    category: "Prompts",
    accentColor: "#F56565",
    defaults: {
      mode: "concat",
      templateString: "{a}\n{b}",
    },
    fields: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        options: [
          { label: "concat", value: "concat" },
          { label: "template", value: "template" },
        ],
      },
      {
        key: "templateString",
        label: "Template",
        type: "text",
        placeholder: "{a} + {b}",
      },
    ],
    inputs: [
      { key: "textA", label: "textA", type: "text", direction: "input" },
      { key: "textB", label: "textB", type: "text", direction: "input" },
    ],
    outputs: [{ key: "text", label: "text", type: "text", direction: "output" }],
  },
  {
    kind: "theme",
    label: "Theme",
    description: "Configure colors, font, and mode",
    category: "Generation",
    accentColor: "#ECC94B",
    defaults: {
      theme: "dark",
      primaryColor: "#21d4a7",
      fontPreset: "cinematic-sans",
    },
    fields: [
      {
        key: "theme",
        label: "Theme",
        type: "select",
        options: [
          { label: "dark", value: "dark" },
          { label: "light", value: "light" },
        ],
      },
      {
        key: "primaryColor",
        label: "Primary Color",
        type: "text",
        placeholder: "#21d4a7",
      },
      {
        key: "fontPreset",
        label: "Font Preset",
        type: "select",
        options: [
          { label: "cinematic-sans", value: "cinematic-sans" },
          { label: "editorial", value: "editorial" },
          { label: "tech-display", value: "tech-display" },
        ],
      },
    ],
    inputs: [],
    outputs: [{ key: "json", label: "json(theme)", type: "json", direction: "output" }],
  },
  {
    kind: "animation",
    label: "Animation",
    description: "Configure motion presets",
    category: "Output",
    accentColor: "#9F7AEA",
    defaults: {
      preset: "fadeUp",
      speed: 1,
      intensity: 60,
    },
    fields: [
      {
        key: "preset",
        label: "Preset",
        type: "select",
        options: [
          { label: "fadeUp", value: "fadeUp" },
          { label: "stagger", value: "stagger" },
          { label: "clipReveal", value: "clipReveal" },
          { label: "parallaxLite", value: "parallaxLite" },
        ],
      },
      { key: "speed", label: "Speed", type: "number", min: 0, max: 3 },
      { key: "intensity", label: "Intensity", type: "number", min: 0, max: 100 },
    ],
    inputs: [],
    outputs: [{ key: "json", label: "json(animation)", type: "json", direction: "output" }],
  },
  {
    kind: "generateHero",
    label: "Generate Hero",
    description: "Combine inputs to generate artifact",
    category: "Output",
    accentColor: "#4299E1",
    defaults: {
      quality: "draft",
      includePreview: true,
    },
    fields: [
      {
        key: "quality",
        label: "Quality",
        type: "select",
        options: [
          { label: "draft", value: "draft" },
          { label: "balanced", value: "balanced" },
          { label: "high", value: "high" },
        ],
      },
      {
        key: "includePreview",
        label: "Include Preview",
        type: "select",
        options: [
          { label: "true", value: "true" },
          { label: "false", value: "false" },
        ],
      },
    ],
    inputs: [
      { key: "text", label: "text", type: "text", direction: "input" },
      { key: "jsonTheme", label: "json(theme)", type: "json", direction: "input", optional: true },
      { key: "jsonAnimation", label: "json(animation)", type: "json", direction: "input", optional: true },
      { key: "image", label: "image(optional)", type: "image", direction: "input", optional: true },
      { key: "negative", label: "negative(optional)", type: "text", direction: "input", optional: true },
    ],
    outputs: [
      {
        key: "heroArtifact",
        label: "heroArtifact",
        type: "heroArtifact",
        direction: "output",
      },
    ],
  },
  {
    kind: "patchPlanGenerate",
    label: "PatchPlan Generate",
    description: "Create deterministic hero file patch operations",
    category: "Generation",
    accentColor: "#ED8936",
    defaults: {
      workspaceName: "hero-workspace",
      title: "Superhero Landing",
      ctaText: "Launch now",
    },
    fields: [
      {
        key: "workspaceName",
        label: "Workspace Name",
        type: "text",
        placeholder: "hero-workspace",
      },
      {
        key: "title",
        label: "Page Title",
        type: "text",
        placeholder: "Superhero Landing",
      },
      {
        key: "ctaText",
        label: "CTA Text",
        type: "text",
        placeholder: "Launch now",
      },
    ],
    inputs: [
      { key: "heroArtifact", label: "heroArtifact", type: "heroArtifact", direction: "input" },
      { key: "jsonTheme", label: "json(theme)", type: "json", direction: "input", optional: true },
      { key: "jsonAnimation", label: "json(animation)", type: "json", direction: "input", optional: true },
    ],
    outputs: [{ key: "patchPlan", label: "patchPlan", type: "patchPlan", direction: "output" }],
  },
  {
    kind: "workspaceApply",
    label: "Apply Workspace",
    description: "Create workspace and apply patch operations",
    category: "Output",
    accentColor: "#A0AEC0",
    defaults: {
      keepExisting: false,
    },
    fields: [
      {
        key: "keepExisting",
        label: "Keep Existing",
        type: "select",
        options: [
          { label: "false", value: "false" },
          { label: "true", value: "true" },
        ],
      },
    ],
    inputs: [{ key: "patchPlan", label: "patchPlan", type: "patchPlan", direction: "input" }],
    outputs: [{ key: "workspace", label: "workspace", type: "workspace", direction: "output" }],
  },
  {
    kind: "previewRun",
    label: "Run Preview",
    description: "Start local dev server and return preview URL",
    category: "Output",
    accentColor: "#ED64A6",
    defaults: {
      startPort: 3010,
    },
    fields: [
      { key: "startPort", label: "Start Port", type: "number", min: 3010, max: 9999 },
    ],
    inputs: [{ key: "workspace", label: "workspace", type: "workspace", direction: "input" }],
    outputs: [{ key: "preview", label: "preview", type: "preview", direction: "output" }],
  },
  {
    kind: "heroPublish",
    label: "Publish",
    description: "Save published hero record locally",
    category: "Output",
    accentColor: "#38B2AC",
    defaults: {
      titleOverride: "",
    },
    fields: [
      {
        key: "titleOverride",
        label: "Title Override",
        type: "text",
        placeholder: "",
      },
    ],
    inputs: [
      { key: "heroArtifact", label: "heroArtifact", type: "heroArtifact", direction: "input" },
      { key: "workspace", label: "workspace", type: "workspace", direction: "input" },
      { key: "preview", label: "preview", type: "preview", direction: "input" },
    ],
    outputs: [{ key: "json", label: "json(published)", type: "json", direction: "output" }],
  },
];

export function getTemplateByKind(kind: NodeKind) {
  return nodeTemplates.find((template) => template.kind === kind);
}

export function createNodeData(kind: NodeKind): BuilderNodeData {
  const template = getTemplateByKind(kind);

  if (!template) {
    throw new Error(`Unknown node template: ${kind}`);
  }

  return {
    label: template.label,
    kind: template.kind,
    category: template.category,
    config: { ...template.defaults },
    status: "idle",
    output: null,
    logs: [],
  };
}

export function listCategories() {
  return Array.from(new Set(nodeTemplates.map((template) => template.category)));
}
