import { MarkerType } from "@xyflow/react";
import {
  MIND_MAP_ALIGNS,
  MIND_MAP_BORDER_TOKENS,
  MIND_MAP_EDGE_TYPES,
  MIND_MAP_EXPORT_FORMAT,
  MIND_MAP_FILL_TOKENS,
  MIND_MAP_FONT_TOKENS,
  MIND_MAP_IMPORTANCE_LEVELS,
  MIND_MAP_NODE_KINDS,
  MIND_MAP_NODE_TYPE,
  MIND_MAP_SHAPES,
  MIND_MAP_TEXT_TOKENS,
  MIND_MAP_VERSION,
  type MindMapBorderToken,
  type MindMapEdge,
  type MindMapNode,
  type MindMapNodeKind,
  type MindMapNodeStyle,
  type MindMapViewport,
} from "@/lib/types/mindmap";
import { clampFontSize, mindMapUid, styleForKind } from "./defaults";

/* -------------------------------------------------------------------------- */
/* Limits — a hostile or corrupt file can never exhaust memory.               */
/* -------------------------------------------------------------------------- */

export const MIND_MAP_MAX_NODES = 400;
export const MIND_MAP_MAX_EDGES = 1200;
export const MIND_MAP_MAX_TEXT = 8000;
export const MIND_MAP_MAX_TITLE = 240;
export const MIND_MAP_MAX_JSON_BYTES = 4 * 1024 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Strip control characters, collapse runaway whitespace, cap length. */
function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .slice(0, max);
}

