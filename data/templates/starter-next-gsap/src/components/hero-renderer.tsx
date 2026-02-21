import type { HeroBundle } from "@/lib/hero-loader";

export function HeroRenderer({ bundle }: { bundle: HeroBundle }) {
  const HeroComponent = bundle.component;

  return (
    <div className="space-y-4">
      <HeroComponent config={bundle.config} animation={bundle.animation} />
      <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-xs text-slate-300">
        <p className="font-semibold text-slate-100">Animation</p>
        <pre className="mt-2 overflow-auto">{JSON.stringify(bundle.animation ?? {}, null, 2)}</pre>
      </div>
    </div>
  );
}
