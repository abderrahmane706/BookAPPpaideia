"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Book } from "@/lib/types/book";
import type { ReviewItem } from "@/lib/types/review";
import { reviewSourceHref, sourceLabel } from "@/lib/services/review";
import { library } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { notify } from "@/components/ui/feedback";

const POSTPONE_DAYS = 3;

function dueLabel(item: ReviewItem, now: Date): string {
  if (item.reviewState === "suspended") return "Suspended";
  const diff = Date.parse(item.nextReviewAt) - now.getTime();
  if (diff <= 0) return "Due now";
  const days = Math.ceil(diff / 86_400_000);
  if (days <= 1) return "Due within a day";
  return `Due in ${days} days`;
}

export interface ReviewQueueListProps {
  items: ReviewItem[];
  booksById: Map<string, Book>;
}

/**
 * ReviewQueueList — the reader's whole review queue, grouped by book. Every row
 * can be opened at its source, edited, postponed, suspended or removed. Nothing
 * here is scored or ranked: the queue is a shelf of the reader's own material.
 */
export function ReviewQueueList({ items, booksById }: ReviewQueueListProps) {
  const [editing, setEditing] = useState<ReviewItem | null>(null);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [confirming, setConfirming] = useState<ReviewItem | null>(null);

  const now = useMemo(() => new Date(), []);

  const grouped = useMemo(() => {
    const map = new Map<string, ReviewItem[]>();
    for (const item of items) {
      const list = map.get(item.bookId) ?? [];
      list.push(item);
      map.set(item.bookId, list);
    }
    return Array.from(map.entries());
  }, [items]);

  function openEdit(item: ReviewItem): void {
    setEditing(item);
    setDraftPrompt(item.prompt);
    setDraftAnswer(item.answer);
  }

  function saveEdit(): void {
    if (!editing) return;
    const updated = library.updateReview(editing.id, {
      prompt: draftPrompt,
      answer: draftAnswer,
    });
    if (!updated) {
      notify("A prompt and an answer are both required.", "error");
      return;
    }
    SoundManager.playSave();
    notify("Review item updated.");
    setEditing(null);
  }

  function postpone(item: ReviewItem): void {
    library.postponeReview(item.id, POSTPONE_DAYS);
    SoundManager.playToggle();
    notify(`Postponed for ${POSTPONE_DAYS} days.`);
  }

  function toggleSuspend(item: ReviewItem): void {
    const suspended = item.reviewState !== "suspended";
    library.suspendReview(item.id, suspended);
    SoundManager.playToggle();
    notify(suspended ? "Removed from the queue." : "Returned to the queue.");
  }

  function remove(item: ReviewItem): void {
    library.deleteReview(item.id);
    SoundManager.playDelete();
    notify("Review item removed.");
    setConfirming(null);
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      {grouped.map(([bookId, group]) => {
        const book = booksById.get(bookId) ?? null;
        return (
          <section key={bookId}>
            <header className="mb-3 flex items-baseline justify-between gap-4 border-b border-line pb-2">
              <Link
                href={`/library/${bookId}`}
                className="font-editorial text-lg font-semibold tracking-tight text-ink transition-colors hover:text-engraving-deep"
              >
                {book?.title ?? "Untitled book"}
              </Link>
              <span className="font-utility text-xs uppercase tracking-[0.12em] text-ink-faint">
                {group.length} queued
              </span>
            </header>

            <ul className="flex flex-col divide-y divide-line">
              {group.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-utility text-[0.65rem] uppercase tracking-[0.12em] text-engraving">
                          {sourceLabel(item)}
                        </span>
                        <span aria-hidden className="text-ink-faint">
                          ·
                        </span>
                        <span className="font-utility text-[0.65rem] uppercase tracking-[0.12em] text-ink-faint">
                          {dueLabel(item, now)}
                        </span>
                      </div>
                      <p className="font-body text-sm font-medium text-ink">
                        {item.prompt}
                      </p>
                      <p className="mt-1 line-clamp-2 font-body text-sm leading-relaxed text-ink-soft">
                        {item.answer}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Link
                        href={reviewSourceHref(item)}
                        className="inline-flex h-8 items-center rounded-radius-sm px-3 font-utility text-xs text-ink-soft transition-colors hover:bg-engraving/5 hover:text-engraving-deep"
                      >
                        Open source
                      </Link>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => postpone(item)}
                      >
                        Postpone
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => toggleSuspend(item)}
                      >
                        {item.reviewState === "suspended" ? "Resume" : "Suspend"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-danger hover:text-danger"
                        onClick={() => setConfirming(item)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit review item"
        className="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <Field label="Prompt" htmlFor="review-prompt" hint="What you ask yourself.">
            <Input
              id="review-prompt"
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
            />
          </Field>
          <Field
            label="Saved material"
            htmlFor="review-answer"
            hint="What is revealed after you recall."
          >
            <Textarea
              id="review-answer"
              rows={6}
              value={draftAnswer}
              onChange={(event) => setDraftAnswer(event.target.value)}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirming !== null}
        title="Remove this review item?"
        description="The item leaves your queue. Your original note or quotation is untouched."
        confirmLabel="Remove"
        destructive
        onConfirm={() => {
          if (confirming) remove(confirming);
        }}
        onClose={() => setConfirming(null)}
      />
    </div>
  );
}
