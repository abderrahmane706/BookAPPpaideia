"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import {
  MIND_MAP_NODE_KIND_LABELS,
  type MindMapNode,
  type MindMapNodeStyle,
} from "@/lib/types/mindmap";
import { cn } from "@/lib/utils/cn";
import { useMindMapCanvas } from "./mindMapContext";

const FONT_VARS: Record<MindMapNodeStyle["font"], string> = {
  body: "var(--font-body)",
  display: "var(--font-display)",
  editorial: "var(--font-editorial)",
  utility: "var(--font-utility)",
};

function Surface({ style }: { style: MindMapNodeStyle }) {
  const fill = `var(--mmc-fill-${style.fill})`;
  const border = `var(--mmc-border-${style.border})`;
  const dash = style.borderStyle === "dashed" ? "dashed" : "solid";

  if (style.shape === "ellipse") {
    return (
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: fill,
          border: `1.5px ${dash} ${border}`,
          borderRadius: "50%",
        }}
      />
    );
  }

  if (style.shape === "diamond") {
    const clip = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    return (
      <>
        <span
          aria-hidden
          className="absolute inset-0"
          style={{ background: border, clipPath: clip }}
        />
        <span
          aria-hidden
          className="absolute"
          style={{ inset: 2, background: fill, clipPath: clip }}
        />
      </>
    );
  }

  const radius = style.shape === "rectangle" ? 2 : 12;
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: fill,
          border: `1.5px ${dash} ${border}`,
          borderRadius: radius,
        }}
      />
      {style.shape === "central" ? (
        <span
          aria-hidden
          className="absolute rounded-[10px]"
          style={{
            inset: 4,
            border: `1px solid color-mix(in srgb, ${border} 65%, transparent)`,
          }}
        />
      ) : null}
    </>
  );
}

function MindMapNodeCardInner({ id, data, selected }: NodeProps<MindMapNode>) {
  const { updateNodeData, addConnectedNode } = useMindMapCanvas();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(data.title);
  const [draftBody, setDraftBody] = useState(data.body);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) titleRef.current?.focus();
  }, [editing]);

  const startEditing = () => {
    setDraftTitle(data.title);
    setDraftBody(data.body);
    setEditing(true);
  };

  const commit = () => {
    const title = draftTitle.trim() || "Untitled";
    if (title !== data.title || draftBody !== data.body) {
      updateNodeData(id, { title, body: draftBody });
    }
    setEditing(false);
  };

  const style = data.style;
  const textStyle: CSSProperties = {
    fontFamily: FONT_VARS[style.font],
    fontSize: `${style.fontSize}px`,
    fontWeight: style.bold ? 600 : 400,
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    textAlign: style.align,
    color: `var(--mmc-text-${style.text})`,
  };

  const wrapperVars: CSSProperties = { width: "100%" };

  return (
    <div
      className={cn("mm-node", selected && "is-selected")}
      style={wrapperVars}
      onDoubleClick={(event) => {
        event.stopPropagation();
        startEditing();
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={120}
        minHeight={52}
        lineClassName="!border-engraving/60"
        handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-engraving"
      />
      <Surface style={style} />

      <Handle
        type="target"
        position={Position.Left}
        className="nodrag"
        aria-label="Connection target"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="nodrag"
        aria-label="Connection source"
      />

      <div className="relative z-10">
        <div className="mm-node__type" style={{ color: `var(--mmc-text-${style.text})` }}>
          {MIND_MAP_NODE_KIND_LABELS[data.kind]}
        </div>

        {editing ? (
          <div className="nodrag mt-1 grid gap-1.5">
            <input
              ref={titleRef}
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") commit();
                event.stopPropagation();
              }}
              aria-label="Node title"
              className="w-full rounded-[6px] border border-line-strong bg-surface-raised px-2 py-1 text-sm text-ink outline-none focus:border-engraving"
            />
            <textarea
              value={draftBody}
              rows={3}
              onChange={(event) => setDraftBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") commit();
              }}
              placeholder="Optional detail…"
              className="w-full resize-none rounded-[6px] border border-line-strong bg-surface-raised px-2 py-1 text-xs text-ink focus:border-engraving focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="nodrag font-utility text-[10px] uppercase tracking-wider text-ink-faint hover:text-ink"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="nodrag font-utility text-[10px] uppercase tracking-wider text-engraving-deep hover:text-ink"
                onClick={commit}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mm-node__title flex items-start gap-1" style={textStyle}>
              {style.icon ? (
                <span aria-hidden className="mm-node__icon">
                  {style.icon}
                </span>
              ) : null}
              <span className="min-w-0 flex-1">
                {data.title || "Untitled"}
              </span>
            </div>
            {data.body ? (
              <p
                className="mm-node__body"
                style={{ ...textStyle, fontSize: `${Math.max(11, style.fontSize - 2)}px`, opacity: 0.88 }}
              >
                {data.body}
              </p>
            ) : null}
          </>
        )}
      </div>

      {selected && !editing ? (
        <button
          type="button"
          className="nodrag absolute -bottom-3 left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-line-strong bg-surface-raised text-sm leading-none text-engraving-deep shadow-card hover:bg-surface"
          title="Add connected idea"
          aria-label="Add connected idea"
          onClick={(event) => {
            event.stopPropagation();
            addConnectedNode(id);
          }}
        >
          +
        </button>
      ) : null}
    </div>
  );
}

export const MindMapNodeCard = memo(MindMapNodeCardInner);
