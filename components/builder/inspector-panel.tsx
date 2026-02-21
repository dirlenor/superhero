import { useState } from "react";
import { Copy, Settings2, Terminal } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NodeTemplate } from "@/engine/node-registry";
import type { NodeConfigValue } from "@/engine/types";

interface InspectorPanelProps {
  selectedNodeLabel: string | null;
  template: NodeTemplate | null;
  config: Record<string, NodeConfigValue> | null;
  output: Record<string, unknown> | null;
  onLabelChange: (value: string) => void;
  onConfigChange: (key: string, value: NodeConfigValue) => void;
}

export function InspectorPanel({
  selectedNodeLabel,
  template,
  config,
  output,
  onLabelChange,
  onConfigChange,
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<"config" | "output">("config");

  const outputText = JSON.stringify(output ?? { message: "No output generated yet." }, null, 2);

  const onCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
    } catch {
    }
  };

  if (!template || !config || !selectedNodeLabel) {
    return (
      <aside className="flex h-full flex-col p-6 text-center justify-center items-center">
        <Settings2 className="h-8 w-8 text-[#4A5568] mb-3 opacity-50" />
        <p className="font-[var(--font-sora)] text-sm font-semibold text-[#A0AEC0]">Inspector</p>
        <p className="mt-2 text-xs text-[#718096]">Select a node on the canvas to configure</p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col">
      <div className="p-5 border-b border-[#2D313A]">
        <p className="font-[var(--font-sora)] text-sm font-semibold text-[#E2E8F0]">Inspector</p>
        <p className="text-xs text-[#A0AEC0] mt-1">Node: {template.label}</p>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        <div className="mb-6 flex rounded-lg bg-[#0E1015] p-1 border border-[#2D313A]">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "config" ? "bg-[#1A202C] text-[#F7FAFC] shadow-sm" : "text-[#718096] hover:text-[#A0AEC0]"
            }`}
            onClick={() => setActiveTab("config")}
          >
            Config
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === "output" ? "bg-[#1A202C] text-[#F7FAFC] shadow-sm" : "text-[#718096] hover:text-[#A0AEC0]"
            }`}
            onClick={() => setActiveTab("output")}
          >
            Output
          </button>
        </div>

        {activeTab === "config" ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[#A0AEC0]">Display Label</Label>
              <Input
                value={selectedNodeLabel}
                onChange={(event) => onLabelChange(event.target.value)}
                className="bg-[#0E1015] border-[#2D313A] text-[#E2E8F0]"
              />
            </div>

            {template.fields.map((field) => {
              const fieldValue = config[field.key];

              if (field.type === "textarea") {
                return (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-[#A0AEC0]">{field.label}</Label>
                    <Textarea
                      value={String(fieldValue ?? "")}
                      placeholder={field.placeholder}
                      onChange={(event) => onConfigChange(field.key, event.target.value)}
                      className="bg-[#0E1015] border-[#2D313A] text-[#E2E8F0] min-h-[100px]"
                    />
                  </div>
                );
              }

              if (field.type === "select") {
                return (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-[#A0AEC0]">{field.label}</Label>
                    <select
                      value={String(fieldValue ?? "")}
                      onChange={(event) => onConfigChange(field.key, event.target.value)}
                      className="flex h-9 w-full rounded-md border border-[#2D313A] bg-[#0E1015] px-3 py-1 text-sm text-[#E2E8F0] shadow-sm transition-colors outline-none focus-visible:border-[#4299E1] focus-visible:ring-1 focus-visible:ring-[#4299E1]"
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.type === "number") {
                return (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-[#A0AEC0]">{field.label}</Label>
                    <Input
                      type="number"
                      min={field.min}
                      max={field.max}
                      value={Number(fieldValue ?? 0)}
                      onChange={(event) => onConfigChange(field.key, Number(event.target.value))}
                      className="bg-[#0E1015] border-[#2D313A] text-[#E2E8F0]"
                    />
                  </div>
                );
              }

              return (
                <div key={field.key} className="space-y-2">
                  <Label className="text-[#A0AEC0]">{field.label}</Label>
                  <Input
                    value={String(fieldValue ?? "")}
                    placeholder={field.placeholder}
                    onChange={(event) => onConfigChange(field.key, event.target.value)}
                    className="bg-[#0E1015] border-[#2D313A] text-[#E2E8F0]"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-[#2D313A] bg-[#0E1015] p-4">
            <div className="mb-3 flex items-center justify-between text-[#A0AEC0]">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                <p className="text-xs font-semibold">Node Output</p>
              </div>
              <button
                type="button"
                onClick={onCopyOutput}
                className="inline-flex items-center gap-1 rounded-md border border-[#2D313A] bg-[#13151A] px-2 py-1 text-[11px] font-medium text-[#A0AEC0] transition-colors hover:text-white"
              >
                <Copy className="h-3 w-3" />
                Copy
              </button>
            </div>
            <pre className="max-h-[400px] overflow-auto text-xs leading-relaxed text-[#A0AEC0] scrollbar-thin">
              {outputText}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
