import {
  MIND_MAP_EXPORT_FORMAT,
  MIND_MAP_VERSION,
  type MindMap,
  type MindMapExport,
} from "@/lib/types/mindmap";
import { parseMindMapJson, type ImportResult } from "./validation";

/** Build the portable, versioned export envelope for a map. */
export function mindMapExport(map: MindMap): MindMapExport {
  return {
    format: MIND_MAP_EXPORT_FORMAT,
    version: MIND_MAP_VERSION,
    exportedAt: new Date().toISOString(),
    map: {
      title: map.title,
      nodes: map.nodes,
      edges: map.edges,
      viewport: map.viewport,
    },
  };
}

/** Pretty JSON string of a map, safe to hand to a download. */
export function serializeMindMap(map: MindMap): string {
  return JSON.stringify(mindMapExport(map), null, 2);
}

/** Parse + validate a JSON string produced by any version of the exporter. */
export function deserializeMindMap(text: string): ImportResult {
  return parseMindMapJson(text);
}
