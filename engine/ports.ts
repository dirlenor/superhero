import type { PortType } from "@/engine/types";

export interface ParsedHandleId {
  direction: "input" | "output";
  key: string;
  type: PortType;
}

export function createHandleId(
  direction: "input" | "output",
  key: string,
  type: PortType
) {
  return `${direction}:${key}:${type}`;
}

export function parseHandleId(handleId?: string | null): ParsedHandleId | null {
  if (!handleId) {
    return null;
  }

  const [direction, key, type] = handleId.split(":");

  if (!direction || !key || !type) {
    return null;
  }

  if (direction !== "input" && direction !== "output") {
    return null;
  }

  return {
    direction,
    key,
    type: type as PortType,
  };
}
