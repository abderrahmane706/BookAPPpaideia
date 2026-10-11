"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog, EmptyState, notify } from "@/components/ui";
import { useBook, useLibraryReady } from "@/lib/services/library";
import { mindMapService, useMindMaps } from "@/lib/services/mindmap";
import { MindMapEditor } from "./MindMapEditor";
import { MindMapTemplatePicker } from "./MindMapTemplatePicker";

export interface MindMapScreenProps {
  bookId: string;
  initialMapId?: string;
}

/** Route-level container: resolves the active map and map-level actions. */
export function MindMapScreen({ bookId, initialMapId }: MindMapScreenProps) {
  const router = useRouter();
  const ready = useLibraryReady();
  const book = useBook(bookId);
  const maps = useMindMaps(bookId);
  const [activeId, setActiveId] = useState<string | null>(initialMapId ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const active = maps.find((m) => m.id === activeId) ?? maps[0] ?? null;

  const select = (id: string) => {
    setActiveId(id);
    router.replace(`/library/${bookId}/mind-map?map=${id}`, { scroll: false });
  };

  const create = (templateId: string) => {
    const map = mindMapService.create(bookId, { templateId });
    setPickerOpen(false);
    if (!map) {
      notify("Could not create the map.", "error");
      return;
    }
    select(map.id);
  };

  const duplicate = () => {
    if (!active) return;
    const copy = mindMapService.duplicate(active.id);
    if (copy) {
      notify("Map duplicated.");
      select(copy.id);
    }
  };

  const remove = () => {
    if (!active) return;
    mindMapService.remove(active.id);
    notify("Map deleted.");
    setDeleting(false);
    const remaining = maps.filter((m) => m.id !== active.id);
    const next = remaining[0];
    setActiveId(next?.id ?? null);
    router.replace(
      next
        ? `/library/${bookId}/mind-map?map=${next.id}`
        : `/library/${bookId}/mind-map`,
      { scroll: false },
    );
  };

  if (!ready) {
    return (
      <div className="h-[calc(100dvh-6.5rem)] min-h-[34rem] animate-pulse rounded-radius-lg border border-line bg-ink/5" />
    );
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="font-display heading-chapter text-ink">Book not found</h1>
        <Link
          href="/library"
          className="mt-6 inline-block font-utility text-sm text-engraving-deep underline decoration-line-strong underline-offset-4"
        >
          ← Back to your library
        </Link>
      </div>
    );
  }

  if (!active) {
    return (
      <>
        <EmptyState
          title="No mind map yet"
          description="Turn this book's ideas into a working map you can rearrange, connect and refine."
          glyph={<span className="font-display text-3xl">◆</span>}
          action={
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setPickerOpen(true)}>
                Create a mind map
              </Button>
              <Link
                href={`/library/${bookId}`}
                className="inline-flex h-8.5 items-center rounded-radius-sm border border-line-strong bg-surface px-3.5 font-utility text-sm text-ink-soft transition-colors hover:border-engraving hover:text-engraving-deep"
              >
                Back to book
              </Link>
            </div>
          }
        />
        <MindMapTemplatePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={create}
        />
      </>
    );
  }

  return (
    <>
      <MindMapEditor
        key={active.id}
        map={active}
        bookTitle={book.title}
        backHref={`/library/${bookId}`}
        maps={maps.map((m) => ({ id: m.id, title: m.title }))}
        onSelectMap={select}
        onNewMap={() => setPickerOpen(true)}
        onDuplicateMap={duplicate}
        onDeleteMap={() => setDeleting(true)}
      />

      <MindMapTemplatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={create}
      />

      <ConfirmDialog
        open={deleting}
        title="Delete this mind map?"
        description="This permanently removes the map and all of its nodes. This cannot be undone."
        confirmLabel="Delete map"
        destructive
        onClose={() => setDeleting(false)}
        onConfirm={remove}
      />
    </>
  );
}
