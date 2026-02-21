import { useState } from "react";
import { MonitorSmartphone, Server, FileText, Database, Settings2, CloudIcon } from "lucide-react";

export function BottomToolbar() {
  const [activeIndex, setActiveIndex] = useState(1);

  const tools = [
    { icon: MonitorSmartphone, tooltip: "Device" },
    { icon: Server, tooltip: "End Device" },
    { icon: FileText, tooltip: "Template" },
    { icon: Database, tooltip: "Data Source" },
    { icon: Settings2, tooltip: "Config" },
    { icon: CloudIcon, tooltip: "Cloud" },
  ];

  return (
    <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center z-10">
      
      {/* Tooltip for active item */}
      <div className="mb-2 rounded-full bg-[#20222a] px-3 py-1 text-xs font-semibold text-[#E2E8F0] shadow-lg border border-[#2D313A] pointer-events-auto">
        {tools[activeIndex].tooltip}
      </div>

      {/* Main Toolbar Dock */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-[20px] border border-[#2D313A] bg-[#15171e]/90 p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {tools.map((tool, index) => {
          const isActive = index === activeIndex;
          const Icon = tool.icon;
          
          return (
            <div key={index} className="relative flex flex-col items-center">
              <button
                onClick={() => setActiveIndex(index)}
                className={`relative flex h-12 w-14 items-center justify-center rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-[#252834] text-white" 
                    : "text-[#718096] hover:bg-[#1A202C] hover:text-[#A0AEC0]"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.5} />
              </button>
              
              {/* Active Dot Indicator */}
              <div 
                className={`absolute -bottom-1 h-1 w-1 rounded-full transition-all duration-300 ${
                  isActive ? "bg-[#4299E1] opacity-100 shadow-[0_0_8px_#4299E1]" : "opacity-0"
                }`} 
              />
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
