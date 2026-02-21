"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type IsValidConnection,
} from "@xyflow/react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { BuilderActionsProvider } from "@/components/builder/builder-actions-context";
import { BottomToolbar } from "@/components/builder/bottom-toolbar";
import { GraphCanvas } from "@/components/builder/graph-canvas";
import { GraphJsonDialog } from "@/components/builder/graph-json-dialog";
import { InspectorPanel } from "@/components/builder/inspector-panel";
import { LogDrawer } from "@/components/builder/log-drawer";
import type { FlowEdge, FlowNode } from "@/components/builder/types";
import { WorkbenchTopbar } from "@/components/builder/workbench-topbar";
import { validateConnection } from "@/engine/graph-validation";
import {
  createNodeData,
  getTemplateByKind,
} from "@/engine/node-registry";
import { createHandleId } from "@/engine/ports";
import type {
  BuilderGraphSnapshot,
  EngineRunResult,
  NodeConfigValue,
  NodeLogEntry,
} from "@/engine/types";

const STORAGE_KEY = "superhero-workbench.graph.v1";
const WORKFLOW_ID = "default-workflow";

function createInitialNodes(): FlowNode[] {
  return [
    {
      id: "model-1",
      type: "workbenchNode",
      position: { x: 50, y: 300 },
      data: createNodeData("imageInput"),
    },
    {
      id: "prompt-1",
      type: "workbenchNode",
      position: { x: 400, y: 150 },
      data: createNodeData("prompt"),
    },
    {
      id: "prompt-2",
      type: "workbenchNode",
      position: { x: 400, y: 450 },
      data: createNodeData("promptNegative"),
    },
    {
      id: "combine-1",
      type: "workbenchNode",
      position: { x: 760, y: 280 },
      data: createNodeData("combinePrompt"),
    },
    {
      id: "theme-1",
      type: "workbenchNode",
      position: { x: 760, y: 40 },
      data: createNodeData("theme"),
    },
    {
      id: "animation-1",
      type: "workbenchNode",
      position: { x: 760, y: 520 },
      data: createNodeData("animation"),
    },
    {
      id: "generator-1",
      type: "workbenchNode",
      position: { x: 1110, y: 280 },
      data: createNodeData("generateHero"),
    },
  ];
}