function pick<T extends readonly string[]>(
  value: unknown,
  list: T,
  fallback: T[number],
): T[number] {
  return typeof value === "string" && (list as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

/* -------------------------------------------------------------------------- */
/* Node / edge / style sanitisers                                             */
/* -------------------------------------------------------------------------- */

export function sanitizeNodeStyle(raw: unknown, kind: MindMapNodeKind): MindMapNodeStyle {
  const base = styleForKind(kind);
  if (!isRecord(raw)) return base;
  return {
    shape: pick(raw.shape, MIND_MAP_SHAPES, base.shape),
    fill: pick(raw.fill, MIND_MAP_FILL_TOKENS, base.fill),
    text: pick(raw.text, MIND_MAP_TEXT_TOKENS, base.text),
    border: pick(raw.border, MIND_MAP_BORDER_TOKENS, base.border),
    borderStyle: raw.borderStyle === "dashed" ? "dashed" : "solid",
    font: pick(raw.font, MIND_MAP_FONT_TOKENS, base.font),
    fontSize: clampFontSize(num(raw.fontSize, base.fontSize)),
    bold: raw.bold === true,
    italic: raw.italic === true,
    underline: raw.underline === true,
    align: pick(raw.align, MIND_MAP_ALIGNS, base.align),
    icon: cleanText(raw.icon, 4),
  };
}

function finiteSize(value: unknown): number | undefined {
  const n = num(value, NaN);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(1000, Math.round(n));
}

export function sanitizeNode(raw: unknown): MindMapNode | null {
  if (!isRecord(raw)) return null;
  const data = isRecord(raw.data) ? raw.data : {};
  const pos = isRecord(raw.position) ? raw.position : {};
  const kind: MindMapNodeKind = (MIND_MAP_NODE_KINDS as readonly string[]).includes(
    String(data.kind),
  )
    ? (data.kind as MindMapNodeKind)
    : "concept";
  const id =
    typeof raw.id === "string" && raw.id.trim().length > 0
      ? raw.id
      : mindMapUid("mn");

  const node: MindMapNode = {
    id,
    type: MIND_MAP_NODE_TYPE,
    position: { x: num(pos.x), y: num(pos.y) },
    data: {
      kind,
      title: cleanText(data.title, MIND_MAP_MAX_TITLE) || "Untitled",
      body: cleanText(data.body, MIND_MAP_MAX_TEXT),
      importance: (MIND_MAP_IMPORTANCE_LEVELS as readonly string[]).includes(
        String(data.importance),
      )
        ? (data.importance as "low" | "medium" | "high")
        : kind === "central"
          ? "high"
          : "medium",
      style: sanitizeStyleFromNode(data, kind),
    },
  };

  const width = finiteSize(raw.width);
  const height = finiteSize(raw.height);
  if (width) node.width = width;
  if (height) node.height = height;
  return node;
}

function sanitizeStyleFromNode(
  data: Record<string, unknown>,
  kind: MindMapNodeKind,
): MindMapNodeStyle {
  return sanitizeNodeStyle(data.style, kind);
}

export function sanitizeEdge(raw: unknown, nodeIds: Set<string>): MindMapEdge | null {
  if (!isRecord(raw)) return null;
  const source = typeof raw.source === "string" ? raw.source : "";
  const target = typeof raw.target === "string" ? raw.target : "";
  if (!source || !target || source === target) return null;
  if (!nodeIds.has(source) || !nodeIds.has(target)) return null;

  const data = isRecord(raw.data) ? raw.data : {};
  const directed = data.directed !== false;

  const edge: MindMapEdge = {
    id: typeof raw.id === "string" && raw.id ? raw.id : mindMapUid("me"),
    source,
    target,
    type: (MIND_MAP_EDGE_TYPES as readonly string[]).includes(String(raw.type))
      ? (raw.type as MindMapEdge["type"])
      : "default",
    data: {
      label: cleanText(data.label, MIND_MAP_MAX_TITLE),
      line: data.line === "dashed" ? "dashed" : "solid",
      color: (MIND_MAP_BORDER_TOKENS as readonly string[]).includes(
        String(data.color),
      )
        ? (data.color as MindMapBorderToken)
        : "slate",
      directed,
    },
  };

  if (typeof raw.sourceHandle === "string") edge.sourceHandle = raw.sourceHandle;
  if (typeof raw.targetHandle === "string") edge.targetHandle = raw.targetHandle;
  if (directed) {
    edge.markerEnd = { type: MarkerType.ArrowClosed, width: 16, height: 16 };
  }
  return edge;
}

export function sanitizeViewport(raw: unknown): MindMapViewport {
  if (!isRecord(raw)) return { x: 0, y: 0, zoom: 1 };
  const zoom = num(raw.zoom, 1);
  return {
    x: num(raw.x),
    y: num(raw.y),
    zoom: Math.min(2.5, Math.max(0.2, zoom)),
  };
}

/* -------------------------------------------------------------------------- */
/* Import                                                                    */
/* -------------------------------------------------------------------------- */

export interface SanitizedGraph {
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: MindMapViewport;
}

export type ImportResult =
  | { ok: true; graph: SanitizedGraph }
  | { ok: false; error: string };

/**
 * Validate and sanitise a candidate graph. Shared by JSON import and any
 * defensive load. Rejects structurally invalid payloads; normalises everything
 * else (unknown colours, out-of-range sizes, dangling edges) rather than
 * trusting the file.
 */
export function sanitizeGraph(raw: {
  title?: unknown;
  nodes?: unknown;
  edges?: unknown;
  viewport?: unknown;
}): ImportResult {
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : null;
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : null;
  if (!rawNodes) return { ok: false, error: "The file has no nodes." };
  if (rawNodes.length === 0) {
    return { ok: false, error: "The map must contain at least one node." };
  }
  if (rawNodes.length > MIND_MAP_MAX_NODES) {
    return { ok: false, error: `Too many nodes (limit ${MIND_MAP_MAX_NODES}).` };
  }
  if (rawEdges && rawEdges.length > MIND_MAP_MAX_EDGES) {
    return { ok: false, error: `Too many connections (limit ${MIND_MAP_MAX_EDGES}).` };
  }

  const nodes: MindMapNode[] = [];
  const seenIds = new Set<string>();
  for (const candidate of rawNodes) {
    const node = sanitizeNode(candidate);
    if (!node) continue;
    if (seenIds.has(node.id)) node.id = mindMapUid("mn");
    seenIds.add(node.id);
    nodes.push(node);
  }
  if (nodes.length === 0) return { ok: false, error: "No valid nodes were found." };

  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: MindMapEdge[] = [];
  const seenEdgeKeys = new Set<string>();
  for (const candidate of rawEdges ?? []) {
    const edge = sanitizeEdge(candidate, nodeIds);
    if (!edge) continue;
    const key = `${edge.source}->${edge.target}:${edge.sourceHandle ?? ""}:${
      edge.targetHandle ?? ""
    }`;
    if (seenEdgeKeys.has(key)) continue;
    seenEdgeKeys.add(key);
    edges.push(edge);
  }

  return {
    ok: true,
    graph: {
      title: cleanText(raw.title, MIND_MAP_MAX_TITLE) || "Imported map",
      nodes,
      edges,
      viewport: sanitizeViewport(raw.viewport),
    },
  };
}

/** Parse a JSON string and validate it. Never throws to the caller. */
export function parseMindMapJson(text: string): ImportResult {
  if (text.length > MIND_MAP_MAX_JSON_BYTES) {
    return { ok: false, error: "The file is too large to import." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file is not valid JSON." };
  }
  if (!isRecord(parsed)) return { ok: false, error: "Unrecognised file format." };

  // Accept either a bare graph or a versioned export envelope.
  const envelope = isRecord(parsed.map) ? parsed.map : parsed;
  if (
    isRecord(parsed) &&
    typeof parsed.format === "string" &&
    parsed.format !== MIND_MAP_EXPORT_FORMAT
  ) {
    return { ok: false, error: "This JSON is not a Paideia mind map." };
  }
  const version = num(envelope.version ?? parsed.version, MIND_MAP_VERSION);
  if (version > MIND_MAP_VERSION) {
    return {
      ok: false,
      error: "This map was made with a newer version of Paideia.",
    };
  }

  return sanitizeGraph({
    title: envelope.title,
    nodes: envelope.nodes,
    edges: envelope.edges,
    viewport: envelope.viewport,
  });
}
