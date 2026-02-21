import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";

const mockWorkflows = [
  {
    id: "wf-hero-launch",
    name: "Hero Launch Banner",
    updatedAt: "Today 09:42",
    nodes: 7,
    description: "Sci-fi theme with a cinematic call-to-action",
  },
  {
    id: "wf-retro-comic",
    name: "Retro Comic Teaser",
    updatedAt: "Yesterday 20:10",
    nodes: 5,
    description: "High contrast with a halftone treatment",
  },
  {
    id: "wf-neon-lineup",
    name: "Neon Team Lineup",
    updatedAt: "3 days ago",
    nodes: 9,
    description: "Multi-hero lineup composition for a landing page",
  },
];

export default function WorkflowsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-6">
      <div className="glass-card mb-6 rounded-xl p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#16233f] text-[#65e1ff]">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="font-[var(--font-sora)] text-xl font-semibold text-[#f2f7ff]">
              Workflow Library
            </h1>
            <p className="text-sm text-[#94a4c4]">Mock page for browsing previously created workflows.</p>
          </div>
        </div>

        <Link
          href="/builder"
          className="inline-flex items-center gap-2 rounded-md border border-[#2b3b5f] bg-[#0d1528] px-3 py-2 text-sm font-semibold text-[#dce8ff] transition hover:bg-[#121d35]"
        >
          Open Builder
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4">
        {mockWorkflows.map((workflow) => (
          <article key={workflow.id} className="glass-card rounded-xl p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="font-[var(--font-sora)] text-lg font-semibold text-[#edf4ff]">
                  {workflow.name}
                </h2>
                <p className="text-sm text-[#93a6cc]">{workflow.description}</p>
              </div>

              <div className="rounded-full border border-[#2c3d61] bg-[#0a1223] px-3 py-1 text-xs font-semibold text-[#a0b4dd]">
                {workflow.nodes} nodes
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs text-[#7f92ba]">
              <Clock3 className="size-3.5" />
              Last updated: {workflow.updatedAt}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
