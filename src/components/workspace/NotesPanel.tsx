"use client";

import { useState } from "react";
import type { Note } from "@/lib/types/library";
import { library } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { notify } from "@/components/ui/feedback";

interface Draft {
  title: string;
  body: string;
  tags: string;
}

const EMPTY: Draft = { title: "", body: "", tags: "" };

export interface NotesPanelProps {
  bookId: string;
  notes: Note[];
}

/** Notes: free-form reader notes with optional titles and tags. */
export function NotesPanel({ bookId, notes }: NotesPanelProps) {
  const [mode, setMode] = useState<"idle" | "new" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setDraft(EMPTY);
    setEditingId(null);
    setError(null);
    setMode("new");
  }

  function startEdit(note: Note) {
    setDraft({
      title: note.title ?? "",
      body: note.body,
      tags: note.tags.join(", "),
    });
    setEditingId(note.id);
    setError(null);
    setMode("edit");
  }

  function cancel() {
    setMode("idle");
    setEditingId(null);
    setDraft(EMPTY);
    setError(null);
  }

  function save() {
    if (!draft.body.trim()) {
      setError("A note needs some text.");
      return;
    }
    const payload = {
      title: draft.title.trim() || null,
      body: draft.body.trim(),
      tags: draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    if (mode === "edit" && editingId) {
      library.updateNote(editingId, payload);
      SoundManager.playSave();
      notify("Note updated.");
    } else {
      library.createNote(bookId, payload);
      SoundManager.playCreate();
      notify("Note added.");
    }
    cancel();
  }

  return (
    <div className="grid gap-5">
      {mode === "idle" ? (
        <div>
          <button
            type="button"
            onClick={startNew}
            className="btn-press rounded-radius-sm border border-line-strong bg-surface px-4 py-2 font-utility text-sm text-ink transition-colors hover:border-engraving hover:text-engraving-deep"
          >
            + New note
          </button>
        </div>
      ) : (
        <div className="grid gap-3 rounded-radius-md border border-line bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-1.5">
              <label
                htmlFor="note-title"
                className="font-utility text-sm font-medium text-ink"
              >
                Title <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                id="note-title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="A short heading"
                className="w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <label
              htmlFor="note-body"
              className="font-utility text-sm font-medium text-ink"
            >
              Note
            </label>
            <textarea
              id="note-body"
              value={draft.body}
              aria-invalid={Boolean(error)}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, body: event.target.value }))
              }
              rows={5}
              placeholder="What stood out?"
              className="min-h-24 w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm leading-relaxed text-ink focus:border-engraving focus:outline-none"
            />
            {error ? (
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <label
              htmlFor="note-tags"
              className="font-utility text-sm font-medium text-ink"
            >
              Tags <span className="text-ink-faint">(comma-separated)</span>
            </label>
            <input
              id="note-tags"
              value={draft.tags}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, tags: event.target.value }))
              }
              placeholder="argument, ethics"
              className="w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              className="rounded-radius-sm px-3 py-1.5 font-utility text-sm text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="btn-press rounded-radius-sm bg-engraving px-4 py-1.5 font-utility text-sm font-medium text-surface hover:bg-engraving-deep"
            >
              {mode === "edit" ? "Save changes" : "Add note"}
            </button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="rounded-radius-md border border-dashed border-line-strong bg-parchment-shade/25 p-6 text-center text-sm text-ink-soft">
          No notes yet. Capture a thought as you read.
        </p>
      ) : (
        <ul className="grid gap-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-radius-md border border-line bg-surface p-4"
            >
              {note.title ? (
                <h3 className="font-display text-lg font-semibold text-ink">
                  {note.title}
                </h3>
              ) : null}
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                {note.body}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5">
                <span className="font-utility text-[11px] text-ink-faint">
                  {note.tags.length > 0 ? note.tags.join(" · ") : "No tags"}
                </span>
                <span className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(note)}
                    className="font-utility text-xs text-ink-soft underline decoration-line-strong underline-offset-2 hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      library.deleteNote(note.id);
                      SoundManager.playDelete();
                      notify("Note deleted.");
                    }}
                    className="font-utility text-xs text-danger underline decoration-line-strong underline-offset-2 hover:text-danger"
                  >
                    Delete
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
