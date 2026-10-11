"use client";

import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { Select } from "@/components/ui";
import type { MindMapNodeKind } from "@/lib/types/mindmap";
import { cn } from "@/lib/utils/cn";
import { MindMapSaveIndicator, type MindMapSaveStatus } from "./MindMapSaveIndicator";

export interface MindMapToolbarProps {
  bookTitle: string;
  backHref: string;
  title: string;
  onTitleChange: (title: string) => void;
  maps: { id: string; title: string }[];
  activeMapId: string;
  onSelectMap: (id: string) => void;
  onNewMap: () => void;
  onDuplicateMap: () => void;
  onDeleteMap: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddNode: (kind: MindMapNodeKind) => void;
  onOrganize: () => void;
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectAll: () => void;
  onDeleteSelection: () => void;
  onExport: () => void;
  onImport: () => void;
  saveStatus: MindMapSaveStatus;
  onToggleNodes: () => void;
  onToggleInspector: () => void;
}

function ToolButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-radius-sm border border-line-strong bg-surface px-2.5",
        "font-utility text-xs text-ink-soft transition-colors",
        "hover:border-engraving hover:text-engraving-deep disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** The editor's command bar: identity, history, view, and file actions. */
export function MindMapToolbar(props: MindMapToolbarProps) {
  const {
    bookTitle,
    backHref,
    title,
    onTitleChange,
    maps,
    activeMapId,
    onSelectMap,
    onNewMap,
    onDuplicateMap,
    onDeleteMap,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onAddNode,
    onOrganize,
    onFitView,
    onZoomIn,
    onZoomOut,
    onSelectAll,
    onDeleteSelection,
    onExport,
    onImport,
    saveStatus,
    onToggleNodes,
    onToggleInspector,
  } = props;

  return (
    <header className="border-b border-line bg-parchment/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href={backHref}
            className="shrink-0 font-utility text-xs text-ink-soft transition-colors hover:text-engraving-deep"
          >
            ← {bookTitle}
          </Link>
          <span aria-hidden className="h-4 w-px shrink-0 bg-line-strong" />
          <label className="sr-only" htmlFor="mm-title">
            Map title
          </label>
          <input
            id="mm-title"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="min-w-0 flex-1 rounded-radius-sm border border-transparent bg-transparent px-1.5 py-1 font-editorial text-lg font-semibold text-ink outline-none transition-colors hover:border-line focus:border-engraving"
          />
          <MindMapSaveIndicator status={saveStatus} className="shrink-0" />
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="mm-map-select">
            Switch map
          </label>
          <Select
            id="mm-map-select"
            value={activeMapId}
            onChange={(event) => onSelectMap(event.target.value)}
            className="h-8 w-40 text-xs"
          >
            {maps.map((map) => (
              <option key={map.id} value={map.id}>
                {map.title}
              </option>
            ))}
          </Select>
          <ToolButton onClick={onNewMap} title="Create a new map">
            New
          </ToolButton>
          <ToolButton onClick={onDuplicateMap} title="Duplicate this map">
            Duplicate
          </ToolButton>
          <ToolButton
            onClick={onDeleteMap}
            title="Delete this map"
            className="hover:border-danger hover:text-danger"
          >
            Delete
          </ToolButton>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto border-t border-line/70 px-3 py-2">
        <ToolButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">
          ↺ Undo
        </ToolButton>
        <ToolButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl/Cmd+Shift+Z)">
          ↻ Redo
        </ToolButton>
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line-strong" />
        <ToolButton onClick={() => onAddNode("concept")} title="Add a concept node">
          ＋ Node
        </ToolButton>
        <ToolButton onClick={onOrganize} title="Arrange nodes automatically">
          Organize
        </ToolButton>
        <ToolButton onClick={onDeleteSelection} title="Delete selected (Delete)">
          Delete sel.
        </ToolButton>
        <ToolButton onClick={onSelectAll} title="Select all (Ctrl/Cmd+A)">
          Select all
        </ToolButton>
        <ToolButton onClick={onFitView} title="Fit map to view">
          Fit
        </ToolButton>
        <ToolButton onClick={onZoomOut} title="Zoom out">
          −
        </ToolButton>
        <ToolButton onClick={onZoomIn} title="Zoom in">
          +
        </ToolButton>
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-line-strong" />
        <ToolButton onClick={onExport} title="Export">
          Export
        </ToolButton>
        <ToolButton onClick={onImport} title="Import a map file">
          Import
        </ToolButton>
        <span aria-hidden className="mx-1 hidden h-4 w-px shrink-0 bg-line-strong sm:inline-block" />
        <ToolButton onClick={onToggleNodes} title="Toggle node palette" className="lg:hidden">
          Nodes
        </ToolButton>
        <ToolButton onClick={onToggleInspector} title="Toggle style panel" className="lg:hidden">
          Style
        </ToolButton>
      </div>
    </header>
  );
}
