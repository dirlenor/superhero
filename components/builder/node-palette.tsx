import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NodeTemplate } from "@/engine/node-registry";
import type { NodeCategory, NodeKind } from "@/engine/types";

interface NodePaletteProps {
  templates: NodeTemplate[];
  query: string;
  onQueryChange: (query: string) => void;
  onAddNode: (kind: NodeKind) => void;
}

export function NodePalette({
  templates,
  query,
  onQueryChange,
  onAddNode,
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
    <aside className="glass-card flex h-full min-h-[560px] flex-col rounded-xl p-3">
      <div className="mb-3">
        <p className="font-[var(--font-sora)] text-sm font-semibold text-[#eef5ff]">Node Palette</p>
        <p className="text-xs text-[#8fa2cb]">Search and add nodes to the canvas</p>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#6980af]" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search nodes..."
          className="pl-8"
        />
      </div>

      <div className="space-y-4 overflow-y-auto pr-1">
        {(Object.entries(groupedTemplates) as [NodeCategory, NodeTemplate[]][]).map(
          ([category, items]) => {
            if (!items.length) {
              return null;
            }

            return (
              <section key={category} className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#7f90b3] uppercase">
                  {category}
                </p>

                <div className="space-y-2">
                  {items.map((template) => (
                    <div
                      key={template.kind}
                      className="rounded-lg border border-[#253455] bg-[#0c1427] p-2.5"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#e8f0ff]">{template.label}</p>
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: template.accentColor }}
                        />
                      </div>
                      <p className="mb-3 text-xs text-[#8fa2cb]">{template.description}</p>
                      <Button size="sm" className="w-full" onClick={() => onAddNode(template.kind)}>
                        <Plus className="size-4" />
                        Add Node
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            );
          }
        )}
      </div>
    </aside>
  );
}
