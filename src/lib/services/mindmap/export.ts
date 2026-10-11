import type { MindMap, MindMapEdge, MindMapNode } from "@/lib/types/mindmap";
import { slugifyFilename, downloadText } from "@/lib/utils/export";
import { serializeMindMap } from "./serialization";

/* -------------------------------------------------------------------------- */
/* Token resolution                                                           */
/* -------------------------------------------------------------------------- */

const FALLBACK_COLORS: Record<string, string> = {
  "mmc-fill-parchment": "#f3eee1",
  "mmc-fill-ivory": "#faf6ec",
  "mmc-fill-blue": "#dbe6f4",
  "mmc-fill-pale": "#e7edf5",
  "mmc-fill-slate": "#e2e5ea",
  "mmc-fill-gold": "#f0e6cf",
  "mmc-fill-sage": "#e0e8da",
  "mmc-fill-terracotta": "#f1e0d6",
  "mmc-text-ink": "#16448a",
  "mmc-text-soft": "#3c5f8e",
  "mmc-text-blue": "#245fbd",
  "mmc-text-gold": "#6b5220",
  "mmc-text-green": "#3b6446",
  "mmc-text-rose": "#823f34",
  "mmc-border-ink": "#1a54a5",
  "mmc-border-blue": "#5188cf",
  "mmc-border-slate": "#7a8798",
  "mmc-border-gold": "#a2823f",
  "mmc-border-sage": "#6f9a72",
  "mmc-border-terracotta": "#bc6b4a",
  "mmc-border-faint": "#b3bfcf",
  "mm-canvas": "#ece7da",
};

/** Resolve a `--mmc-*` token from the live theme, with a light fallback. */
function resolveToken(name: string): string {
  if (typeof window === "undefined") return FALLBACK_COLORS[name] ?? "#888888";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  return value || FALLBACK_COLORS[name] || "#888888";
}

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

interface Box {
  node: MindMapNode;
  x: number;
  y: number;
  w: number;
  h: number;
}

function estimateSize(node: MindMapNode): { w: number; h: number } {
  const explicitW = node.width ?? node.measured?.width;
  const explicitH = node.height ?? node.measured?.height;
  const size = node.data.style.fontSize;
  const titleChars = node.data.title.length;
  const bodyChars = node.data.body.length;
  const charsPerLine = 22;
  const titleLines = Math.max(1, Math.ceil(titleChars / charsPerLine));
  const bodyLines = bodyChars > 0 ? Math.ceil(bodyChars / (charsPerLine + 6)) : 0;
  const w =
    explicitW ??
    Math.min(320, Math.max(150, 44 + Math.min(titleChars, 26) * size * 0.62));
  const h =
    explicitH ?? 28 + titleLines * (size + 4) + bodyLines * (size * 0.85 + 2);
  return { w: Math.round(w), h: Math.round(h) };
}

