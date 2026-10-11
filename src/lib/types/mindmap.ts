import type { Edge, Node } from "@xyflow/react";

/**
 * Mind Map domain types.
 *
 * The persisted graph is React-Flow shaped (`Node` / `Edge`) so the canvas can
 * consume it directly, but every stored field is deliberate domain state:
 * positions, node/edge types, labels, appearance and canvas settings. Transient
 * UI state (selection, hover, in-progress drag, active tool) is NEVER stored.
 */

/* -------------------------------------------------------------------------- */
/* Node taxonomy                                                              */
/* -------------------------------------------------------------------------- */

export const MIND_MAP_NODE_KINDS = [
  "central",
  "concept",
  "supporting",
  "question",
  "quote",
  "example",
  "conclusion",
  "note",
] as const;

export type MindMapNodeKind = (typeof MIND_MAP_NODE_KINDS)[number];

export const MIND_MAP_NODE_KIND_LABELS: Record<MindMapNodeKind, string> = {
  central: "Central Idea",
  concept: "Main Concept",
  supporting: "Supporting Idea",
  question: "Question",
  quote: "Quote",
  example: "Example",
  conclusion: "Conclusion",
  note: "Note",
};

/** Decorative glyph per kind (ornament font is reserved for flourishes). */
export const MIND_MAP_NODE_KIND_ICONS: Record<MindMapNodeKind, string> = {
  central: "◆",
  concept: "●",
  supporting: "▪",
  question: "?",
  quote: "\u201C",
  example: "\u2192",
  conclusion: "\u2713",
  note: "\u270E",
};

export const MIND_MAP_IMPORTANCE_LEVELS = ["low", "medium", "high"] as const;
export type MindMapImportance = (typeof MIND_MAP_IMPORTANCE_LEVELS)[number];

/* -------------------------------------------------------------------------- */
/* Appearance                                                                 */
/* -------------------------------------------------------------------------- */

export const MIND_MAP_ALIGNS = ["left", "center", "right"] as const;
export type MindMapAlign = (typeof MIND_MAP_ALIGNS)[number];

export const MIND_MAP_SHAPES = [
  "rounded",
  "rectangle",
  "ellipse",
  "diamond",
  "central",
] as const;
export type MindMapShape = (typeof MIND_MAP_SHAPES)[number];

export const MIND_MAP_BORDER_STYLES = ["solid", "dashed"] as const;
export type MindMapBorderStyle = (typeof MIND_MAP_BORDER_STYLES)[number];

export const MIND_MAP_FONT_LABELS: Record<MindMapFontToken, string> = {
  body: "Source Serif",
  display: "Didot Display",
  editorial: "Cormorant",
  utility: "Public Sans",
};

/** Curated, theme-aware fill palette (resolves to --mmc-fill-* variables). */
export const MIND_MAP_FILL_TOKENS = [
  "parchment",
  "ivory",
  "blue",
  "pale",
  "slate",
  "gold",
  "sage",
  "terracotta",
] as const;
export type MindMapFillToken = (typeof MIND_MAP_FILL_TOKENS)[number];

export const MIND_MAP_TEXT_TOKENS = [
  "ink",
  "soft",
  "blue",
  "gold",
  "green",
  "rose",
  "surface",
] as const;
export type MindMapTextToken = (typeof MIND_MAP_TEXT_TOKENS)[number];

export const MIND_MAP_BORDER_TOKENS = [
  "ink",
  "blue",
  "slate",
  "gold",
  "sage",
  "terracotta",
  "faint",
] as const;
export type MindMapBorderToken = (typeof MIND_MAP_BORDER_TOKENS)[number];

export const MIND_MAP_FONT_TOKENS = [
  "body",
  "display",
  "editorial",
  "utility",
] as const;
export type MindMapFontToken = (typeof MIND_MAP_FONT_TOKENS)[number];

