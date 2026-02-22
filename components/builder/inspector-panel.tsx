import { useState } from "react";
import { ClipboardPaste, Copy, ImagePlus, Settings2, Terminal } from "lucide-react";

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
  const [imageHelperText, setImageHelperText] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const outputText = JSON.stringify(
    output ?? { message: "No output generated yet." },
    (key, value) => {
      if (typeof value === "string" && value.startsWith("data:image/") && value.length > 100) {
        return "<base64 image data hidden>";
      }
      return value;
    },
    2
  );
  const outputRecord = (output ?? {}) as Record<string, unknown>;
  const previewRecord = (outputRecord.preview ?? null) as Record<string, unknown> | null;
  const workspaceRecord = (outputRecord.workspace ?? null) as Record<string, unknown> | null;
  const patchPlanRecord = (outputRecord.patchPlan ?? null) as Record<string, unknown> | null;
  const previewUrl =
    (typeof previewRecord?.url === "string" && previewRecord.url) ||
    (typeof outputRecord.url === "string" ? outputRecord.url : null);
  const workspacePath =
    (typeof workspaceRecord?.path === "string" && workspaceRecord.path) ||
    (typeof outputRecord.path === "string" ? outputRecord.path : null);
  const patchOpsCount =
    patchPlanRecord && Array.isArray(patchPlanRecord.ops) ? patchPlanRecord.ops.length : null;

  const fallbackCopyText = (value: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  };

  const onCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopyState("copied");
    } catch {
      const ok = fallbackCopyText(outputText);
      setCopyState(ok ? "copied" : "failed");
    }

    window.setTimeout(() => {
      setCopyState("idle");
    }, 1400);
  };

  const handleImageFilePick = (file: File | null) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value === "string") {
        onConfigChange("imagePath", value);
        setImageHelperText(`Loaded ${file.name}`);
      }
    };
    reader.onerror = () => {
      setImageHelperText("Unable to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handlePasteClipboardImage = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));
        if (!imageType) {
          continue;
        }

        const blob = await item.getType(imageType);
        const file = new File([blob], `clipboard.${imageType.split("/")[1] ?? "png"}`, {
          type: imageType,
        });
        handleImageFilePick(file);
        return;
      }

      setImageHelperText("No image found in clipboard");
    } catch {
      setImageHelperText("Clipboard access was denied");
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

            {template.kind === "imageInput" ? (
              <div className="space-y-3 rounded-lg border border-[#2D313A] bg-[#0E1015] p-3">
                <p className="text-xs font-semibold text-[#d5e4ff]">Image Source</p>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-[#2D313A] bg-[#13151A] px-3 py-2 text-xs font-medium text-[#A0AEC0] hover:text-white">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Upload image file
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      handleImageFilePick(event.target.files?.[0] ?? null);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    void handlePasteClipboardImage();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[#2D313A] bg-[#13151A] px-3 py-2 text-xs font-medium text-[#A0AEC0] hover:text-white"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste image from clipboard
                </button>

                {typeof config.imagePath === "string" && config.imagePath.trim() ? (
                  <div className="overflow-hidden rounded-md border border-[#2D313A] bg-[#10141d] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.imagePath}
                      alt="Image preview"
                      className="max-h-44 w-full rounded object-contain"
                    />
                  </div>
                ) : null}

                {imageHelperText ? (
                  <p className="text-[11px] text-[#8fa2cb]">{imageHelperText}</p>
                ) : null}
              </div>
            ) : null}
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
                {copyState === "copied" ? "Copied" : copyState === "failed" ? "Failed" : "Copy"}
              </button>
            </div>
            <pre className="max-h-[400px] overflow-auto text-xs leading-relaxed text-[#A0AEC0] scrollbar-thin">
              {previewUrl ? (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-3 inline-flex rounded-full border border-cyan-400/40 bg-cyan-400/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-100"
                >
                  Open Preview URL
                </a>
              ) : null}
              {workspacePath ? (
                <p className="mb-3 rounded-md border border-[#2D313A] bg-[#13151A] px-2 py-1 text-[11px] text-[#9fb0cf]">
                  Workspace: {workspacePath}
                </p>
              ) : null}
              {patchOpsCount !== null ? (
                <p className="mb-3 rounded-md border border-[#2D313A] bg-[#13151A] px-2 py-1 text-[11px] text-[#9fb0cf]">
                  Patch ops: {patchOpsCount}
                </p>
              ) : null}
              {outputText}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
