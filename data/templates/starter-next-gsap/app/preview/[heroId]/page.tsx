import { notFound } from "next/navigation";

import { HeroRenderer } from "@/components/hero-renderer";
import { loadHeroBundle } from "@/lib/hero-loader";

interface PreviewPageProps {
  params: Promise<{ heroId: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { heroId } = await params;
  const bundle = await loadHeroBundle(heroId);

  if (!bundle) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Preview</p>
          <h1 className="text-2xl font-bold text-white">{bundle.config.title}</h1>
        </div>
        <p className="text-xs text-slate-400">Hero ID: {bundle.config.heroId}</p>
      </div>

      <HeroRenderer bundle={bundle} />
    </main>
  );
}
