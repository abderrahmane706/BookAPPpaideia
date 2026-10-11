import {
  MIND_MAP_FONT_SIZE_MAX,
  MIND_MAP_FONT_SIZE_MIN,
  MIND_MAP_NODE_KIND_ICONS,
  MIND_MAP_NODE_TYPE,
  MIND_MAP_VERSION,
  type MindMap,
  type MindMapEdge,
  type MindMapNode,
  type MindMapNodeData,
  type MindMapNodeKind,
  type MindMapNodeStyle,
  type MindMapViewport,
} from "@/lib/types/mindmap";

/** Dependency-free id + numeric helpers (mirrors the library store). */
export function mindMapUid(prefix: string): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return `${prefix}-${c.randomUUID()}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function clampFontSize(size: number): number {
  if (!Number.isFinite(size)) return 14;
  return Math.min(MIND_MAP_FONT_SIZE_MAX, Math.max(MIND_MAP_FONT_SIZE_MIN, Math.round(size)));
}

export const DEFAULT_VIEWPORT: MindMapViewport = { x: 0, y: 0, zoom: 1 };

export const BASE_NODE_STYLE: MindMapNodeStyle = {
  shape: "rounded",
  fill: "ivory",
  text: "ink",
  border: "faint",
  borderStyle: "solid",
  font: "body",
  fontSize: 14,
  bold: false,
  italic: false,
  underline: false,
  align: "left",
  icon: "",
};

/**
 * A deliberate visual identity per node kind, so a fresh node already reads as
 * its role (a question looks like a question, a quote like a quote). All values
 * are curated tokens — never arbitrary colours.
 */
export const NODE_KIND_STYLE: Record<MindMapNodeKind, Partial<MindMapNodeStyle>> = {
  central: {
    shape: "central",
    fill: "blue",
    text: "ink",
    border: "ink",
    fontSize: 18,
    bold: true,
    align: "center",
  },
  concept: {
    shape: "rounded",
    fill: "ivory",
    text: "ink",
    border: "blue",
    fontSize: 15,
    bold: true,
  },
  supporting: {
    shape: "rounded",
    fill: "parchment",
    text: "soft",
    border: "faint",
    fontSize: 13,
  },
  question: {
    shape: "ellipse",
    fill: "pale",
    text: "blue",
    border: "blue",
    fontSize: 13,
    italic: true,
  },
  quote: {
    shape: "rectangle",
    fill: "gold",
    text: "gold",
    border: "gold",
    fontSize: 13,
    italic: true,
    font: "editorial",
  },
  example: {
    shape: "rounded",
    fill: "sage",
    text: "green",
    border: "sage",
    fontSize: 13,
  },
  conclusion: {
    shape: "rounded",
    fill: "blue",
    text: "ink",
    border: "blue",
    fontSize: 14,
    bold: true,
  },
  note: {
    shape: "rounded",
    fill: "parchment",
    text: "soft",
    border: "faint",
    fontSize: 12,
  },
};

export function styleForKind(kind: MindMapNodeKind): MindMapNodeStyle {
  return {
    ...BASE_NODE_STYLE,
    icon: MIND_MAP_NODE_KIND_ICONS[kind],
    ...NODE_KIND_STYLE[kind],
  };
}

export function createNode(
  kind: MindMapNodeKind,
  position: { x: number; y: number },
  overrides: Partial<MindMapNodeData> = {},
): MindMapNode {
  return {
    id: mindMapUid("mn"),
    type: MIND_MAP_NODE_TYPE,
    position,
    width: kind === "central" ? 224 : 184,
    data: {
      kind,
      title: overrides.title ?? "",
      body: overrides.body ?? "",
      importance: overrides.importance ?? (kind === "central" ? "high" : "medium"),
      style: overrides.style ?? styleForKind(kind),
    },
  };
}

export function createEdge(
  source: string,
  target: string,
  overrides: Partial<MindMapEdge["data"]> = {},
  type: MindMapEdge["type"] = "default",
): MindMapEdge {
  return {
    id: mindMapUid("me"),
    source,
    target,
    type,
    data: {
      label: overrides?.label ?? "",
      line: overrides?.line ?? "solid",
      color: overrides?.color ?? "slate",
      directed: overrides?.directed ?? true,
    },
  };
}

/** A brand-new map always starts with a single editable central node. */
export function createDefaultMap(id: string, bookId: string, title = "Untitled map"): MindMap {
  const central = createNode("central", { x: 0, y: 0 }, { title: "Main Idea" });
  const at = new Date().toISOString();
  return {
    id,
    bookId,
    title,
    nodes: [central],
    edges: [],
    viewport: { ...DEFAULT_VIEWPORT },
    version: MIND_MAP_VERSION,
    createdAt: at,
    updatedAt: at,
  };
}
