"use client";

import type { ReactNode } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import {
  MIND_MAP_ALIGNS,
  MIND_MAP_ALIGN_LABELS,
  MIND_MAP_BORDER_LABELS,
  MIND_MAP_BORDER_STYLES,
  MIND_MAP_BORDER_TOKENS,
  MIND_MAP_EDGE_TYPES,
  MIND_MAP_EDGE_TYPE_LABELS,
  MIND_MAP_FILL_LABELS,
  MIND_MAP_FILL_TOKENS,
  MIND_MAP_FONT_LABELS,
  MIND_MAP_FONT_SIZE_MAX,
  MIND_MAP_FONT_SIZE_MIN,
  MIND_MAP_IMPORTANCE_LABELS,
  MIND_MAP_IMPORTANCE_LEVELS,
  MIND_MAP_NODE_KINDS,
  MIND_MAP_NODE_KIND_LABELS,
  MIND_MAP_SHAPES,
  MIND_MAP_SHAPE_LABELS,
  MIND_MAP_TEXT_LABELS,
  MIND_MAP_TEXT_TOKENS,
  type MindMapBorderToken,
  type MindMapEdge,
  type MindMapEdgeData,
  type MindMapEdgeType,
  type MindMapFillToken,
  type MindMapNode,
  type MindMapNodeData,
  type MindMapNodeKind,
  type MindMapNodeStyle,
  type MindMapTextToken,
} from "@/lib/types/mindmap";
import { cn } from "@/lib/utils/cn";

export interface MindMapInspectorProps {
  node: MindMapNode | null;
  edge: MindMapEdge | null;
  onNodeData: (patch: Partial<MindMapNodeData>) => void;
  onNodeStyle: (patch: Partial<MindMapNodeStyle>) => void;
  onEdgeData: (patch: Partial<MindMapEdgeData>) => void;
  onEdgeType: (type: MindMapEdgeType) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  className?: string;
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <span className="font-utility text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </span>
      {children}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-8 flex-1 items-center justify-center rounded-radius-sm border text-sm transition-colors",
        active
          ? "border-engraving bg-engraving/10 text-engraving-deep"
          : "border-line-strong bg-surface text-ink-soft hover:text-engraving-deep",
      )}
    >
      {children}
    </button>
  );
}

