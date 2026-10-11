"use client";

import {
  MIND_MAP_NODE_KINDS,
  MIND_MAP_NODE_KIND_ICONS,
  MIND_MAP_NODE_KIND_LABELS,
  type MindMapNodeKind,
} from "@/lib/types/mindmap";
import { cn } from "@/lib/utils/cn";

export interface MindMapNodePaletteProps {
  onAdd: (kind: MindMapNodeKind) => void;
  className?: string;
}

/** The node shelf: one deliberate affordance per idea type. */
export function MindMapNodePalette({ onAdd, className }: MindMapNodePaletteProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {MIND_MAP_NODE_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onAdd(kind)}
          className={cn(
            "flex items-center gap-2.5 rounded-radius-sm border border-line bg-surface/60 px-2.5 py-2 text-left",
            "font-utility text-xs text-ink-soft transition-colors",
            "hover:border-engraving hover:bg-engraving/5 hover:text-engraving-deep",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving",
          )}
        >
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-strong bg-parchment-shade/60 text-[13px] text-engraving-deep"
          >
            {MIND_MAP_NODE_KIND_ICONS[kind]}
          </span>
          {MIND_MAP_NODE_KIND_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}