export interface MindMapNodeStyle {
  shape: MindMapShape;
  fill: MindMapFillToken;
  text: MindMapTextToken;
  border: MindMapBorderToken;
  borderStyle: "solid" | "dashed";
  font: MindMapFontToken;
  /** px, clamped to a readable range. */
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: MindMapAlign;
  /** Optional glyph shown before the title (empty = none). */
  icon: string;
}

export const MIND_MAP_FONT_SIZE_MIN = 10;
export const MIND_MAP_FONT_SIZE_MAX = 28;

/* -------------------------------------------------------------------------- */
/* Graph                                                                      */
/* -------------------------------------------------------------------------- */

export const MIND_MAP_NODE_TYPE = "paideia";

export interface MindMapNodeData extends Record<string, unknown> {
  title: string;
  body: string;
  kind: MindMapNodeKind;
  importance: MindMapImportance;
  style: MindMapNodeStyle;
}

export type MindMapNode = Node<MindMapNodeData, typeof MIND_MAP_NODE_TYPE>;

export const MIND_MAP_EDGE_TYPES = [
  "default",
  "straight",
  "smoothstep",
  "step",
] as const;
export type MindMapEdgeType = (typeof MIND_MAP_EDGE_TYPES)[number];

export const MIND_MAP_EDGE_TYPE_LABELS: Record<MindMapEdgeType, string> = {
  default: "Curved",
  straight: "Straight",
  smoothstep: "Elbow",
  step: "Stepped",
};

export interface MindMapEdgeData extends Record<string, unknown> {
  label: string;
  line: "solid" | "dashed";
  color: MindMapBorderToken;
  /** Arrow head at the target end. */
  directed: boolean;
}

export type MindMapEdge = Edge<MindMapEdgeData, MindMapEdgeType>;

export interface MindMapViewport {
  x: number;
  y: number;
  zoom: number;
}

export const MIND_MAP_VERSION = 1;

export interface MindMap {
  id: string;
  bookId: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: MindMapViewport;
  version: number;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Export / import envelope                                                   */
/* -------------------------------------------------------------------------- */

export const MIND_MAP_EXPORT_FORMAT = "paideia.mindmap";

export interface MindMapExport {
  format: typeof MIND_MAP_EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  map: {
    title: string;
    nodes: MindMapNode[];
    edges: MindMapEdge[];
    viewport: MindMapViewport;
  };
}

/* -------------------------------------------------------------------------- */
/* Human labels (UI copy, kept next to the tokens they describe)              */
/* -------------------------------------------------------------------------- */

export const MIND_MAP_SHAPE_LABELS: Record<MindMapShape, string> = {
  rounded: "Rounded",
  rectangle: "Rectangle",
  ellipse: "Ellipse",
  diamond: "Diamond",
  central: "Central",
};

export const MIND_MAP_IMPORTANCE_LABELS: Record<MindMapImportance, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const MIND_MAP_ALIGN_LABELS: Record<MindMapAlign, string> = {
  left: "Left",
  center: "Centre",
  right: "Right",
};

export const MIND_MAP_FILL_LABELS: Record<MindMapFillToken, string> = {
  parchment: "Parchment",
  ivory: "Ivory",
  blue: "Ink blue",
  pale: "Pale blue",
  slate: "Slate",
  gold: "Antique gold",
  sage: "Sage",
  terracotta: "Terracotta",
};

export const MIND_MAP_BORDER_LABELS: Record<MindMapBorderToken, string> = {
  ink: "Ink",
  blue: "Blue",
  slate: "Slate",
  gold: "Gold",
  sage: "Sage",
  terracotta: "Terracotta",
  faint: "Faint",
};

export const MIND_MAP_TEXT_LABELS: Record<MindMapTextToken, string> = {
  ink: "Ink",
  soft: "Soft ink",
  blue: "Blue",
  gold: "Gold",
  green: "Green",
  rose: "Rose",
  surface: "Paper",
};