function createInitialEdges(): FlowEdge[] {
  return [
    {
      id: "e-prompt-combine",
      source: "prompt-1",
      sourceHandle: createHandleId("output", "text", "text"),
      target: "combine-1",
      targetHandle: createHandleId("input", "textA", "text"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-neg-combine",
      source: "prompt-2",
      sourceHandle: createHandleId("output", "text", "text"),
      target: "combine-1",
      targetHandle: createHandleId("input", "textB", "text"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-combine-gen",
      source: "combine-1",
      sourceHandle: createHandleId("output", "text", "text"),
      target: "generator-1",
      targetHandle: createHandleId("input", "text", "text"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-theme-gen",
      source: "theme-1",
      sourceHandle: createHandleId("output", "json", "json"),
      target: "generator-1",
      targetHandle: createHandleId("input", "jsonTheme", "json"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-animation-gen",
      source: "animation-1",
      sourceHandle: createHandleId("output", "json", "json"),
      target: "generator-1",
      targetHandle: createHandleId("input", "jsonAnimation", "json"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-image-gen",
      source: "model-1",
      sourceHandle: createHandleId("output", "image", "image"),
      target: "generator-1",
      targetHandle: createHandleId("input", "image", "image"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-neg-gen",
      source: "prompt-2",
      sourceHandle: createHandleId("output", "text", "text"),
      target: "generator-1",
      targetHandle: createHandleId("input", "negative", "text"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
  ];
}

function normalizeEdges(inputEdges: FlowEdge[]): FlowEdge[] {
  return inputEdges.map((edge) => ({
    ...edge,
    type: edge.type === "bezier" ? "default" : edge.type,
  }));
}

function hydrateNode(node: FlowNode): FlowNode {
  const template = getTemplateByKind(node.data.kind);
  const defaults = template?.defaults ?? {};

  return {
    ...node,
    type: "workbenchNode",
    data: {
      ...createNodeData(node.data.kind),
      ...node.data,
      config: {
        ...defaults,
        ...(node.data.config ?? {}),
      },
      status: node.data.status ?? "idle",
      output: node.data.output ?? null,
      logs: Array.isArray(node.data.logs) ? (node.data.logs as NodeLogEntry[]) : [],
    },
  };
}

function toNodeLogEntry(nodeId: string, index: number, line: string): NodeLogEntry {
  const parsed = line.match(/^\[(.+?)\]\s*(.*)$/);
  const timestamp = parsed?.[1] ?? new Date().toISOString();
  const message = parsed?.[2] ?? line;
  const level = message.toUpperCase().includes("ERROR")
    ? "error"
    : message.toUpperCase().includes("WARN")
      ? "warn"
      : "info";

  return {
    id: `${nodeId}-${index}-${timestamp}`,
    timestamp,
    level,
    message,
  };
}

function applyRunToNodes(currentNodes: FlowNode[], result: EngineRunResult): FlowNode[] {
  return currentNodes.map((node) => {
    const state = result.nodeStates[node.id];
    if (!state) {
      return {
        ...node,
        data: {
          ...node.data,
          status: "idle",
          output: null,
          logs: [],
        },
      };
    }

    return {
      ...node,
      data: {
        ...node.data,
        status: state.status,
        output: state.output ?? null,
        logs: state.logs.map((line, index) => toNodeLogEntry(node.id, index, line)),
      },
    };
  });
}

export function BuilderShell() {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(createInitialEdges());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [invalidTooltip, setInvalidTooltip] = useState<{
    x: number;
    y: number;
    message: string;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const isDraggingRef = useRef(false);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const invalidReasonRef = useRef("Invalid connection");

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newWidth = document.body.clientWidth - e.clientX;
      setSidebarWidth(Math.max(280, Math.min(newWidth, 600)));
    };
    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "default";
        document.body.classList.remove("select-none");
      }
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const hydrateLatestRun = useCallback(async () => {
    try {
      const response = await fetch(`/api/workflow/latest?workflowId=${encodeURIComponent(WORKFLOW_ID)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        result?: EngineRunResult | null;
        error?: string;
      };
      if (!response.ok || !payload.ok || !payload.result) {
        return;
      }
      setNodes((currentNodes) => applyRunToNodes(currentNodes, payload.result as EngineRunResult));
      setStatusMessage(`Loaded latest run ${payload.result.runId.slice(0, 8)}`);
    } catch {
      setStatusMessage("Ready");
    }
  }, [setNodes]);

  useEffect(() => {
    void hydrateLatestRun();
  }, [hydrateLatestRun]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const selectedTemplate = selectedNode
    ? getTemplateByKind(selectedNode.data.kind)
    : null;

  const exportValue = useMemo(
    () => JSON.stringify({ nodes, edges }, null, 2),
    [nodes, edges]
  );

  const resetExecutionView = useCallback(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: "idle",
          output: null,
          logs: [],
        },
      }))
    );
  }, [setNodes]);

  const runEndpoint = useCallback(
    async (path: string, payload: Record<string, unknown>, runLabel: string) => {
      if (isExecuting) {
        setStatusMessage("Execution already in progress");
        return;
      }

      const snapshot: BuilderGraphSnapshot = {
        nodes: nodesRef.current,
        edges: edgesRef.current,
      };

      setIsExecuting(true);
      resetExecutionView();
      setStatusMessage(`Running ${runLabel}...`);

      try {
        const response = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snapshot, workflowId: WORKFLOW_ID, ...payload }),
        });
        const body = (await response.json()) as {
          ok: boolean;
          result?: EngineRunResult;
          error?: string;
        };

        if (!response.ok || !body.ok || !body.result) {
          throw new Error(body.error ?? "Execution request failed");
        }

        setNodes((currentNodes) => applyRunToNodes(currentNodes, body.result as EngineRunResult));

        if (body.result.status === "success") {
          setStatusMessage(`Run complete (${body.result.executedNodeIds.length} nodes)`);
        } else {
          setStatusMessage(body.result.errors[0] ?? "Run completed with errors");
        }

        await hydrateLatestRun();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Execution failed");
      } finally {
        setIsExecuting(false);
      }
    },
    [hydrateLatestRun, isExecuting, resetExecutionView, setNodes]
  );

  const runSingleNode = useCallback(
    (nodeId: string) => {
      void runEndpoint("/api/workflow/run-from-node", { nodeId }, `node ${nodeId}`);
    },
    [runEndpoint]
  );

  const onRunWorkflow = useCallback(() => {
    void runEndpoint("/api/workflow/run", {}, "workflow");
  }, [runEndpoint]);

  const validateConnectionResult = useCallback((connection: Connection | FlowEdge) => {
    const result = validateConnection(connection, nodesRef.current, edgesRef.current);
    invalidReasonRef.current = result.reason ?? "Invalid connection";
    return result;
  }, []);

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => validateConnectionResult(connection).valid,
    [validateConnectionResult]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const result = validateConnectionResult(connection);
      if (!result.valid) {
        setStatusMessage(result.reason ?? "Connection failed");
        return;
      }
      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            id: `edge-${Date.now()}`,
            type: "default",
            style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
          },
          currentEdges
        )
      );
      setStatusMessage("Connected");
    },
    [setEdges, validateConnectionResult]
  );

  const onNew = () => {
    setNodes(createInitialNodes());
    setEdges(createInitialEdges());
    setSelectedNodeId(null);
    setIsSidebarOpen(false);
    setIsLogDrawerOpen(true);
    setStatusMessage("Reset to default workflow");
  };

  const onSave = () => {
    const payload: BuilderGraphSnapshot = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setStatusMessage("Saved to localStorage");
  };

  const onLoad = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setStatusMessage("No saved graph found");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as BuilderGraphSnapshot;
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error("invalid graph format");
      }
      setNodes((parsed.nodes as FlowNode[]).map(hydrateNode));
      setEdges(normalizeEdges(parsed.edges as FlowEdge[]));
      setSelectedNodeId(null);
      setIsSidebarOpen(false);
      setIsLogDrawerOpen(true);
      setStatusMessage("Loaded graph successfully");
    } catch {
      setStatusMessage("Load failed: invalid JSON");
    }
  };

  const onImport = (raw: string) => {
    if (!raw.trim()) {
      setStatusMessage("No JSON to import");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as BuilderGraphSnapshot;
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
        throw new Error("invalid graph format");
      }
      setNodes((parsed.nodes as FlowNode[]).map(hydrateNode));
      setEdges(normalizeEdges(parsed.edges as FlowEdge[]));
      setSelectedNodeId(null);
      setIsSidebarOpen(false);
      setIsLogDrawerOpen(true);
      setStatusMessage("Imported graph successfully");
    } catch {
      setStatusMessage("Import failed: check JSON format");
    }
  };

  const onLabelChange = (value: string) => {
    if (!selectedNodeId) return;
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNodeId ? { ...node, data: { ...node.data, label: value } } : node
      )
    );
  };

  const onConfigChange = (key: string, value: NodeConfigValue) => {
    if (!selectedNodeId) return;
    const normalizedValue = value === "true" ? true : value === "false" ? false : value;
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, config: { ...node.data.config, [key]: normalizedValue } } }
          : node
      )
    );
  };

  return (
    <BuilderActionsProvider value={{ runNode: runSingleNode }}>
      <div className="flex h-screen w-full flex-col bg-[#0B0D12] text-[#E2E8F0]">
        <WorkbenchTopbar
          onNew={onNew}
          onLoad={onLoad}
          onSave={onSave}
          onExport={() => setJsonDialogOpen(true)}
          onRunWorkflow={onRunWorkflow}
          runningWorkflow={isExecuting}
          statusMessage={statusMessage}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <div className="flex-1 relative h-full bg-[#0B0D12]">
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              onConnectStart={() => setInvalidTooltip(null)}
              onConnectEnd={({ x, y }) => {
                setInvalidTooltip({ x, y, message: invalidReasonRef.current });
                setStatusMessage(invalidReasonRef.current);
                setTimeout(() => setInvalidTooltip(null), 1600);
              }}
              onSelectionNode={(selectedNodes) => {
                const id = selectedNodes[0]?.id ?? null;
                setSelectedNodeId(id);
                if (!id) setIsSidebarOpen(false);
              }}
              onNodeDoubleClick={(_, node) => {
                setSelectedNodeId(node.id);
                setIsSidebarOpen(true);
              }}
              invalidTooltip={invalidTooltip}
            />

            <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-[480px]">
              <div className="pointer-events-auto">
                <LogDrawer
                  open={isLogDrawerOpen}
                  onToggle={() => setIsLogDrawerOpen((open) => !open)}
                  nodeLabel={selectedNode?.data.label ?? null}
                  logs={selectedNode?.data.logs ?? []}
                />
              </div>
            </div>

            <BottomToolbar />

            {!isSidebarOpen && selectedNodeId && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-16 w-6 items-center justify-center rounded-l-md bg-[#1A202C] border border-r-0 border-[#2D313A] text-[#A0AEC0] hover:text-white shadow-lg"
              >
                <PanelRightOpen className="h-4 w-4" />
              </button>
            )}
          </div>

          <div
            className={`absolute top-0 right-0 z-20 flex h-full border-l border-[#2D313A] bg-[#0B0D12] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
            style={{ width: sidebarWidth }}
          >
            <div
              className="absolute left-0 top-0 h-full w-2 cursor-col-resize group flex items-center justify-center -translate-x-1/2"
              onPointerDown={(e) => {
                e.preventDefault();
                isDraggingRef.current = true;
                document.body.style.cursor = "col-resize";
                document.body.classList.add("select-none");
              }}
            >
              <div className="h-12 w-1 rounded-full bg-[#2D313A] group-hover:bg-[#4299E1] transition-colors" />
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-md text-[#A0AEC0] hover:bg-[#1A202C] hover:text-white transition-colors"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>

              {selectedNode ? (
                <InspectorPanel
                  selectedNodeLabel={selectedNode.data.label ?? null}
                  template={selectedTemplate ?? null}
                  config={selectedNode.data.config ?? null}
                  output={selectedNode.data.output ?? null}
                  onLabelChange={onLabelChange}
                  onConfigChange={onConfigChange}
                />
              ) : (
                <aside className="flex h-full flex-col p-6 text-center justify-center items-center">
                  <p className="text-xs text-[#718096]">No node selected.</p>
                </aside>
              )}
            </div>
          </div>
        </div>

        <GraphJsonDialog
          open={jsonDialogOpen}
          onOpenChange={setJsonDialogOpen}
          exportValue={exportValue}
          onImport={onImport}
        />
      </div>
    </BuilderActionsProvider>
  );
}
