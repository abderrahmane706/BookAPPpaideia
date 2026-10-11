/**
 * Mind Map domain boundary.
 *
 * Persistence lives in the single app-wide library store (one source of truth,
 * with cross-tab sync); this module is the domain surface the mind-map UI talks
 * to: defaults, templates, layout, validation, serialization and exports.
 */

export * from "@/lib/types/mindmap";

export {
  BASE_NODE_STYLE,
  DEFAULT_VIEWPORT,
  NODE_KIND_STYLE,
  clampFontSize,
  createDefaultMap,
  createEdge,
  createNode,
  mindMapUid,
  styleForKind,
} from "./defaults";

export { MIND_MAP_TEMPLATES, getTemplate, type MindMapTemplate } from "./templates";

export { arrangeNodes } from "./layout";

export {
  MIND_MAP_MAX_EDGES,
  MIND_MAP_MAX_NODES,
  MIND_MAP_MAX_JSON_BYTES,
  parseMindMapJson,
  sanitizeEdge,
  sanitizeGraph,
  sanitizeNode,
  sanitizeNodeStyle,
  sanitizeViewport,
  type ImportResult,
  type SanitizedGraph,
} from "./validation";

export { deserializeMindMap, mindMapExport, serializeMindMap } from "./serialization";

export {
  buildMindMapSvg,
  downloadMindMapJson,
  downloadMindMapPng,
  downloadMindMapSvg,
  type SvgDocument,
} from "./export";

export {
  useMindMap,
  useMindMapReady,
  useMindMapSnapshot,
  useMindMaps,
} from "./hooks";

import { library } from "@/lib/services/library/store";
import type { MindMap, MindMapEdge, MindMapNode, MindMapViewport } from "@/lib/types/mindmap";

/**
 * Thin service facade over the shared store, so UI code has a single,
 * intention-revealing API and never reaches into storage directly.
 */
export const mindMapService = {
  list: (bookId: string): MindMap[] => library.listMindMaps(bookId),
  get: (id: string | null | undefined): MindMap | null => library.getMindMap(id),
  create: (
    bookId: string,
    options: { title?: string; templateId?: string } = {},
  ): MindMap | null => library.createMindMap(bookId, options),
  update: (
    id: string,
    patch: Partial<{
      title: string;
      nodes: MindMapNode[];
      edges: MindMapEdge[];
      viewport: MindMapViewport;
    }>,
  ): MindMap | null => library.updateMindMap(id, patch),
  remove: (id: string): boolean => library.deleteMindMap(id),
  duplicate: (id: string): MindMap | null => library.duplicateMindMap(id),
};
