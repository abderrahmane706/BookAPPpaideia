/**
 * Mind Map domain boundary — persistence-oriented.
 *
 * The mind-map editor is a later phase. This boundary models the *persistent
 * data* (maps, nodes, edges) so the future editor plugs into existing
 * architecture rather than requiring a rewrite. UI/rendering concerns are not
 * defined here.
 */

export interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  /** Semantic importance, for later ranking/rendering. */
  importance: "low" | "medium" | "high";
  color: string;
  /** Optional free-form text body shown on the card. */
  body?: string;
}

export interface MindMapEdge {
  id: string;
  sourceId: string;
  targetId: string;
  /** Optional relationship label. */
  label?: string;
}

export interface MindMap {
  id: string;
  /** Scoped to an optional book, or a free-standing map. */
  bookId?: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  updatedAt: string;
}

/** Persistence boundary for maps. */
export interface MindMapService {
  getMap(id: string): Promise<MindMap | null>;
  listMaps(bookId?: string): Promise<MindMap[]>;
  saveMap(map: MindMap): Promise<MindMap>;
}
