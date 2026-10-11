import type { MindMapEdge, MindMapNode } from "@/lib/types/mindmap";
import { createEdge, createNode } from "./defaults";

export interface MindMapTemplate {
  id: string;
  name: string;
  description: string;
  /** Deterministically builds a fresh graph. Never invents book content. */
  build(): { nodes: MindMapNode[]; edges: MindMapEdge[] };
}

/** Connect `parent` to each child and return the edges. */
function star(parent: MindMapNode, children: MindMapNode[]): MindMapEdge[] {
  return children.map((child) => createEdge(parent.id, child.id));
}

const blank: MindMapTemplate = {
  id: "blank",
  name: "Blank",
  description: "A single central idea to build outward from.",
  build() {
    const central = createNode("central", { x: 0, y: 0 }, { title: "Main Idea" });
    return { nodes: [central], edges: [] };
  },
};

const mainIdea: MindMapTemplate = {
  id: "main-idea",
  name: "Main Idea",
  description: "A central idea with four surrounding concepts.",
  build() {
    const central = createNode("central", { x: 0, y: 0 }, { title: "Main Idea" });
    const concepts = [
      createNode("concept", { x: -280, y: -120 }, { title: "Concept 1" }),
      createNode("concept", { x: 280, y: -120 }, { title: "Concept 2" }),
      createNode("concept", { x: -280, y: 140 }, { title: "Concept 3" }),
      createNode("concept", { x: 280, y: 140 }, { title: "Concept 4" }),
    ];
    return { nodes: [central, ...concepts], edges: star(central, concepts) };
  },
};

const argument: MindMapTemplate = {
  id: "argument",
  name: "Argument Map",
  description: "A claim, its supporting reasons and a counterpoint.",
  build() {
    const claim = createNode("central", { x: 0, y: 0 }, { title: "Claim" });
    const reasons = [
      createNode("supporting", { x: -320, y: -160 }, { title: "Reason 1" }),
      createNode("supporting", { x: -320, y: 0 }, { title: "Reason 2" }),
      createNode("supporting", { x: -320, y: 160 }, { title: "Reason 3" }),
    ];
    const evidence = createNode(
      "example",
      { x: -600, y: 0 },
      { title: "Evidence" },
    );
    const counter = createNode(
      "question",
      { x: 320, y: 0 },
      { title: "Counterpoint" },
    );
    const conclusion = createNode(
      "conclusion",
      { x: 0, y: 260 },
      { title: "Conclusion" },
    );
    const edges: MindMapEdge[] = [
      ...star(claim, reasons),
      createEdge(reasons[1].id, evidence.id),
      createEdge(claim.id, counter.id, { line: "dashed", color: "terracotta" }),
      createEdge(claim.id, conclusion.id),
    ];
    return {
      nodes: [claim, ...reasons, evidence, counter, conclusion],
      edges,
    };
  },
};

const chapterOutline: MindMapTemplate = {
  id: "chapter-outline",
  name: "Chapter Outline",
  description: "A chapter broken into its sections and key points.",
  build() {
    const chapter = createNode("central", { x: 0, y: 0 }, { title: "Chapter" });
    const sections = [0, 1, 2, 3].map((i) =>
      createNode("concept", { x: 300, y: i * 140 - 210 }, { title: `Section ${i + 1}` }),
    );
    const points = sections.map((section, i) =>
      createNode(
        "supporting",
        { x: 620, y: i * 140 - 250 },
        { title: "Key point" },
      ),
    );
    const edges: MindMapEdge[] = [
      ...star(chapter, sections),
      ...sections.map((section, i) => createEdge(section.id, points[i].id)),
    ];
    return { nodes: [chapter, ...sections, ...points], edges };
  },
};

const conceptConnections: MindMapTemplate = {
  id: "concept-connections",
  name: "Concept Connections",
  description: "Related concepts linked to one another, not just a centre.",
  build() {
    const core = createNode("central", { x: 0, y: 0 }, { title: "Core Concept" });
    const a = createNode("concept", { x: -280, y: -160 }, { title: "Concept A" });
    const b = createNode("concept", { x: 280, y: -160 }, { title: "Concept B" });
    const c = createNode("concept", { x: 0, y: 200 }, { title: "Concept C" });
    const edges: MindMapEdge[] = [
      createEdge(core.id, a.id),
      createEdge(core.id, b.id),
      createEdge(core.id, c.id),
      createEdge(a.id, b.id, { line: "dashed", directed: false }),
      createEdge(b.id, c.id, { line: "dashed", directed: false }),
    ];
    return { nodes: [core, a, b, c], edges };
  },
};

export const MIND_MAP_TEMPLATES: MindMapTemplate[] = [
  blank,
  mainIdea,
  argument,
  chapterOutline,
  conceptConnections,
];

export function getTemplate(id: string): MindMapTemplate | null {
  return MIND_MAP_TEMPLATES.find((t) => t.id === id) ?? null;
}
