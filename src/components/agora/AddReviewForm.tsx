"use client";

import { useMemo, useState } from "react";
import type { Book } from "@/lib/types/book";
import { library } from "@/lib/services/library";
import { REVIEW_PROMPT_MAX, REVIEW_ANSWER_MAX } from "@/lib/services/review";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { notify } from "@/components/ui/feedback";

export interface AddReviewFormProps {
  books: Book[];
}

/**
 * AddReviewForm — queue a review by hand: choose a book, pose your own prompt,
 * save the material you want to be shown on reveal. A quiet escape hatch for
 * ideas that are not yet a note or a quotation.
 */
export function AddReviewForm({ books }: AddReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [bookId, setBookId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");

  const options = useMemo(
    () => [...books].sort((a, b) => a.title.localeCompare(b.title)),
    [books],
  );

  const canSubmit =
    bookId.length > 0 && prompt.trim().length > 0 && answer.trim().length > 0;

  function submit(): void {
    if (!canSubmit) return;
    const created = library.createReview({
      bookId,
      sourceType: "note",
      sourceId: null,
      prompt,
      answer,
    });
    if (!created) {
      notify("Could not queue that item.", "error");
      return;
    }
    SoundManager.playCreate();
    notify("Added to your review queue.");
    setPrompt("");
    setAnswer("");
    setOpen(false);
  }

  if (books.length === 0) return null;

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Add your own
      </Button>
    );
  }

  return (
    <form
      className="rounded-radius-lg border border-line bg-surface p-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="flex flex-col gap-4">
        <Field label="Book" htmlFor="agora-add-book">
          <Select
            id="agora-add-book"
            value={bookId}
            onChange={(event) => setBookId(event.target.value)}
          >
            <option value="">Choose a book…</option>
            {options.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
                {book.author ? ` — ${book.author}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prompt" htmlFor="agora-add-prompt">
          <Input
            id="agora-add-prompt"
            maxLength={REVIEW_PROMPT_MAX}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="What do you want to be asked?"
          />
        </Field>
        <Field label="Saved material" htmlFor="agora-add-answer">
          <Textarea
            id="agora-add-answer"
            rows={4}
            maxLength={REVIEW_ANSWER_MAX}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="What should appear when you reveal it?"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setPrompt("");
              setAnswer("");
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            Queue for review
          </Button>
        </div>
      </div>
    </form>
  );
}
