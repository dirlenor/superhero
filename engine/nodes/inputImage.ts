import { promises as fs } from "fs";
import path from "path";

import type { NodeDefinition } from "@/engine/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are a senior art director and expert prompt engineer for AI image generation.

Analyze the provided image and return ONLY strict valid JSON (no markdown, no explanation, no extra text).

Return exactly this schema:

{
  "prompt": "One single-line English generation prompt that recreates the scene as a premium 16:9 website hero banner. Must include subject placement, depth layers, composition, camera framing, lens (mm), lighting setup, material detail, color palette, rendering quality, and mood.",
  "negative_prompt": "One single-line English list of visual defects and unwanted elements to avoid.",
  "layout": {
    "aspect_ratio": "16:9",
    "safe_text_area": "Describe exact negative space reserved for headline and CTA (e.g., right 40% clean soft gradient background).",
    "subject_placement": "Precise placement, scale, and focal priority of main subject(s)."
  },
  "camera": {
    "framing": "e.g., medium-wide, wide banner, cinematic crop",
    "lens_mm": "e.g., 24mm, 35mm",
    "angle": "e.g., eye-level, slight low angle",
    "depth_of_field": "e.g., shallow DOF with soft background blur"
  },
  "lighting": {
    "setup": "e.g., soft key light from left + subtle rim light",
    "softness": "soft / diffused / crisp",
    "color_temperature": "warm / neutral / cool",
    "time_of_day_feel": "morning / studio / sunset / abstract ambient"
  },
  "style": {
    "medium": "photoreal | 3d_render | illustration | mixed",
    "render_quality": "ultra-detailed, commercial-grade, crisp",
    "palette": ["color1", "color2", "color3"],
    "mood": "3–6 descriptive adjectives"
  },
  "details_to_preserve": ["List 5–12 critical visual elements that must remain consistent."]
}

Strict rules:
- Be extremely specific and concrete. Avoid vague words like “beautiful”.
- Do NOT mention analyzing an image.
- Do NOT include brand names, camera brands, or artist names.
- "prompt" and "negative_prompt" must be single-line strings (no line breaks).
- Output must be valid JSON that can be parsed programmatically.`;

const USER_PROMPT_TEXT =
  "Reconstruct this as a high-end modern website hero banner. Preserve materials, lighting direction, composition logic, and visual hierarchy. Ensure clean negative space for headline and CTA.";

function guessMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

function sanitizePath(inputPath: string) {
  return inputPath.replace(/^\/+/, "");
}

async function resolveLocalPath(imagePath: string) {
  const cleaned = sanitizePath(imagePath);
  const candidates = [
    path.isAbsolute(imagePath) ? imagePath : path.resolve(process.cwd(), cleaned),
    path.resolve(process.cwd(), "public", cleaned),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

async function toImageUrl(imagePath: string) {
  if (/^data:image\//i.test(imagePath)) {
    return imagePath;
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const resolvedPath = await resolveLocalPath(imagePath);
  if (!resolvedPath) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  const bytes = await fs.readFile(resolvedPath);
  const mimeType = guessMimeType(resolvedPath);
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

function extractTextContent(content: unknown) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }
        const text = (item as { type?: string; text?: string }).text;
        return typeof text === "string" ? text : "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

function parseStructuredPrompt(raw: string) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    throw new Error("OpenRouter response is not valid JSON.");
  }
}

export const inputImageNode: NodeDefinition = {
  type: "input.image",
  displayName: "Image Input",
  category: "Inputs",
  inputs: {},
  outputs: {
    image: "image",
    text: "text",
  },
  async run({ config, log }) {
    const mode = String(config.mode ?? "visionPrompt");
    const imagePath = String(config.imagePath ?? "").trim();

    if (!imagePath) {
      throw new Error("imagePath is required");
    }

    if (mode === "passthrough") {
      log(`Resolved image path: ${imagePath} (passthrough)`);
      return {
        image: { path: imagePath },
        text: "",
      };
    }

    const model = String(config.openRouterModel ?? "qwen/qwen3-vl-235b-a22b-thinking").trim();
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY is missing. Add it to your environment before running image prompt extraction.");
    }

    const imageUrl = await toImageUrl(imagePath);
    log(`Extracting prompt with model ${model}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    let response: Response;
    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 1200,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: USER_PROMPT_TEXT,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                  },
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("OpenRouter request timed out after 120s");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await response.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `OpenRouter request failed (${response.status})`);
    }

    const rawOutput = extractTextContent(payload.choices?.[0]?.message?.content);
    if (!rawOutput) {
      throw new Error("OpenRouter returned empty response.");
    }

    const structured = parseStructuredPrompt(rawOutput);
    const prompt = typeof structured.prompt === "string" ? structured.prompt.trim() : "";
    if (!prompt) {
      throw new Error("OpenRouter JSON does not contain a valid 'prompt' field.");
    }

    log(`Resolved image path: ${imagePath}`);
    log(`Extracted prompt (${prompt.length} chars)`);

    return {
      image: { path: imagePath },
      text: prompt,
      analysis: structured,
    };
  },
};