function SwatchRow<T extends string>({
  tokens,
  labels,
  value,
  variant,
  onSelect,
}: {
  tokens: readonly T[];
  labels: Record<T, string>;
  value: T;
  variant: "fill" | "text" | "border";
  onSelect: (token: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((token) => {
        const background =
          variant === "fill"
            ? `var(--mmc-fill-${token})`
            : variant === "text"
              ? `var(--mmc-text-${token})`
              : `var(--mmc-border-${token})`;
        return (
          <button
            key={token}
            type="button"
            title={labels[token]}
            aria-label={labels[token]}
            aria-pressed={value === token}
            onClick={() => onSelect(token)}
            className={cn(
              "h-7 w-7 rounded-radius-sm border transition-transform hover:scale-105",
              value === token ? "border-engraving ring-2 ring-engraving/40" : "border-line-strong",
            )}
            style={{
              background,
              boxShadow: variant === "text" ? "inset 0 0 0 6px var(--surface)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function NodeEditor({
  node,
  onNodeData,
  onNodeStyle,
  onDuplicate,
  onDelete,
}: {
  node: MindMapNode;
  onNodeData: (patch: Partial<MindMapNodeData>) => void;
  onNodeStyle: (patch: Partial<MindMapNodeStyle>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { data } = node;
  const style = data.style;

  return (
    <div className="grid gap-5">
      <Field label="Title" htmlFor="mm-node-title">
        <Input
          id="mm-node-title"
          value={data.title ?? ""}
          onChange={(event) => onNodeData({ title: event.target.value })}
        />
      </Field>

      <Field label="Body" htmlFor="mm-node-body">
        <Textarea
          id="mm-node-body"
          rows={3}
          value={data.body ?? ""}
          onChange={(event) => onNodeData({ body: event.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" htmlFor="mm-node-kind">
          <Select
            id="mm-node-kind"
            value={data.kind}
            onChange={(event) =>
              onNodeData({ kind: event.target.value as MindMapNodeKind })
            }
          >
            {MIND_MAP_NODE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {MIND_MAP_NODE_KIND_LABELS[kind]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Weight" htmlFor="mm-node-importance">
          <Select
            id="mm-node-importance"
            value={data.importance}
            onChange={(event) =>
              onNodeData({
                importance: event.target.value as MindMapNodeData["importance"],
              })
            }
          >
            {MIND_MAP_IMPORTANCE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {MIND_MAP_IMPORTANCE_LABELS[level]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Group label="Shape">
        <Select
          value={style.shape}
          onChange={(event) =>
            onNodeStyle({ shape: event.target.value as MindMapNodeStyle["shape"] })
          }
        >
          {MIND_MAP_SHAPES.map((shape) => (
            <option key={shape} value={shape}>
              {MIND_MAP_SHAPE_LABELS[shape]}
            </option>
          ))}
        </Select>
      </Group>

      <Group label="Fill">
        <SwatchRow
          tokens={MIND_MAP_FILL_TOKENS}
          labels={MIND_MAP_FILL_LABELS}
          value={style.fill}
          variant="fill"
          onSelect={(fill: MindMapFillToken) => onNodeStyle({ fill })}
        />
      </Group>

      <Group label="Text colour">
        <SwatchRow
          tokens={MIND_MAP_TEXT_TOKENS}
          labels={MIND_MAP_TEXT_LABELS}
          value={style.text}
          variant="text"
          onSelect={(text: MindMapTextToken) => onNodeStyle({ text })}
        />
      </Group>

      <Group label="Border colour">
        <SwatchRow
          tokens={MIND_MAP_BORDER_TOKENS}
          labels={MIND_MAP_BORDER_LABELS}
          value={style.border}
          variant="border"
          onSelect={(border: MindMapBorderToken) => onNodeStyle({ border })}
        />
      </Group>

      <Group label="Border style">
        <div className="flex gap-1.5">
          {MIND_MAP_BORDER_STYLES.map((borderStyle) => (
            <Toggle
              key={borderStyle}
              title={borderStyle === "solid" ? "Solid border" : "Dashed border"}
              active={style.borderStyle === borderStyle}
              onClick={() => onNodeStyle({ borderStyle })}
            >
              {borderStyle === "solid" ? "Solid" : "Dashed"}
            </Toggle>
          ))}
        </div>
      </Group>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Font" htmlFor="mm-node-font">
          <Select
            id="mm-node-font"
            value={style.font}
            onChange={(event) =>
              onNodeStyle({ font: event.target.value as MindMapNodeStyle["font"] })
            }
          >
            {Object.entries(MIND_MAP_FONT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Size" htmlFor="mm-node-size">
          <Input
            id="mm-node-size"
            type="number"
            min={MIND_MAP_FONT_SIZE_MIN}
            max={MIND_MAP_FONT_SIZE_MAX}
            value={style.fontSize ?? MIND_MAP_FONT_SIZE_MIN}
            onChange={(event) =>
              onNodeStyle({ fontSize: Number(event.target.value) })
            }
          />
        </Field>
      </div>

      <Group label="Emphasis">
        <div className="flex gap-1.5">
          <Toggle
            title="Bold"
            active={style.bold}
            onClick={() => onNodeStyle({ bold: !style.bold })}
          >
            <span className="font-semibold">B</span>
          </Toggle>
          <Toggle
            title="Italic"
            active={style.italic}
            onClick={() => onNodeStyle({ italic: !style.italic })}
          >
            <span className="italic">I</span>
          </Toggle>
          <Toggle
            title="Underline"
            active={style.underline}
            onClick={() => onNodeStyle({ underline: !style.underline })}
          >
            <span className="underline">U</span>
          </Toggle>
        </div>
      </Group>

      <Group label="Alignment">
        <div className="flex gap-1.5">
          {MIND_MAP_ALIGNS.map((align) => (
            <Toggle
              key={align}
              title={`${MIND_MAP_ALIGN_LABELS[align]} align`}
              active={style.align === align}
              onClick={() => onNodeStyle({ align })}
            >
              {MIND_MAP_ALIGN_LABELS[align]}
            </Toggle>
          ))}
        </div>
      </Group>

      <Field label="Icon / glyph" htmlFor="mm-node-icon" hint="Up to four characters. Leave empty for none.">
        <Input
          id="mm-node-icon"
          maxLength={4}
          value={style.icon ?? ""}
          onChange={(event) => onNodeStyle({ icon: event.target.value })}
        />
      </Field>

      <div className="flex gap-2 border-t border-line pt-4">
        <Button variant="secondary" size="sm" onClick={onDuplicate} className="flex-1">
          Duplicate
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete} className="flex-1">
          Delete node
        </Button>
      </div>
    </div>
  );
}

function EdgeEditor({
  edge,
  onEdgeData,
  onEdgeType,
  onDelete,
}: {
  edge: MindMapEdge;
  onEdgeData: (patch: Partial<MindMapEdgeData>) => void;
  onEdgeType: (type: MindMapEdgeType) => void;
  onDelete: () => void;
}) {
  const data = edge.data ?? { label: "", line: "solid", color: "slate", directed: true };
  return (
    <div className="grid gap-5">
      <Field label="Label" htmlFor="mm-edge-label">
        <Input
          id="mm-edge-label"
          value={data.label ?? ""}
          placeholder="e.g. because"
          onChange={(event) => onEdgeData({ label: event.target.value })}
        />
      </Field>

      <Field label="Shape" htmlFor="mm-edge-type">
        <Select
          id="mm-edge-type"
          value={edge.type ?? "default"}
          onChange={(event) => onEdgeType(event.target.value as MindMapEdgeType)}
        >
          {MIND_MAP_EDGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {MIND_MAP_EDGE_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </Field>

      <Group label="Line">
        <div className="flex gap-1.5">
          <Toggle
            title="Solid line"
            active={data.line === "solid"}
            onClick={() => onEdgeData({ line: "solid" })}
          >
            Solid
          </Toggle>
          <Toggle
            title="Dashed line"
            active={data.line === "dashed"}
            onClick={() => onEdgeData({ line: "dashed" })}
          >
            Dashed
          </Toggle>
        </div>
      </Group>

      <Group label="Colour">
        <SwatchRow
          tokens={MIND_MAP_BORDER_TOKENS}
          labels={MIND_MAP_BORDER_LABELS}
          value={data.color}
          variant="border"
          onSelect={(color: MindMapBorderToken) => onEdgeData({ color })}
        />
      </Group>

      <Group label="Arrow">
        <Toggle
          title="Toggle direction arrow"
          active={data.directed}
          onClick={() => onEdgeData({ directed: !data.directed })}
        >
          {data.directed ? "Directional" : "Undirected"}
        </Toggle>
      </Group>

      <div className="border-t border-line pt-4">
        <Button variant="danger" size="sm" onClick={onDelete} className="w-full">
          Delete connection
        </Button>
      </div>
    </div>
  );
}

/** Right-hand inspector: edits whichever element is selected. */
export function MindMapInspector({
  node,
  edge,
  onNodeData,
  onNodeStyle,
  onEdgeData,
  onEdgeType,
  onDuplicate,
  onDelete,
  className,
}: MindMapInspectorProps) {
  return (
    <div className={cn("grid gap-4", className)}>
      {node ? (
        <NodeEditor
          node={node}
          onNodeData={onNodeData}
          onNodeStyle={onNodeStyle}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ) : edge ? (
        <EdgeEditor
          edge={edge}
          onEdgeData={onEdgeData}
          onEdgeType={onEdgeType}
          onDelete={onDelete}
        />
      ) : (
        <p className="rounded-radius-sm border border-dashed border-line-strong bg-parchment-shade/40 px-4 py-6 text-center text-sm text-ink-faint">
          Select a node or connection to shape its content and form.
        </p>
      )}
    </div>
  );
}
