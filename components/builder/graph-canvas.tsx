import { useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
  type Connection,
  type EdgeMouseHandler,
  type IsValidConnection,
  type OnEdgesChange,
  type OnNodesChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { WorkbenchNode } from "@/components/builder/workbench-node";
import { getTemplateByKind } from "@/engine/node-registry";
import type { FlowEdge, FlowNode } from "@/components/builder/types";
import type { NodeKind } from "@/engine/types";

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
  draggingNodeKind: NodeKind | null;
  onDropNode: (kind: NodeKind, position: { x: number; y: number }) => void;
  onNodeDoubleClick?: NodeMouseHandler;
  onEdgeClick?: EdgeMouseHandler<FlowEdge>;
  onEdgeDoubleClick?: EdgeMouseHandler<FlowEdge>;
  invalidTooltip: { x: number; y: number; message: string } | null;
}

const DRAG_NODE_MIME = "application/x-superhero-node-kind";

function readDraggedNodeKind(dataTransfer: DataTransfer | null): NodeKind | null {
  if (!dataTransfer) {
    return null;
  }

  const kind =
    dataTransfer.getData(DRAG_NODE_MIME) ||
    dataTransfer.getData("text/plain");

  return getTemplateByKind(kind as NodeKind)?.kind ?? null;
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
  draggingNodeKind,
  onDropNode,
  onNodeDoubleClick,
  onEdgeClick,
  onEdgeDoubleClick,
  invalidTooltip,
}: GraphCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    x: number;
    y: number;
    kind: NodeKind;
  } | null>(null);

  const updatePreviewPosition = (event: { clientX: number; clientY: number }, kind: NodeKind) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setDragPreview({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      kind,
    });
  };

  return (
    <div
      ref={wrapperRef}
      className="grid-noise relative h-full w-full overflow-hidden"
      onDragOver={(event) => {
        const kind = draggingNodeKind ?? readDraggedNodeKind(event.dataTransfer);
        if (!kind) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        updatePreviewPosition(event, kind);
      }}
      onDragLeave={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) {
          setDragPreview(null);
        }
      }}
      onDrop={(event) => {
        const kind = draggingNodeKind ?? readDraggedNodeKind(event.dataTransfer);
        setDragPreview(null);
        if (!kind) {
          return;
        }

        event.preventDefault();
        const position = flowInstance
          ? flowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY })
          : { x: event.clientX, y: event.clientY };
        onDropNode(kind, position);
      }}
    >
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
          onEdgeClick={onEdgeClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          edgesFocusable
          onInit={setFlowInstance}
          defaultEdgeOptions={{
            type: "default",
            animated: false,
            style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
            interactionWidth: 44,
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

        {dragPreview ? (
          <div
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[#2D313A] bg-[#13151A]/95 px-4 py-3 shadow-[0_14px_30px_-16px_rgba(0,0,0,0.9)]"
            style={{ left: dragPreview.x, top: dragPreview.y }}
          >
            <p className="text-xs font-semibold text-[#e8f0ff]">
              {getTemplateByKind(dragPreview.kind)?.label ?? dragPreview.kind}
            </p>
            <p className="mt-1 text-[10px] text-[#8fa2cb]">Drop to place node</p>
          </div>
        ) : null}

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
