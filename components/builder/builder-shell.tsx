"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type EdgeMouseHandler,
  type IsValidConnection,
} from "@xyflow/react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { BuilderActionsProvider } from "@/components/builder/builder-actions-context";
import { BottomToolbar } from "@/components/builder/bottom-toolbar";
import { GraphCanvas } from "@/components/builder/graph-canvas";
import { GraphJsonDialog } from "@/components/builder/graph-json-dialog";
import { IdePanel } from "@/components/builder/ide-panel";
import { InspectorPanel } from "@/components/builder/inspector-panel";
import { LogDrawer } from "@/components/builder/log-drawer";
import { NodePalette } from "@/components/builder/node-palette";
import { PreviewPanel } from "@/components/builder/preview-panel";
import { RunHistoryPanel } from "@/components/builder/run-history-panel";
import type { FlowEdge, FlowNode } from "@/components/builder/types";
import { WorkbenchTopbar } from "@/components/builder/workbench-topbar";
import { validateConnection } from "@/engine/graph-validation";
import {
  createNodeData,
  getTemplateByKind,
  nodeTemplates,
} from "@/engine/node-registry";
import { createHandleId } from "@/engine/ports";
import type {
  BuilderGraphSnapshot,
  EngineRunResult,
  NodeKind,
  NodeConfigValue,
  NodeLogEntry,
  RunHistoryItem,
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
    {
      id: "patchplan-1",
      type: "workbenchNode",
      position: { x: 1450, y: 280 },
      data: createNodeData("patchPlanGenerate"),
    },
    {
      id: "workspace-1",
      type: "workbenchNode",
      position: { x: 1790, y: 280 },
      data: createNodeData("workspaceApply"),
    },
    {
      id: "preview-1",
      type: "workbenchNode",
      position: { x: 2130, y: 280 },
      data: createNodeData("previewRun"),
    },
    {
      id: "publish-1",
      type: "workbenchNode",
      position: { x: 2470, y: 280 },
      data: createNodeData("heroPublish"),
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
    {
      id: "e-gen-patchplan",
      source: "generator-1",
      sourceHandle: createHandleId("output", "heroArtifact", "heroArtifact"),
      target: "patchplan-1",
      targetHandle: createHandleId("input", "heroArtifact", "heroArtifact"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-theme-patchplan",
      source: "theme-1",
      sourceHandle: createHandleId("output", "json", "json"),
      target: "patchplan-1",
      targetHandle: createHandleId("input", "jsonTheme", "json"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-animation-patchplan",
      source: "animation-1",
      sourceHandle: createHandleId("output", "json", "json"),
      target: "patchplan-1",
      targetHandle: createHandleId("input", "jsonAnimation", "json"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-patchplan-workspace",
      source: "patchplan-1",
      sourceHandle: createHandleId("output", "patchPlan", "patchPlan"),
      target: "workspace-1",
      targetHandle: createHandleId("input", "patchPlan", "patchPlan"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-workspace-preview",
      source: "workspace-1",
      sourceHandle: createHandleId("output", "workspace", "workspace"),
      target: "preview-1",
      targetHandle: createHandleId("input", "workspace", "workspace"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-gen-publish",
      source: "generator-1",
      sourceHandle: createHandleId("output", "heroArtifact", "heroArtifact"),
      target: "publish-1",
      targetHandle: createHandleId("input", "heroArtifact", "heroArtifact"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-workspace-publish",
      source: "workspace-1",
      sourceHandle: createHandleId("output", "workspace", "workspace"),
      target: "publish-1",
      targetHandle: createHandleId("input", "workspace", "workspace"),
      type: "default",
      style: { stroke: "#A0AEC0", strokeWidth: 1.5, opacity: 0.5 },
    },
    {
      id: "e-preview-publish",
      source: "preview-1",
      sourceHandle: createHandleId("output", "preview", "preview"),
      target: "publish-1",
      targetHandle: createHandleId("input", "preview", "preview"),
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

const kindIdPrefix: Record<NodeKind, string> = {
  imageInput: "image",
  prompt: "prompt",
  promptNegative: "negative",
  combinePrompt: "combine",
  theme: "theme",
  animation: "animation",
  generateHero: "hero",
  patchPlanGenerate: "patchplan",
  workspaceApply: "workspace",
  previewRun: "preview",
  heroPublish: "publish",
};

export function BuilderShell() {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(createInitialEdges());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [invalidTooltip, setInvalidTooltip] = useState<{
    x: number;
    y: number;
    message: string;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [isRunHistoryLoading, setIsRunHistoryLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isRunHistoryVisible, setIsRunHistoryVisible] = useState(true);

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

  const fetchRunHistory = useCallback(async () => {
    setIsRunHistoryLoading(true);
    try {
      const response = await fetch(
        `/api/workflow/runs?workflowId=${encodeURIComponent(WORKFLOW_ID)}&limit=10`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as {
        ok: boolean;
        runs?: RunHistoryItem[];
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.runs) {
        throw new Error(payload.error ?? "Failed to load run history");
      }

      setRunHistory(payload.runs);
    } catch {
      setRunHistory([]);
    } finally {
      setIsRunHistoryLoading(false);
    }
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
      setSelectedRunId(payload.result.runId);
      setStatusMessage(`Loaded latest run ${payload.result.runId.slice(0, 8)}`);
    } catch {
      setStatusMessage("Ready");
    }
  }, [setNodes]);

  useEffect(() => {
    void hydrateLatestRun();
    void fetchRunHistory();
  }, [fetchRunHistory, hydrateLatestRun]);

  const loadRunById = useCallback(async (runId: string) => {
    try {
      const response = await fetch(
        `/api/workflow/runs/${encodeURIComponent(runId)}?workflowId=${encodeURIComponent(WORKFLOW_ID)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as {
        ok: boolean;
        result?: EngineRunResult;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.error ?? "Failed to load run detail");
      }

      setNodes((currentNodes) => applyRunToNodes(currentNodes, payload.result as EngineRunResult));
      setSelectedRunId(runId);
      setStatusMessage(`Loaded run ${runId.slice(0, 8)}`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to load run");
    }
  }, [setNodes]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const selectedTemplate = selectedNode
    ? getTemplateByKind(selectedNode.data.kind)
    : null;

  const filteredTemplates = useMemo(() => {
    const query = paletteQuery.trim().toLowerCase();
    if (!query) {
      return nodeTemplates;
    }
    return nodeTemplates.filter((template) => {
      return (
        template.label.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.kind.toLowerCase().includes(query)
      );
    });
  }, [paletteQuery]);

  const selectedWorkspaceOutput = useMemo(() => {
    const output = selectedNode?.data.output as Record<string, unknown> | null | undefined;
    const workspace = output?.workspace;
    if (workspace && typeof workspace === "object") {
      const pathValue = (workspace as Record<string, unknown>).path;
      const heroIdValue = (workspace as Record<string, unknown>).heroId;
      if (typeof pathValue === "string" && typeof heroIdValue === "string") {
        return {
          path: pathValue,
          heroId: heroIdValue,
        };
      }
    }
    return null;
  }, [selectedNode]);

  const selectedPreviewOutput = useMemo(() => {
    const output = selectedNode?.data.output as Record<string, unknown> | null | undefined;
    const preview = output?.preview;
    if (!(preview && typeof preview === "object")) {
      return null;
    }
    const previewUrl = (preview as Record<string, unknown>).url;
    if (typeof previewUrl !== "string" || !previewUrl) {
      return null;
    }

    const sourceWorkspaceNodeId = edges.find(
      (edge) => edge.target === selectedNode?.id && (edge.targetHandle?.includes(":workspace:") ?? true)
    )?.source;
    const sourceWorkspaceNode = nodes.find((node) => node.id === sourceWorkspaceNodeId);
    const workspaceOutput = sourceWorkspaceNode?.data.output as Record<string, unknown> | null | undefined;
    const workspace = workspaceOutput?.workspace;
    const workspacePath =
      workspace && typeof workspace === "object"
        ? (workspace as Record<string, unknown>).path
        : null;

    return {
      previewUrl,
      workspacePath: typeof workspacePath === "string" ? workspacePath : null,
    };
  }, [edges, nodes, selectedNode]);

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
        setSelectedRunId(body.result.runId);

        if (body.result.status === "success") {
          setStatusMessage(`Run complete (${body.result.executedNodeIds.length} nodes)`);
        } else {
          setStatusMessage(body.result.errors[0] ?? "Run completed with errors");
        }

        await fetchRunHistory();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Execution failed");
      } finally {
        setIsExecuting(false);
      }
    },
    [fetchRunHistory, isExecuting, resetExecutionView, setNodes]
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

  const onEdgeClick: EdgeMouseHandler<FlowEdge> = useCallback(
    (event, edge) => {
      if (event.detail < 2) {
        return;
      }
      setEdges((currentEdges) => currentEdges.filter((currentEdge) => currentEdge.id !== edge.id));
      setStatusMessage("Connection removed");
    },
    [setEdges]
  );

  const onAddNode = useCallback((kind: NodeKind) => {
    const template = getTemplateByKind(kind);
    if (!template) {
      return;
    }

    const idPrefix = kindIdPrefix[kind] ?? "node";
    const id = `${idPrefix}-${Date.now()}`;
    const offset = (nodesRef.current.length % 8) * 36;

    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id,
        type: "workbenchNode",
        position: {
          x: 280 + offset,
          y: 120 + offset,
        },
        data: createNodeData(kind),
      },
    ]);

    setStatusMessage(`Added ${template.label}`);
  }, [setNodes]);

  const deleteSingleNode = useCallback(
    (nodeId: string) => {
      setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
        setIsSidebarOpen(false);
      }
      setStatusMessage("Node deleted");
    },
    [selectedNodeId, setEdges, setNodes]
  );

  const onNew = () => {
    setNodes(createInitialNodes());
    setEdges(createInitialEdges());
    setPaletteQuery("");
    setSelectedNodeId(null);
    setSelectedRunId(null);
    setIsSidebarOpen(false);
    setStatusMessage("Reset to default workflow");
  };

  const onSave = () => {
    const payload: BuilderGraphSnapshot = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setStatusMessage("Saved to localStorage");
  };

  const onClearNodes = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setIsSidebarOpen(false);
    setStatusMessage("Canvas cleared");
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
      setSelectedRunId(null);
      setIsSidebarOpen(false);
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
      setSelectedRunId(null);
      setIsSidebarOpen(false);
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
    <BuilderActionsProvider value={{ runNode: runSingleNode, deleteNode: deleteSingleNode }}>
      <div className="builder-clean flex h-screen w-full flex-col bg-[#0B0D12] text-[#E2E8F0]">
        <WorkbenchTopbar
          onNew={onNew}
          onClearNodes={onClearNodes}
          onLoad={onLoad}
          onSave={onSave}
          onExport={() => setJsonDialogOpen(true)}
          onRunWorkflow={onRunWorkflow}
          runningWorkflow={isExecuting}
          statusMessage={statusMessage}
        />

        <div className="px-4 py-2">
          <LogDrawer
            nodeLabel={selectedNode?.data.label ?? null}
            logs={selectedNode?.data.logs ?? []}
            statusMessage={statusMessage}
          />
        </div>

        <div className="relative flex flex-1 overflow-hidden">
          <div
            className={`pointer-events-none absolute left-0 top-0 z-30 h-full w-[300px] transition-transform duration-300 ease-out ${
              isPaletteVisible ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="pointer-events-auto h-full border-r border-[#2D313A] bg-[#0B0D12] p-3 shadow-[12px_0_28px_-20px_rgba(0,0,0,0.9)]">
              <NodePalette
                templates={filteredTemplates}
                query={paletteQuery}
                onQueryChange={setPaletteQuery}
                onAddNode={onAddNode}
              />
            </div>
          </div>

          <div className="relative flex-1 min-w-0 h-full bg-[#0B0D12]">
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
              onEdgeClick={onEdgeClick}
              onEdgeDoubleClick={onEdgeClick}
              invalidTooltip={invalidTooltip}
            />

            {isRunHistoryVisible ? (
              <div className="pointer-events-none absolute right-4 top-4 z-20 w-[280px]">
                <div className="pointer-events-auto">
                  <RunHistoryPanel
                    runs={runHistory}
                    selectedRunId={selectedRunId}
                    loading={isRunHistoryLoading}
                    onSelectRun={(runId) => {
                      void loadRunById(runId);
                    }}
                    onRefresh={() => {
                      void fetchRunHistory();
                    }}
                  />
                </div>
              </div>
            ) : null}

            {selectedWorkspaceOutput ? (
              <div className="pointer-events-none absolute bottom-24 left-4 z-20">
                <div className="pointer-events-auto">
                  <IdePanel
                    workspacePath={selectedWorkspaceOutput.path}
                    heroId={selectedWorkspaceOutput.heroId}
                  />
                </div>
              </div>
            ) : null}

            {selectedPreviewOutput ? (
              <div className="pointer-events-none absolute bottom-24 right-4 z-20">
                <div className="pointer-events-auto">
                  <PreviewPanel
                    previewUrl={selectedPreviewOutput.previewUrl}
                    workspacePath={selectedPreviewOutput.workspacePath}
                    onRestart={() => {
                      if (selectedNode?.id) {
                        runSingleNode(selectedNode.id);
                      }
                    }}
                  />
                </div>
              </div>
            ) : null}

            <BottomToolbar
              isPaletteVisible={isPaletteVisible}
              isRunHistoryVisible={isRunHistoryVisible}
              onTogglePalette={() => setIsPaletteVisible((visible) => !visible)}
              onToggleRunHistory={() => setIsRunHistoryVisible((visible) => !visible)}
            />

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
