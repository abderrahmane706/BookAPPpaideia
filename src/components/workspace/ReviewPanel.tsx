"use client";

import { useState } from "react";
import type { Book, StarRating } from "@/lib/types/book";
import { library } from "@/lib/services/library";
import { queueReflection } from "@/lib/services/review";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { StarRatingInput } from "@/components/books/StarRatingInput";
import { notify } from "@/components/ui/feedback";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { QueueForReviewButton } from "@/components/agora";

const PROMPTS: Array<{
  key: "personalReview" | "keyTakeaway" | "mostImportantIdea" | "personalApplication";
  source:
    | "personal_review"
    | "key_takeaway"
    | "most_important_idea"
    | "personal_application";
  label: string;
  hint: string;
}> = [
  {
    key: "personalReview",
    source: "personal_review",
    label: "Personal review",
    hint: "What did this book teach you?",
  },
  {
    key: "keyTakeaway",
    source: "key_takeaway",
    label: "Key takeaway",
    hint: "The lesson you would carry forward.",
  },
  {
    key: "mostImportantIdea",
    source: "most_important_idea",
    label: "Most important idea",
    hint: "The argument in a sentence, in your own words.",
  },
  {
    key: "personalApplication",
    source: "personal_application",
    label: "Personal application",
    hint: "Where this reading meets your life.",
  },
];

export interface ReviewPanelProps {
  book: Book;
}

/** Personal review & reflection: four prompts plus the star rating. */
export function ReviewPanel({ book }: ReviewPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({
    personalReview: book.personalReview ?? "",
    keyTakeaway: book.keyTakeaway ?? "",
    mostImportantIdea: book.mostImportantIdea ?? "",
    personalApplication: book.personalApplication ?? "",
  });
  const [dirty, setDirty] = useState(false);

  function update(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function saveAll() {
    library.updateBook(book.id, {
      personalReview: values.personalReview,
      keyTakeaway: values.keyTakeaway,
      mostImportantIdea: values.mostImportantIdea,
      personalApplication: values.personalApplication,
    });
    setDirty(false);
    SoundManager.playSave();
    notify("Reflection saved.");
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-radius-md border border-line bg-surface p-5">
        <span className="font-utility text-sm font-medium text-ink">
          Personal rating
        </span>
        <div className="mt-2">
          <StarRatingInput
            rating={book.rating}
            onChange={(rating: StarRating | null) => {
              library.setRating(book.id, rating);
              SoundManager.playToggle();
            }}
          />
        </div>
      </div>

      <ul className="grid gap-4">
        {PROMPTS.map((prompt) => (
          <li key={prompt.key} className="grid gap-1.5">
            <label
              htmlFor={`review-${prompt.key}`}
              className="font-display text-lg font-semibold text-ink"
            >
              {prompt.label}
            </label>
            <p className="text-xs text-ink-faint">{prompt.hint}</p>
            <Textarea
              id={`review-${prompt.key}`}
              value={values[prompt.key] ?? ""}
              onChange={(event) => update(prompt.key, event.target.value)}
              className="mt-1"
            />
            {(book[prompt.key] ?? "").trim().length > 0 ? (
              <div className="mt-1.5 flex justify-end">
                <QueueForReviewButton
                  sourceType={prompt.source}
                  sourceId={book.id}
                  onQueue={() => queueReflection(book, prompt.source)}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end gap-3">
        <span className="font-utility text-xs text-ink-faint" aria-live="polite">
          {dirty ? "Unsaved changes" : "All changes saved"}
        </span>
        <Button variant="secondary" onClick={saveAll} disabled={!dirty}>
          Save reflection
        </Button>
      </div>
    </div>
  );
}
