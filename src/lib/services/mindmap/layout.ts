import type { MindMapEdge, MindMapNode } from "@/lib/types/mindmap";

const COLUMN_GAP = 284;
const ROW_GAP = 138;

function degree(id: string, edges: MindMapEdge[]): number {
  let count = 0;
  for (const edge of edges) {
    if (edge.source === id) count += 1;
    if (edge.target === id) count += 1;
  }
  return count;
}

/**
 * Deterministic, dependency-free auto-arrange: pick a root (the central idea,
 * else the best-connected node), BFS outward, and place each depth on its own
 * column centred vertically. Stable across runs so arrange + undo stay sane.
 */
export function arrangeNodes(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
): MindMapNode[] {
  if (nodes.length <= 1) return nodes;

  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  const root =
    nodes.find((node) => node.data.kind === "central") ??
    [...nodes].sort((a, b) => degree(b.id, edges) - degree(a.id, edges))[0];

  const depth = new Map<string, number>();
  const order: string[] = [];
  const queue: string[] = [root.id];
  depth.set(root.id, 0);

  while (queue.length > 0) {
    const id = queue.shift() as string;
    order.push(id);
    for (const next of adjacency.get(id) ?? []) {
      if (depth.has(next)) continue;
      depth.set(next, (depth.get(id) ?? 0) + 1);
      queue.push(next);
    }
  }

  // Isolated nodes sit at the root column.
  for (const node of nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, 0);
      order.push(node.id);
    }
  }

  const columns = new Map<number, string[]>();
  for (const id of order) {
    const d = depth.get(id) ?? 0;
    const bucket = columns.get(d);
    if (bucket) bucket.push(id);
    else columns.set(d, [id]);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const depths = [...columns.keys()].sort((a, b) => a - b);
  for (const d of depths) {
    const ids = columns.get(d) as string[];
    const count = ids.length;
    ids.forEach((id, index) => {
      positions.set(id, {
        x: d * COLUMN_GAP,
        y: (index - (count - 1) / 2) * ROW_GAP,
      });
    });
  }

  return nodes.map((node) => {
    const position = positions.get(node.id);
    return position ? { ...node, position } : node;
  });
}
