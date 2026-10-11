"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  notify,
} from "@/components/ui";
import {
  mindMapService,
  useMindMapReady,
  useMindMaps,
} from "@/lib/services/mindmap";
import { MindMapTemplatePicker } from "./MindMapTemplatePicker";

export interface MindMapPanelProps {
  bookId: string;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Mind-map section embedded in the book workspace: list, create, open. */
export function MindMapPanel({ bookId }: MindMapPanelProps) {
  const router = useRouter();
  const ready = useMindMapReady();
  const maps = useMindMaps(bookId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const create = (templateId: string) => {
    const map = mindMapService.create(bookId, { templateId });
    setPickerOpen(false);
    if (!map) {
      notify("Could not create the map.", "error");
      return;
    }
    router.push(`/library/${bookId}/mind-map?map=${map.id}`);
  };

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setPickerOpen(true)}>
          New mind map
        </Button>
      </div>

      {!ready ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-24 rounded-radius-lg bg-ink/5" />
          <div className="h-24 rounded-radius-lg bg-ink/5" />
        </div>
      ) : maps.length === 0 ? (
        <EmptyState
          title="No mind maps yet"
          description="Map a book's ideas, arguments or its structure — nodes you can rearrange and connect."
          glyph={<span className="font-display text-3xl">◆</span>}
          action={
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              Create your first map
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {maps.map((map) => (
            <li key={map.id}>
              <Card variant="inset" className="flex h-full flex-col">
                <Link
                  href={`/library/${bookId}/mind-map?map=${map.id}`}
                  className="font-editorial text-lg font-semibold text-ink hover:text-engraving-deep"
                >
                  {map.title}
                </Link>
                <p className="mt-1 font-utility text-xs text-ink-faint">
                  {map.nodes.length} {map.nodes.length === 1 ? "node" : "nodes"} ·{" "}
                  {map.edges.length} {map.edges.length === 1 ? "link" : "links"} ·
                  updated {formatWhen(map.updatedAt)}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/library/${bookId}/mind-map?map=${map.id}`}
                    className="inline-flex h-7 items-center rounded-radius-sm border border-line-strong bg-surface px-2.5 font-utility text-xs text-ink-soft transition-colors hover:border-engraving hover:text-engraving-deep"
                  >
                    Open
                  </Link>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      const copy = mindMapService.duplicate(map.id);
                      if (copy) notify("Map duplicated.");
                    }}
                  >
                    Duplicate
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    className="ml-auto hover:text-danger"
                    onClick={() => setDeleting(map.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <MindMapTemplatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={create}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this mind map?"
        description="This permanently removes the map and all of its nodes. This cannot be undone."
        confirmLabel="Delete map"
        destructive
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            mindMapService.remove(deleting);
            notify("Map deleted.");
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
