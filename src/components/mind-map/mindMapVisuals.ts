import { MarkerType } from "@xyflow/react";
import {
  type MindMapEdge,
  type MindMapEdgeData,
  type MindMapNode,
} from "@/lib/types/mindmap";
import { MindMapNodeCard } from "./MindMapNodeCard";

/** React Flow node-type registry (stable identity, memoised node). */
export const nodeTypes = { paideia: MindMapNodeCard };

/** Normalise possibly-partial edge data into the full stored shape. */
export function edgeData(edge: MindMapEdge): MindMapEdgeData {
  return {
    label: edge.data?.label ?? "",
    line: edge.data?.line ?? "solid",
    color: edge.data?.color ?? "slate",
    directed: edge.data?.directed !== false,
  };
}

/** Derive display props (colour, dash, arrow, label) from persisted edge data. */
export function decorateEdge(edge: MindMapEdge): MindMapEdge {
  const { color, line, directed, label } = edgeData(edge);
  const stroke = `var(--mmc-border-${color})`;
  return {
    ...edge,
    type: edge.type ?? "default",
    label: label || undefined,
    labelStyle: {
      fill: "var(--ink-soft)",
      fontSize: 10,
      fontFamily: "var(--font-utility)",
    },
    labelBgStyle: { fill: "var(--surface-raised)" },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    style: {
      stroke,
      strokeWidth: 1.5,
      strokeDasharray: line === "dashed" ? "6 5" : undefined,
    },
    markerEnd: directed
      ? { type: MarkerType.ArrowClosed, width: 16, height: 16, color: stroke }
      : undefined,
  };
}

/** Drop React Flow runtime fields (selection, drag, measurements) before saving. */
export function persistableNode(node: MindMapNode): MindMapNode {
  const clean: MindMapNode = {
    id: node.id,
    type: node.type,
    position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
    data: node.data,
  };
  if (typeof node.width === "number") clean.width = node.width;
  if (typeof node.height === "number") clean.height = node.height;
  return clean;
}

export function persistableEdge(edge: MindMapEdge): MindMapEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    data: edgeData(edge),
  };
}
