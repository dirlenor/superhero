import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderOpen,
  LayoutGrid,
  Menu,
  Play,
  Trash2,
  UploadCloud,
} from "lucide-react";

interface WorkbenchTopbarProps {
  onNew: () => void;
  onClearNodes: () => void;
  onLoad: () => void;
  onSave: () => void;
  onExport: () => void;
  onRunWorkflow: () => void;
  runningWorkflow: boolean;
  statusMessage: string;
}

export function WorkbenchTopbar({
  onNew,
  onClearNodes,
  onLoad,
  onSave,
  onExport,
  onRunWorkflow,
  runningWorkflow,
  statusMessage,
}: WorkbenchTopbarProps) {
  return (
    <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-[#2D313A] bg-[#0B0D12] px-4 md:px-6">
      
      {/* Left Section: Logo + Menu */}
      <div className="flex items-center gap-3">
        {/* Logo Mark */}
        <div className="flex items-center gap-3">
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#A0AEC0] to-[#E2E8F0] shadow-[0_0_12px_rgba(226,232,240,0.2)]">
            <div className="h-4 w-4 rounded-full bg-[#0B0D12]" />
          </div>
          
          {/* Superhero Title */}
          <h1 className="text-white text-xl font-bold tracking-tight">
            Superhero
          </h1>
        </div>

        {/* Hamburger Menu */}
        <div className="relative">
          <button 
            onClick={onNew}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#13151A] text-[#A0AEC0] hover:bg-[#1A202C]"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Center Section: Project Name */}
      <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center justify-center gap-1">
        <div className="flex items-center gap-2">
          <button className="flex h-7 w-7 items-center justify-center rounded-full bg-[#13151A] text-[#A0AEC0] hover:bg-[#1A202C]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex h-7 items-center rounded-full bg-[#13151A] px-4 text-xs font-semibold text-[#E2E8F0]">
            Hero Section v.3
          </div>
          <button className="flex h-7 w-7 items-center justify-center rounded-full bg-[#13151A] text-[#A0AEC0] hover:bg-[#1A202C]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-[#718096] tracking-wide">status: {statusMessage}</p>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onLoad}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2D313A] bg-[#13151A] text-[#A0AEC0] hover:text-white"
          title="Load"
        >
          <FolderOpen className="h-4 w-4" />
        </button>

        <button
          onClick={onClearNodes}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2D313A] bg-[#13151A] text-[#A0AEC0] hover:text-white"
          title="Clear Nodes"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <Link
          href="/heroes"
          className="flex h-9 items-center rounded-full border border-[#2D313A] bg-[#13151A] px-3 text-[11px] font-semibold text-[#A0AEC0] hover:text-white"
        >
          Heroes
        </Link>

        <div className="flex items-center rounded-full bg-[#13151A] p-1">
           <button className="flex h-7 w-7 items-center justify-center rounded-full text-[#A0AEC0] hover:text-white">
             <LayoutGrid className="h-4 w-4" />
           </button>
           <div className="mx-1 h-4 w-px bg-[#2D313A]" />
           <button 
             onClick={onRunWorkflow} 
             disabled={runningWorkflow}
             className="flex h-7 items-center gap-2 rounded-full px-3 text-xs font-medium text-[#E2E8F0] hover:bg-[#1A202C]"
           >
             <Play className="h-3 w-3 fill-current" />
             {runningWorkflow ? "Queueing..." : "Queue"}
           </button>
        </div>
        
        {/* Main action white button (Share in ref, Save for us) */}
        <button 
          onClick={onSave}
          className="flex h-9 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-black hover:bg-gray-200"
        >
          <UploadCloud className="h-4 w-4" />
          Save
        </button>

        <button 
          onClick={onExport}
          className="flex h-9 items-center gap-2 rounded-full border border-[#2D313A] bg-[#13151A] px-4 text-xs font-medium text-[#A0AEC0] hover:text-white"
        >
          <Download className="h-3 w-3" />
          Export JSON
        </button>
      </div>
      
    </header>
  );
}
