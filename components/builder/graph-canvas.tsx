import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type IsValidConnection,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { WorkbenchNode } from "@/components/builder/workbench-node";
import type { FlowEdge, FlowNode } from "@/components/builder/types";

const nodeTypes = {
  workbenchNode: WorkbenchNode,
};

interface GraphCanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: OnNodesChange<FlowNode>;
  onEdgesChange: OnEdgesChange<FlowEdge>;
  onConnect: (connection: Connection) => void;
  isValidConnection: IsValidConnection;
  onConnectStart: () => void;
  onConnectEnd: (payload: { x: number; y: number }) => void;
  onSelectionNode: (nodes: FlowNode[]) => void;
  onNodeDoubleClick?: NodeMouseHandler;
  invalidTooltip: { x: number; y: number; message: string } | null;
}

const getNodeColor = (node: { data?: { kind?: string } }) => {
  const kind = node.data?.kind;
  switch (kind) {
    case "imageInput": return "#4299E1";
    case "prompt": return "#48BB78";
    case "combinePrompt": return "#F56565";
    case "theme": return "#ECC94B";
    case "animation": return "#9F7AEA";
    case "generateHero": return "#4299E1";
    case "patchPlanGenerate": return "#ED8936";
    case "workspaceApply": return "#A0AEC0";
    case "previewRun": return "#ED64A6";
    case "heroPublish": return "#38B2AC";
    default: return "#A0AEC0";
  }
};

export function GraphCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  isValidConnection,
  onConnectStart,
  onConnectEnd,
  onSelectionNode,
  onNodeDoubleClick,
  invalidTooltip,
}: GraphCanvasProps) {
  return (
    <div className="grid-noise relative h-full w-full overflow-hidden">
      <div className="absolute inset-0">
        <ReactFlow
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 0.8 }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onConnectStart={onConnectStart}
          onConnectEnd={(_, state) => {
            if (!state.isValid && state.pointer) {
              onConnectEnd({ x: state.pointer.x, y: state.pointer.y });
            }
          }}
          onSelectionChange={({ nodes: selectedNodes }) =>
            onSelectionNode(selectedNodes as FlowNode[])
          }
          onNodeDoubleClick={onNodeDoubleClick}
          defaultEdgeOptions={{
            type: "default",
            animated: false,
            style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color="#2D313A"
            gap={30}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <MiniMap
            nodeColor={getNodeColor}
            maskColor="#0B0D12cc"
            style={{ backgroundColor: "#0B0D12" }}
          />
          <Controls showInteractive={false} />
        </ReactFlow>

        {invalidTooltip ? (
          <div
            className="pointer-events-none absolute z-20 rounded-md border border-[#4b2f35] bg-[#2a1b1f] px-2 py-1 text-xs text-[#ffbec9]"
            style={{ left: invalidTooltip.x + 12, top: invalidTooltip.y + 8 }}
          >
            {invalidTooltip.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
