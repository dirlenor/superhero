export type NodeCategory = "Inputs" | "Prompts" | "Generation" | "Output";

export type NodeKind =
  | "imageInput"
  | "prompt"
  | "promptNegative"
  | "combinePrompt"
  | "theme"
  | "animation"
  | "generateHero"
  | "patchPlanGenerate"
  | "workspaceApply"
  | "previewRun"
  | "heroPublish";

export type PortType =
  | "image"
  | "text"
  | "json"
  | "patchPlan"
  | "workspace"
  | "preview"
  | "heroArtifact";

export type PortDirection = "input" | "output";

export interface NodePort {
  key: string;
  label: string;
  type: PortType;
  direction: PortDirection;
  optional?: boolean;
}

export type NodeStatus = "idle" | "running" | "success" | "error";

export interface NodeLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

export type NodeConfigValue = string | number | boolean;
export type NodeConfig = Record<string, NodeConfigValue>;

export interface BuilderNodeData {
  [key: string]: unknown;
  label: string;
  kind: NodeKind;
  category: NodeCategory;
  config: NodeConfig;
  status: NodeStatus;
  output: Record<string, unknown> | null;
  logs: NodeLogEntry[];
}

export interface GraphSnapshotNode {
  id: string;
  type?: string;
  position: {
    x: number;
    y: number;
  };
  data: BuilderNodeData;
}

export interface GraphSnapshotEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface BuilderGraphSnapshot {
  nodes: GraphSnapshotNode[];
  edges: GraphSnapshotEdge[];
}

export type EngineNodeId = string;

export interface GraphNode {
  id: EngineNodeId;
  type: string;
  config: Record<string, unknown>;
}

export interface GraphEdge {
  from: { nodeId: EngineNodeId; port: string };
  to: { nodeId: EngineNodeId; port: string };
}

export interface GraphDefinition {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RunContext {
  runId: string;
  workflowId?: string;
  startedAt: string;
}

export interface NodeDefinition {
  type: string;
  displayName: string;
  category: string;
  inputs: Record<string, PortType>;
  optionalInputs?: string[];
  outputs: Record<string, PortType>;
  run: (args: {
    nodeId: string;
    config: Record<string, unknown>;
    inputs: Record<string, unknown>;
    ctx: RunContext;
    log: (msg: string) => void;
  }) => Promise<Record<string, unknown>>;
}

export interface NodeExecutionState {
  nodeId: string;
  status: NodeStatus;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  logs: string[];
  output?: Record<string, unknown>;
  error?: string;
}

export interface EngineRunResult {
  runId: string;
  workflowId?: string;
  status: "running" | "success" | "error";
  createdAt: string;
  finishedAt?: string;
  executedNodeIds: string[];
  nodeStates: Record<string, NodeExecutionState>;
  errors: string[];
}

export interface RunHistoryItem {
  runId: string;
  workflowId: string;
  status: "running" | "success" | "error";
  createdAt: string;
  finishedAt?: string;
  nodeCount: number;
  successCount: number;
  errorCount: number;
}

export type FileOp =
  | { kind: "write"; path: string; content: string }
  | { kind: "mkdir"; path: string };

export interface PatchPlanOutput {
  heroId: string;
  workspaceName: string;
  ops: FileOp[];
}

export interface WorkspaceOutput {
  path: string;
  heroId: string;
}

export interface PreviewOutput {
  url: string;
  port: number;
  pid: number;
}
