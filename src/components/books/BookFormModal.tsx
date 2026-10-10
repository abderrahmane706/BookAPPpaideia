"use client";

import { useId, useState } from "react";
import type {
  Book,
  ReadingProgress,
  ReadingStatus,
  StarRating,
} from "@/lib/types/book";
import { BOOK_CATEGORIES } from "@/lib/constants";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { notify } from "@/components/ui/feedback";
import { library } from "@/lib/services/library";
import { processCoverFile } from "@/lib/services/library/cover";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { StarRatingInput } from "./StarRatingInput";

const PROGRESS_LABELS: Record<number, string> = {
  0: "Not started",
  25: "A quarter",
  50: "Halfway",
  75: "Three-quarters",
  100: "Finished",
};

interface FormState {
  title: string;
  author: string;
  category: string;
  coverUrl: string | null;
  description: string;
  pageCount: string;
  publisher: string;
  publishedYear: string;
  language: string;
  isbn: string;
  tags: string;
  status: ReadingStatus;
  progress: ReadingProgress;
  rating: StarRating | null;
  currentPage: string;
}

function initialForm(book: Book | null): FormState {
  return {
    title: book?.title ?? "",
    author: book?.author ?? "",
    category: book?.category ?? "",
    coverUrl: book?.coverUrl ?? null,
    description: book?.description ?? "",
    pageCount: book?.pageCount ? String(book.pageCount) : "",
    publisher: book?.publisher ?? "",
    publishedYear: book?.publishedYear ? String(book.publishedYear) : "",
    language: book?.language ?? "",
    isbn: book?.isbn ?? "",
    tags: book?.tags.join(", ") ?? "",
    status: book?.status ?? "want_to_read",
    progress: book?.progress ?? 0,
    rating: book?.rating ?? null,
    currentPage:
      book?.currentPage !== null && book?.currentPage !== undefined
        ? String(book.currentPage)
        : "",
  };
}

export interface BookFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the modal edits this book instead of creating a new one. */
  book?: Book | null;
  onSaved?: (book: Book) => void;
}

const COVER_ACCEPT = "image/png,image/jpeg,image/webp,image/avif";

/**
 * Create / edit a book. Title and author are the only required fields — all
 * bibliographic metadata is optional, and covers are validated + downscaled on
 * the client before being stored.
 */
