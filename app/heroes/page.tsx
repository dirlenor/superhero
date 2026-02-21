import Link from "next/link";
import Image from "next/image";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return value.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HeroesPage() {
  const heroes = await db.hero.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 text-[#e7edf9]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#8aa1cc]">Published</p>
          <h1 className="text-3xl font-bold text-white">Heroes</h1>
        </div>
        <Link
          href="/builder"
          className="rounded-full border border-[#2d313a] bg-[#13151a] px-4 py-2 text-xs font-semibold text-[#d3def7] hover:text-white"
        >
          Back to Builder
        </Link>
      </div>

      {heroes.length === 0 ? (
        <p className="rounded-xl border border-[#2d313a] bg-[#10131a] p-5 text-sm text-[#9bb0d8]">
          No published heroes yet. Run the workflow through Publish node first.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {heroes.map((hero) => (
            <article key={hero.id} className="overflow-hidden rounded-2xl border border-[#2d313a] bg-[#10131a]">
              <div className="aspect-[16/9] w-full bg-[#0b0d12]">
                {hero.thumbnailPath ? (
                  <Image
                    src={`/api/heroes/thumbnail?path=${encodeURIComponent(hero.thumbnailPath)}`}
                    alt={hero.title}
                    width={960}
                    height={540}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <h2 className="text-base font-semibold text-white">{hero.title}</h2>
                <p className="text-xs text-[#9bb0d8]">Hero ID: {hero.heroId}</p>
                <p className="text-xs text-[#8aa1cc]">Published: {formatDate(hero.createdAt)}</p>
                <a
                  href={hero.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full border border-cyan-400/40 bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/25"
                >
                  Open Preview
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
