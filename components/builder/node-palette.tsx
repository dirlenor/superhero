import {
  Ban,
  Combine,
  FileCode2,
  FolderCog,
  Image as ImageIcon,
  MonitorPlay,
  Palette,
  PlaySquare,
  Rocket,
  Search,
  Sparkles,
  Type,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import type { NodeTemplate } from "@/engine/node-registry";
import type { NodeCategory, NodeKind } from "@/engine/types";

interface NodePaletteProps {
  templates: NodeTemplate[];
  query: string;
  onQueryChange: (query: string) => void;
  onAddNode: (kind: NodeKind) => void;
  onDragNodeStart: (kind: NodeKind) => void;
  onDragNodeEnd: () => void;
}

const DRAG_NODE_MIME = "application/x-superhero-node-kind";

const iconMap: Record<NodeKind, React.ElementType> = {
  imageInput: ImageIcon,
  prompt: Type,
  promptNegative: Ban,
  combinePrompt: Combine,
  theme: Palette,
  animation: PlaySquare,
  generateHero: Sparkles,
  patchPlanGenerate: FileCode2,
  workspaceApply: FolderCog,
  previewRun: MonitorPlay,
  heroPublish: Rocket,
};

export function NodePalette({
  templates,
  query,
  onQueryChange,
  onAddNode,
  onDragNodeStart,
  onDragNodeEnd,
}: NodePaletteProps) {
  const groupedTemplates = templates.reduce<Record<NodeCategory, NodeTemplate[]>>(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }

      acc[template.category].push(template);
      return acc;
    },
    {
      Inputs: [],
      Prompts: [],
      Generation: [],
      Output: [],
    }
  );

  return (
    <aside className="flex h-full min-h-[560px] flex-col rounded-xl p-3">
      <div className="mb-3">
        <p className="font-[var(--font-sora)] text-sm font-semibold text-[#eef5ff]">Node Palette</p>
        <p className="text-xs text-[#8fa2cb]">Select nodes to add</p>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#6980af]" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search nodes..."
          className="pl-8 bg-[#13151A] border-[#2D313A] text-white"
        />
      </div>

      <div className="space-y-6 overflow-y-auto pr-1 pb-4">
        {(Object.entries(groupedTemplates) as [NodeCategory, NodeTemplate[]][]).map(
          ([category, items]) => {
            if (!items.length) {
              return null;
            }

            return (
              <section key={category} className="space-y-3">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#7f90b3] uppercase">
                  {category}
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {items.map((template) => {
                    const Icon = iconMap[template.kind] || Sparkles;
                    
                    return (
                      <button
                        key={template.kind}
                        onClick={() => onAddNode(template.kind)}
                        draggable
                        onDragStart={(event) => {
                          onDragNodeStart(template.kind);
                          event.dataTransfer.setData(DRAG_NODE_MIME, template.kind);
                          event.dataTransfer.setData("text/plain", template.kind);
                          event.dataTransfer.effectAllowed = "copy";
                        }}
                        onDragEnd={onDragNodeEnd}
                        className="group flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border-0 bg-[#13151A] p-3 transition-all hover:bg-[#1A202C] focus:outline-none"
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0B0D12] transition-transform group-hover:scale-110"
                        >
                          <Icon className="size-5" style={{ color: template.accentColor }} />
                        </div>
                        <span className="text-center text-[10px] font-medium leading-tight text-[#A0AEC0] group-hover:text-white">
                          {template.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          }
        )}
      </div>
    </aside>
  );
}
