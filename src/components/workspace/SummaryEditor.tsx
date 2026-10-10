"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import type { RichTextDoc } from "@/lib/types/library";
import { library } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { Button } from "@/components/ui/Button";
import { SummaryToolbar } from "./SummaryToolbar";
import { HighlightToneMark, TextTone } from "./editor/marks";

const EMPTY_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

type SaveState = "saved" | "unsaved" | "saving";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export interface SummaryEditorProps {
  bookId: string;
  initialContent: RichTextDoc | null;
  initialUpdatedAt: string | null;
}

/**
 * Rich-text summary editor (Tiptap). Stores a structured document, never raw
 * HTML. Autosaves on a short debounce and always flushes on unmount, so typed
 * text is never silently lost.
 */
export function SummaryEditor({
  bookId,
  initialContent,
  initialUpdatedAt,
}: SummaryEditorProps) {
  const [state, setState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<string | null>(initialUpdatedAt);
  const timer = useRef<number | null>(null);
  const persistRef = useRef<() => void>(() => {});

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, HighlightToneMark, TextTone],
    content: initialContent ?? EMPTY_DOC,
    editorProps: {
      attributes: {
        id: "summary-editor",
        class: "editor-content min-h-56 px-4 py-3",
        "aria-label": "Personal summary",
        spellcheck: "true",
      },
    },
    onUpdate: () => {
      setState("unsaved");
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => persistRef.current(), 1200);
    },
  });

  const persist = useCallback(() => {
    if (!editor) return;
    setState("saving");
    const content = editor.getJSON() as RichTextDoc;
    const plainText = editor.getText({ blockSeparator: "\n" });
    const saved = library.saveSummary(bookId, content, plainText);
    setSavedAt(saved?.updatedAt ?? null);
    setState("saved");
  }, [editor, bookId]);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        persistRef.current();
      }
    };
  }, []);

  const statusText =
    state === "saving"
      ? "Saving…"
      : state === "unsaved"
        ? "Unsaved changes"
        : savedAt
          ? `Saved · ${formatTime(savedAt)}`
          : "No summary yet";

  return (
    <div className="rounded-radius-md border border-line bg-surface shadow-card">
      <div className="px-2 pt-2">
        <SummaryToolbar editor={editor} />
      </div>
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        <span
          className="font-utility text-[11px] uppercase tracking-[0.14em] text-ink-faint"
          aria-live="polite"
        >
          {statusText}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              persistRef.current();
              SoundManager.playSave();
            }}
          >
            Save now
          </Button>
        </div>
      </div>
    </div>
  );
}