function boxes(nodes: MindMapNode[]): Box[] {
  return nodes.map((node) => {
    const { w, h } = estimateSize(node);
    return { node, x: node.position.x, y: node.position.y, w, h };
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text: string, size: number, maxWidth: number): string[] {
  const approxCharWidth = size * 0.56;
  const maxChars = Math.max(6, Math.floor(maxWidth / approxCharWidth));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function fontFamilyFor(token: string): string {
  switch (token) {
    case "display":
      return "'GFS Didot', 'Cormorant Garamond', Georgia, serif";
    case "editorial":
      return "'Cormorant Garamond', Georgia, serif";
    case "utility":
      return "'Public Sans', Arial, sans-serif";
    default:
      return "'Source Serif 4', Georgia, serif";
  }
}

/* -------------------------------------------------------------------------- */
/* SVG                                                                        */
/* -------------------------------------------------------------------------- */

export interface SvgDocument {
  markup: string;
  width: number;
  height: number;
}

/** Build a standalone SVG (no foreignObject, no external assets). */
export function buildMindMapSvg(map: {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}): SvgDocument {
  const nodeBoxes = boxes(map.nodes);
  const byId = new Map(nodeBoxes.map((b) => [b.node.id, b]));
  const pad = 64;

  if (nodeBoxes.length === 0) {
    return {
      markup: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"></svg>`,
      width: 320,
      height: 200,
    };
  }

  const minX = Math.min(...nodeBoxes.map((b) => b.x)) - pad;
  const minY = Math.min(...nodeBoxes.map((b) => b.y)) - pad;
  const maxX = Math.max(...nodeBoxes.map((b) => b.x + b.w)) + pad;
  const maxY = Math.max(...nodeBoxes.map((b) => b.y + b.h)) + pad;
  const width = Math.round(maxX - minX);
  const height = Math.round(maxY - minY);

  const background = resolveToken("mm-canvas");
  const edgeMarkup: string[] = [];
  const nodeMarkup: string[] = [];

  for (const edge of map.edges) {
    const a = byId.get(edge.source);
    const b = byId.get(edge.target);
    if (!a || !b) continue;
    const sx = a.x + a.w / 2;
    const sy = a.y + a.h / 2;
    const tx = b.x + b.w / 2;
    const ty = b.y + b.h / 2;
    const color = resolveToken(`mmc-border-${edge.data?.color ?? "slate"}`);
    const dash = edge.data?.line === "dashed" ? ' stroke-dasharray="7 5"' : "";
    const marker =
      edge.data?.directed === false
        ? ""
        : ` marker-end="url(#arrow-${edge.data?.color ?? "slate"})"`;
    edgeMarkup.push(
      `<line x1="${sx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="${color}" stroke-width="1.6"${dash}${marker} />`,
    );
    const label = edge.data?.label?.trim();
    if (label) {
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      edgeMarkup.push(
        `<text x="${mx.toFixed(1)}" y="${my.toFixed(1)}" font-size="11" font-family="'Public Sans', Arial, sans-serif" fill="${resolveToken("mmc-text-soft")}" text-anchor="middle" paint-order="stroke" stroke="${background}" stroke-width="3">${escapeXml(label)}</text>`,
      );
    }
  }

  const paletteUsed = new Set<string>();
  for (const box of nodeBoxes) {
    const style = box.node.data.style;
    paletteUsed.add(style.border);
    const fill = resolveToken(`mmc-fill-${style.fill}`);
    const stroke = resolveToken(`mmc-border-${style.border}`);
    const text = resolveToken(`mmc-text-${style.text}`);
    const dash = style.borderStyle === "dashed" ? ' stroke-dasharray="6 4"' : "";
    const cx = box.x;
    const cy = box.y;
    const shape = style.shape;

    if (shape === "ellipse") {
      nodeMarkup.push(
        `<ellipse cx="${cx + box.w / 2}" cy="${cy + box.h / 2}" rx="${box.w / 2}" ry="${box.h / 2}" fill="${fill}" stroke="${stroke}"${dash} stroke-width="1.5" />`,
      );
    } else if (shape === "diamond") {
      const pts = `${cx + box.w / 2},${cy} ${cx + box.w},${cy + box.h / 2} ${cx + box.w / 2},${cy + box.h} ${cx},${cy + box.h / 2}`;
      nodeMarkup.push(
        `<polygon points="${pts}" fill="${fill}" stroke="${stroke}"${dash} stroke-width="1.5" />`,
      );
    } else {
      const rx = shape === "rectangle" ? 0 : 10;
      nodeMarkup.push(
        `<rect x="${cx}" y="${cy}" width="${box.w}" height="${box.h}" rx="${rx}" fill="${fill}" stroke="${stroke}"${dash} stroke-width="1.5" />`,
      );
      if (shape === "central") {
        nodeMarkup.push(
          `<rect x="${cx + 3}" y="${cy + 3}" width="${box.w - 6}" height="${box.h - 6}" rx="8" fill="none" stroke="${stroke}" stroke-width="0.8" opacity="0.6" />`,
        );
      }
    }

    // Text (title + body), honouring alignment and weight.
    const anchor =
      style.align === "left"
        ? "start"
        : style.align === "right"
          ? "end"
          : "middle";
    const textX =
      style.align === "left"
        ? cx + 12
        : style.align === "right"
          ? cx + box.w - 12
          : cx + box.w / 2;
    const weight = style.bold ? 600 : 400;
    const fontStyle = style.italic ? "italic" : "normal";
    const decoration = style.underline ? "underline" : "none";
    const family = fontFamilyFor(style.font);

    const titleText = style.icon
      ? `${style.icon} ${box.node.data.title}`
      : box.node.data.title;
    const titleLines = wrap(titleText, style.fontSize, box.w - 24);
    let cursorY = cy + 10 + style.fontSize;
    for (const line of titleLines) {
      nodeMarkup.push(
        `<text x="${textX.toFixed(1)}" y="${cursorY.toFixed(1)}" font-size="${style.fontSize}" font-family="${family}" font-weight="${weight}" font-style="${fontStyle}" text-decoration="${decoration}" fill="${text}" text-anchor="${anchor}">${escapeXml(line)}</text>`,
      );
      cursorY += style.fontSize + 4;
    }

    if (box.node.data.body) {
      const bodySize = style.fontSize * 0.82;
      const bodyLines = wrap(box.node.data.body, bodySize, box.w - 20);
      cursorY += 2;
      for (const line of bodyLines) {
        nodeMarkup.push(
          `<text x="${textX.toFixed(1)}" y="${cursorY.toFixed(1)}" font-size="${bodySize.toFixed(1)}" font-family="${fontFamilyFor("body")}" fill="${text}" text-anchor="${anchor}" opacity="0.9">${escapeXml(line)}</text>`,
        );
        cursorY += bodySize * 0.9 + 2;
      }
    }
  }

  const markers = [...paletteUsed]
    .map(
      (token) =>
        `<marker id="arrow-${token}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${resolveToken(`mmc-border-${token}`)}" /></marker>`,
    )
    .join("");

  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">
  <defs>${markers}</defs>
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${background}" />
  ${edgeMarkup.join("\n  ")}
  ${nodeMarkup.join("\n  ")}
</svg>`;

  return { markup, width, height };
}

/* -------------------------------------------------------------------------- */
/* Downloads                                                                  */
/* -------------------------------------------------------------------------- */

export function downloadMindMapJson(map: MindMap): void {
  downloadText(
    `${slugifyFilename(map.title)}.mindmap.json`,
    serializeMindMap(map),
    "application/json",
  );
}

export function downloadMindMapSvg(map: MindMap): void {
  const { markup } = buildMindMapSvg(map);
  downloadText(`${slugifyFilename(map.title)}.svg`, markup, "image/svg+xml");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not render the image."));
    image.src = url;
  });
}

/** Rasterise the standalone SVG to a PNG and download it. */
export async function downloadMindMapPng(map: MindMap): Promise<void> {
  const { markup, width, height } = buildMindMapSvg(map);
  const svgBlob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImage(url);
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable in this browser.");
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Could not create the PNG.");
    const pngUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = pngUrl;
    anchor.download = `${slugifyFilename(map.title)}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(pngUrl), 0);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
