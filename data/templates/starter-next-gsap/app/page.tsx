import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-6 px-8 py-16">
      <p className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/80">
        Superhero Workspace
      </p>
      <h1 className="text-4xl font-bold text-white">Starter template is ready.</h1>
      <p className="max-w-2xl text-slate-300">
        Open a hero preview route at <code>/preview/[heroId]</code> after patch operations create files in
        <code className="ml-1">src/heroes/&lt;heroId&gt;</code>.
      </p>
      <Link
        href="/preview/default"
        className="rounded-full border border-cyan-400/40 bg-cyan-400/15 px-5 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/25"
      >
        Open default preview
      </Link>
    </main>
  );
}
