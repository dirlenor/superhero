import { useMemo, useState } from "react";
import {
  CloudIcon,
  Database,
  FileText,
  History,
  PanelLeft,
  Play,
  Settings2,
} from "lucide-react";

interface BottomToolbarProps {
  isPaletteVisible: boolean;
  isRunHistoryVisible: boolean;
  isRunningConnected: boolean;
  onTogglePalette: () => void;
  onToggleRunHistory: () => void;
  onRunConnected: () => void;
}

export function BottomToolbar({
  isPaletteVisible,
  isRunHistoryVisible,
  isRunningConnected,
  onTogglePalette,
  onToggleRunHistory,
  onRunConnected,
}: BottomToolbarProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const tools = useMemo(
    () => [
      {
        icon: PanelLeft,
        tooltip: isPaletteVisible ? "Hide Node Palette" : "Show Node Palette",
        active: isPaletteVisible,
        onClick: onTogglePalette,
      },
      {
        icon: History,
        tooltip: isRunHistoryVisible ? "Hide Run History" : "Show Run History",
        active: isRunHistoryVisible,
        onClick: onToggleRunHistory,
      },
      { icon: FileText, tooltip: "Template" },
      { icon: Database, tooltip: "Data Source" },
      { icon: Settings2, tooltip: "Config" },
      { icon: CloudIcon, tooltip: "Cloud" },
      {
        icon: Play,
        tooltip: isRunningConnected ? "Running nodes..." : "Run Selected / Connected",
        active: isRunningConnected,
        onClick: onRunConnected,
        variant: "run" as const,
        label: isRunningConnected ? "Running..." : "Run",
      },
    ],
    [
      isPaletteVisible,
      isRunHistoryVisible,
      isRunningConnected,
      onTogglePalette,
      onToggleRunHistory,
      onRunConnected,
    ]
  );

  return (
    <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
      <div className="pointer-events-auto mb-2 rounded-full bg-[#20222a] px-3 py-1 text-xs font-semibold text-[#E2E8F0] shadow-lg">
        {tools[activeIndex].tooltip}
      </div>

      <div className="pointer-events-auto flex items-center gap-1 rounded-[20px] bg-[#15171e]/90 p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          const isActive = typeof tool.active === "boolean" ? tool.active : index === activeIndex;
          const isRunTool = tool.variant === "run";

          return (
            <div key={tool.tooltip} className="relative flex flex-col items-center">
              <button
                type="button"
                aria-label={tool.tooltip}
                title={tool.tooltip}
                onClick={() => {
                  setActiveIndex(index);
                  tool.onClick?.();
                }}
                className={
                  isRunTool
                    ? `relative flex h-12 w-36 items-center justify-center gap-2 rounded-xl border border-[#d8dee8] bg-white px-4 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#edf1f7] ${
                        isActive ? "shadow-[0_0_0_1px_rgba(255,255,255,0.9),0_8px_20px_rgba(255,255,255,0.2)]" : ""
                      }`
                    : `relative flex h-12 w-14 items-center justify-center rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-[#252834] text-white"
                          : "text-[#718096] hover:bg-[#1A202C] hover:text-[#A0AEC0]"
                      }`
                }
              >
                <Icon className={isRunTool ? "h-[18px] w-[18px]" : "h-[22px] w-[22px]"} strokeWidth={1.8} />
                {isRunTool ? <span>{tool.label}</span> : null}
              </button>

              {!isRunTool ? (
                <div
                  className={`absolute -bottom-1 h-1 w-1 rounded-full transition-all duration-300 ${
                    isActive ? "bg-[#4299E1] opacity-100 shadow-[0_0_8px_#4299E1]" : "opacity-0"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
