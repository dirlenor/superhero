import { promises as fs } from "fs";
import { createRequire } from "module";
import path from "path";
import vm from "vm";

import type { ComponentType } from "react";
import { transformSync } from "esbuild";

export interface HeroConfig {
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
}

export interface HeroBundle {
  config: HeroConfig;
  component: ComponentType<{ config: HeroConfig; animation?: Record<string, unknown> }>;
  animation?: Record<string, unknown>;
}

const runtimeRequire = createRequire(import.meta.url);

function sanitizeHeroId(heroId: string) {
  return heroId
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "default";
}

function projectRoot() {
  return process.cwd();
}

function heroRoot(heroId: string) {
  return path.join(projectRoot(), "src", "heroes", sanitizeHeroId(heroId));
}

function executeModule(source: string, filename: string, loader: "tsx" | "ts") {
  const transformed = transformSync(source, {
    loader,
    jsx: "automatic",
    format: "cjs",
    target: "es2020",
    sourcemap: false,
  });

  const module = { exports: {} as Record<string, unknown> };
  const sandbox = {
    module,
    exports: module.exports,
    require: (id: string) => {
      if (id === "react" || id === "react/jsx-runtime") {
        return runtimeRequire(id);
      }
      throw new Error(`Unsupported import in runtime hero module: ${id}`);
    },
    process,
    console,
    __dirname: path.dirname(filename),
    __filename: filename,
  };

  vm.runInNewContext(transformed.code, sandbox, { filename });
  return module.exports;
}

function fallbackComponent() {
  const React = runtimeRequire("react") as typeof import("react");
  return function MissingHero({ config }: { config: HeroConfig }) {
    return React.createElement(
      "section",
      { className: "rounded-2xl border border-rose-400/40 bg-rose-500/10 p-8 text-rose-100" },
      React.createElement("h2", { className: "text-2xl font-bold" }, "Hero component missing"),
      React.createElement(
        "p",
        { className: "mt-2 text-sm" },
        `Cannot evaluate Hero.tsx for ${config.heroId}.`
      )
    );
  };
}

export async function loadHeroBundle(heroIdRaw: string): Promise<HeroBundle | null> {
  const heroId = sanitizeHeroId(heroIdRaw);
  const root = heroRoot(heroId);
  const configPath = path.join(root, "config.json");
  const heroComponentPath = path.join(root, "Hero.tsx");
  const animationPath = path.join(root, "animation.ts");

  try {
    await fs.access(configPath);
    await fs.access(heroComponentPath);
  } catch {
    return null;
  }

  const configRaw = await fs.readFile(configPath, "utf8");
  const config = JSON.parse(configRaw) as HeroConfig;

  const heroSource = await fs.readFile(heroComponentPath, "utf8");
  let component = fallbackComponent();
  try {
    const moduleExports = executeModule(heroSource, heroComponentPath, "tsx") as {
      default?: ComponentType<{ config: HeroConfig; animation?: Record<string, unknown> }>;
      Hero?: ComponentType<{ config: HeroConfig; animation?: Record<string, unknown> }>;
    };
    component = moduleExports.default ?? moduleExports.Hero ?? fallbackComponent();
  } catch {
    component = fallbackComponent();
  }

  let animation: Record<string, unknown> | undefined;
  try {
    const animationSource = await fs.readFile(animationPath, "utf8");
    const moduleExports = executeModule(animationSource, animationPath, "ts") as {
      default?: (config: HeroConfig["animation"]) => Record<string, unknown>;
      applyHeroAnimation?: (config: HeroConfig["animation"]) => Record<string, unknown>;
    };
    const runAnimation = moduleExports.default ?? moduleExports.applyHeroAnimation;
    if (typeof runAnimation === "function") {
      animation = runAnimation(config.animation ?? {});
    }
  } catch {
    animation = undefined;
  }

  return {
    config,
    component,
    animation,
  };
}
