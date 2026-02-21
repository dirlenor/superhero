import type { NodeDefinition } from "@/engine/types";
import { createPatchPlan } from "@/engine/workspace-manager";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function toStringValue(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function buildHeroTsx() {
  return `type HeroConfig = {
  heroId: string;
  title: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  theme: {
    primaryColor: string;
    fontPreset?: string;
    theme?: "dark" | "light";
  };
  animation?: {
    preset?: string;
    speed?: number;
    intensity?: number;
  };
  image?: {
    path?: string;
  };
};

export default function Hero({ config }: { config: HeroConfig }) {
  const backgroundImage = "linear-gradient(135deg, " + config.theme.primaryColor + "40, #090C14 60%, #040608 100%)";

  return (
    <section className="relative min-h-[72vh] overflow-hidden rounded-3xl border border-white/10 px-8 py-14 shadow-[0_30px_80px_rgba(0,0,0,0.5)]" style={{ backgroundImage }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: config.theme.primaryColor + "55" }} />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl space-y-6">
          <p className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs tracking-[0.18em] text-white/80 uppercase">
            {config.title}
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
            {config.headline}
          </h1>
          <p className="max-w-xl text-base text-slate-200 md:text-lg">
            {config.subheadline}
          </p>
          <button className="rounded-full px-6 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90" style={{ backgroundColor: config.theme.primaryColor }}>
            {config.ctaText}
          </button>
        </div>

        {config.image?.path ? (
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-black/30 p-2">
            <img src={config.image.path} alt={config.title} className="h-[380px] w-full rounded-xl object-cover" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
`;
}

function buildAnimationTs() {
  return `export default function applyHeroAnimation(config: { preset?: string; speed?: number; intensity?: number }) {
  return {
    enabled: true,
    preset: config.preset ?? "fadeUp",
    speed: config.speed ?? 1,
    intensity: config.intensity ?? 60,
  };
}
`;
}

export const patchPlanGenerateNode: NodeDefinition = {
  type: "patchplan.generate",
  displayName: "PatchPlan Generate",
  category: "Generation",
  inputs: {
    heroArtifact: "heroArtifact",
    jsonTheme: "json",
    jsonAnimation: "json",
  },
  optionalInputs: ["jsonTheme", "jsonAnimation"],
  outputs: {
    patchPlan: "patchPlan",
  },
  async run({ config, inputs, log }) {
    const artifact = asRecord(inputs.heroArtifact);
    if (!artifact) {
      throw new Error("patchplan.generate requires heroArtifact input");
    }

    const heroId = toStringValue(artifact.heroId, "hero_generated");
    const prompt = toStringValue(artifact.prompt, "Build a bold superhero landing section");
    const title = toStringValue(config.title, "Superhero Landing");
    const ctaText = toStringValue(config.ctaText, "Launch now");
    const workspaceName = toStringValue(config.workspaceName, "hero-workspace");

    const theme =
      asRecord(inputs.jsonTheme) ??
      asRecord(artifact.theme) ?? {
        theme: "dark",
        primaryColor: "#22d3ee",
        fontPreset: "cinematic-sans",
      };

    const animation =
      asRecord(inputs.jsonAnimation) ??
      asRecord(artifact.animation) ?? {
        preset: "fadeUp",
        speed: 1,
        intensity: 60,
      };

    const image = asRecord(artifact.image);
    const negativePrompt = toStringValue(artifact.negativePrompt, "");
    const headline = prompt.length > 90 ? `${prompt.slice(0, 87)}...` : prompt;
    const subheadline =
      negativePrompt
        ? `Optimized for clarity and impact. Avoid: ${negativePrompt}.`
        : "Optimized for clarity, motion, and conversion-ready messaging.";

    const configJson = {
      heroId,
      title,
      headline,
      subheadline,
      ctaText,
      theme,
      animation,
      ...(image ? { image } : {}),
    };

    const heroRoot = `src/heroes/${heroId}`;
    const plan = createPatchPlan(
      [
        { kind: "mkdir", path: heroRoot },
        {
          kind: "write",
          path: `${heroRoot}/Hero.tsx`,
          content: buildHeroTsx(),
        },
        {
          kind: "write",
          path: `${heroRoot}/config.json`,
          content: `${JSON.stringify(configJson, null, 2)}\n`,
        },
        {
          kind: "write",
          path: `${heroRoot}/animation.ts`,
          content: buildAnimationTs(),
        },
      ],
      heroId,
      workspaceName
    );

    log(`Generated patch plan for ${heroId} with ${plan.ops.length} ops`);
    return {
      patchPlan: plan,
    };
  },
};