export function BookFormModal({
  open,
  onClose,
  book = null,
  onSaved,
}: BookFormModalProps) {
  const editing = Boolean(book);
  const baseId = useId();
  const [form, setForm] = useState<FormState>(() => initialForm(book));
  const [errors, setErrors] = useState<{ title?: string; author?: string }>({});
  const [coverError, setCoverError] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    setCoverError(null);
    setCoverBusy(true);
    const result = await processCoverFile(file);
    setCoverBusy(false);
    if (result.ok) {
      update("coverUrl", result.dataUrl);
      SoundManager.playCreate();
    } else {
      setCoverError(result.reason);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: { title?: string; author?: string } = {};
    if (!form.title.trim()) nextErrors.title = "A title is required.";
    if (!form.author.trim()) nextErrors.author = "An author is required.";
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.author) return;

    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category,
        coverUrl: form.coverUrl,
        description: form.description,
        pageCount: form.pageCount ? Number(form.pageCount) : null,
        publisher: form.publisher,
        publishedYear: form.publishedYear ? Number(form.publishedYear) : null,
        language: form.language,
        isbn: form.isbn,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        status: form.status as ReadingStatus,
        progress: form.progress,
        rating: form.rating,
        currentPage: form.currentPage ? Number(form.currentPage) : null,
      };
      const saved =
        editing && book
          ? library.updateBook(book.id, payload)
          : library.createBook(payload);
      if (!saved) throw new Error("save failed");
      SoundManager.playSave();
      notify(
        editing
          ? `“${saved.title}” updated.`
          : `“${saved.title}” added to your library.`,
      );
      onSaved?.(saved);
      onClose();
    } catch {
      notify("That book could not be saved. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit book" : "Add a book"}
      className="max-w-2xl"
    >
      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid gap-4">
            {/* Cover */}
            <div className="flex items-start gap-4">
              <div className="h-32 w-24 shrink-0 overflow-hidden rounded-radius-sm border border-line bg-parchment-shade">
                {form.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.coverUrl}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center font-display text-2xl text-engraving-deep/40">
                    {form.title.trim().slice(0, 1).toUpperCase() || "▮"}
                  </span>
                )}
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor={`${baseId}-cover`}
                  className="font-utility text-sm font-medium text-ink"
                >
                  Cover image
                </label>
                <input
                  id={`${baseId}-cover`}
                  type="file"
                  accept={COVER_ACCEPT}
                  onChange={(event) => {
                    handleFile(event.target.files?.[0] ?? null);
                    event.target.value = "";
                  }}
                  className="block w-full text-xs font-utility text-ink-soft file:mr-3 file:cursor-pointer file:rounded-radius-sm file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:font-utility file:text-xs file:text-ink hover:file:border-engraving"
                />
                <p className="text-xs text-ink-faint">
                  PNG, JPEG, WebP or AVIF · up to 5 MB. Kept on this device.
                </p>
                {form.coverUrl ? (
                  <button
                    type="button"
                    onClick={() => update("coverUrl", null)}
                    className="w-fit font-utility text-xs text-ink-soft underline decoration-line-strong underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving"
                  >
                    Remove cover
                  </button>
                ) : null}
                {coverBusy ? (
                  <p className="text-xs text-ink-faint">Processing image…</p>
                ) : null}
                {coverError ? (
                  <p role="alert" className="text-xs text-danger">
                    {coverError}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Required */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Title"
                htmlFor={`${baseId}-title`}
                required
                error={errors.title}
              >
                <Input
                  id={`${baseId}-title`}
                  value={form.title}
                  invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? `${baseId}-title-error` : undefined
                  }
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="e.g. The Republic"
                />
              </Field>
              <Field
                label="Author"
                htmlFor={`${baseId}-author`}
                required
                error={errors.author}
              >
                <Input
                  id={`${baseId}-author`}
                  value={form.author}
                  invalid={Boolean(errors.author)}
                  aria-describedby={
                    errors.author ? `${baseId}-author-error` : undefined
                  }
                  onChange={(event) => update("author", event.target.value)}
                  placeholder="e.g. Plato"
                />
              </Field>
            </div>

            {/* Classification */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" htmlFor={`${baseId}-category`}>
                <Select
                  id={`${baseId}-category`}
                  value={form.category}
                  onChange={(event) => update("category", event.target.value)}
                >
                  <option value="">— None —</option>
                  {BOOK_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Tags"
                htmlFor={`${baseId}-tags`}
                hint="Comma-separated, optional."
              >
                <Input
                  id={`${baseId}-tags`}
                  value={form.tags}
                  onChange={(event) => update("tags", event.target.value)}
                  placeholder="ethics, antiquity"
                />
              </Field>
            </div>

            {/* Reading state */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" htmlFor={`${baseId}-status`}>
                <Select
                  id={`${baseId}-status`}
                  value={form.status}
                  onChange={(event) =>
                    update("status", event.target.value as ReadingStatus)
                  }
                >
                  <option value="want_to_read">Want to Read</option>
                  <option value="reading">Currently Reading</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </Select>
              </Field>
              <Field
                label="Progress"
                htmlFor={`${baseId}-progress`}
                hint="Milestones are the canonical measure."
              >
                <Select
                  id={`${baseId}-progress`}
                  value={String(form.progress)}
                  disabled={form.status === "want_to_read"}
                  onChange={(event) =>
                    update(
                      "progress",
                      Number(event.target.value) as ReadingProgress,
                    )
                  }
                >
                  {[0, 25, 50, 75, 100].map((milestone) => (
                    <option key={milestone} value={milestone}>
                      {milestone}% · {PROGRESS_LABELS[milestone]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Pages"
                htmlFor={`${baseId}-pages`}
                hint="Total pages, optional."
              >
                <Input
                  id={`${baseId}-pages`}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={form.pageCount}
                  onChange={(event) => update("pageCount", event.target.value)}
                  placeholder="e.g. 416"
                />
              </Field>
              <Field
                label="Current page"
                htmlFor={`${baseId}-current`}
                hint="Optional; used to refine progress."
              >
                <Input
                  id={`${baseId}-current`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.currentPage}
                  onChange={(event) => update("currentPage", event.target.value)}
                  placeholder="e.g. 120"
                />
              </Field>
            </div>

            {/* Bibliographic */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Publisher" htmlFor={`${baseId}-publisher`}>
                <Input
                  id={`${baseId}-publisher`}
                  value={form.publisher}
                  onChange={(event) => update("publisher", event.target.value)}
                />
              </Field>
              <Field label="Published year" htmlFor={`${baseId}-year`}>
                <Input
                  id={`${baseId}-year`}
                  type="number"
                  min={1}
                  max={3000}
                  inputMode="numeric"
                  value={form.publishedYear}
                  onChange={(event) =>
                    update("publishedYear", event.target.value)
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Language" htmlFor={`${baseId}-language`}>
                <Input
                  id={`${baseId}-language`}
                  value={form.language}
                  onChange={(event) => update("language", event.target.value)}
                  placeholder="e.g. English"
                />
              </Field>
              <Field label="ISBN" htmlFor={`${baseId}-isbn`}>
                <Input
                  id={`${baseId}-isbn`}
                  value={form.isbn}
                  onChange={(event) => update("isbn", event.target.value)}
                />
              </Field>
            </div>

            <Field label="Description" htmlFor={`${baseId}-description`}>
              <Textarea
                id={`${baseId}-description`}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="A short note about this volume…"
              />
            </Field>

            <div className="grid gap-1.5">
              <span className="font-utility text-sm font-medium text-ink">
                Personal rating
              </span>
              <StarRatingInput
                rating={form.rating}
                onChange={(rating) => update("rating", rating)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-radius-sm border border-transparent px-4 py-2 font-utility text-sm text-ink-soft transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || coverBusy}
            className="inline-flex select-none items-center justify-center rounded-radius-sm bg-engraving px-4 py-2 font-utility text-sm font-medium text-surface shadow-card transition-colors btn-press hover:bg-engraving-deep disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving"
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Add to library"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
