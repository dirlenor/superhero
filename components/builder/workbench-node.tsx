import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle2, Play, AlertCircle, Loader2 } from "lucide-react";

import { useBuilderActions } from "@/components/builder/builder-actions-context";
import type { FlowNode } from "@/components/builder/types";
import { getTemplateByKind } from "@/engine/node-registry";
import { createHandleId } from "@/engine/ports";

const portColorMap: Record<string, string> = {
  image: "#4299E1", // Blue
  text: "#48BB78", // Green
  json: "#ECC94B", // Yellow
  patchPlan: "#ED8936", // Orange
  workspace: "#A0AEC0", // Gray
  preview: "#ED64A6", // Pink
  heroArtifact: "#9F7AEA", // Purple
};

export function WorkbenchNode({ id, data, selected }: NodeProps<FlowNode>) {
  const { runNode } = useBuilderActions();
  const template = getTemplateByKind(data.kind);

  if (!template) {
    return null;
  }

  // Find a dominant color from ports to use as glow or header dot
  let mainColor = "#A0AEC0";
  if (template.outputs.length > 0) mainColor = portColorMap[template.outputs[0].type] || mainColor;
  else if (template.inputs.length > 0) mainColor = portColorMap[template.inputs[0].type] || mainColor;

  return (
    <div
      className="min-w-[280px] rounded-[18px] border bg-[#15171e] text-white shadow-xl transition-shadow"
      style={{
        borderColor: selected ? mainColor : "#2D313A",
        boxShadow: selected
          ? `0 0 0 1px ${mainColor}40, 0 10px 25px -5px rgba(0,0,0,0.8), 0 0 20px ${mainColor}15`
          : "0 10px 25px -5px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2D313A] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: mainColor, boxShadow: `0 0 6px ${mainColor}` }} />
          <p className="font-[var(--font-sora)] text-[13px] font-medium tracking-wide text-[#E2E8F0]">{data.label}</p>
        </div>
        
        {/* Action Button styled like the green + Generate button */}
        {data.kind === "prompt" || data.kind === "imageInput" || data.kind === "generateHero" ? (
           <button
             type="button"
             onClick={() => runNode(id)}
             className="nodrag flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold tracking-wider transition-colors"
             style={{
               backgroundColor: `${mainColor}25`,
               color: mainColor,
               border: `1px solid ${mainColor}40`
             }}
           >
             <Play className="h-3 w-3" />
             {data.status === 'running' ? 'Running' : 'Generate'}
           </button>
        ) : (
          <div className="flex items-center justify-center">
            {data.status === 'success' && <CheckCircle2 className="h-4 w-4 text-[#48BB78]" />}
            {data.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-[#ECC94B]" />}
            {data.status === 'error' && <AlertCircle className="h-4 w-4 text-[#F56565]" />}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4">
        
        {/* Ports Row */}
        {(template.inputs.length > 0 || template.outputs.length > 0) && (
          <div className="flex justify-between text-[11px] font-medium tracking-wide">
            
            <div className="flex flex-col gap-3">
              {template.inputs.map((port) => {
                const handleId = createHandleId("input", port.key, port.type);
                const color = portColorMap[port.type] || "#A0AEC0";
                return (
                  <div key={handleId} className="relative flex items-center h-4">
                    <Handle
                      type="target"
                      id={handleId}
                      position={Position.Left}
                      style={{ backgroundColor: color, borderColor: "#15171e", left: "-22px" }}
                      className="!w-[10px] !h-[10px] !border-[2px]"
                    />
                    <span className="text-[#A0AEC0]">{port.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-end gap-3">
              {template.outputs.map((port) => {
                const handleId = createHandleId("output", port.key, port.type);
                const color = portColorMap[port.type] || "#A0AEC0";
                return (
                  <div key={handleId} className="relative flex items-center justify-end h-4">
                    <span className="text-[#E2E8F0]">{port.label}</span>
                    <Handle
                      type="source"
                      id={handleId}
                      position={Position.Right}
                      style={{ backgroundColor: color, borderColor: "#15171e", right: "-22px" }}
                      className="!w-[10px] !h-[10px] !border-[2px]"
                    />
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Inline Controls (mocking the inputs inside nodes in the image) */}
        {Object.entries(data.config).slice(0, 2).map(([key, value]) => {
            const isText = typeof value === 'string' && value.length > 20;
            return (
              <div key={key} className="mt-2 text-xs">
                {isText ? (
                  <div className="text-[#A0AEC0] mb-2">{value}</div>
                ) : null}
                
                <div className="rounded-lg bg-[#0E1015] px-3 py-2 text-[#718096] flex justify-between items-center border border-[#1e212b]">
                   <span>{isText ? 'Type what you want to get' : key}</span>
                   {!isText && <span className="text-[#E2E8F0]">{String(value)}</span>}
                </div>
              </div>
            );
        })}

      </div>
    </div>
  );
}
