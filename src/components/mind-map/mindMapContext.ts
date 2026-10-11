"use client";

import { createContext, useContext } from "react";
import type {
  MindMapNodeData,
  MindMapNodeKind,
  MindMapNodeStyle,
} from "@/lib/types/mindmap";

/**
 * Imperative API the custom node/edge components use to mutate the graph
 * through the single canvas state owner (which also records undo history).
 */
export interface MindMapCanvasApi {
  updateNodeData: (
    id: string,
    patch: Partial<MindMapNodeData>,
    options?: { history?: boolean },
  ) => void;
  updateNodeStyle: (
    id: string,
    patch: Partial<MindMapNodeStyle>,
    options?: { history?: boolean },
  ) => void;
  addConnectedNode: (sourceId: string, kind?: MindMapNodeKind) => void;
  deleteNode: (id: string) => void;
}

export const MindMapCanvasContext = createContext<MindMapCanvasApi | null>(null);

export function useMindMapCanvas(): MindMapCanvasApi {
  const api = useContext(MindMapCanvasContext);
  if (!api) {
    throw new Error("Mind-map components must be rendered inside MindMapCanvas.");
  }
  return api;
}
