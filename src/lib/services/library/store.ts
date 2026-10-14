import {
  milestoneFromPage,
  READING_MILESTONES,
  type Book,
  type BookCreateInput,
  type BookUpdateInput,
  type ReadingProgress,
  type ReadingStatus,
  type StarRating,
} from "@/lib/types/book";
import type {
  Note,
  Quote,
  ReadingSession,
  ReadingTotals,
  RichTextDoc,
  Summary,
} from "@/lib/types/library";
import {
  REVIEW_INTERVAL_MAX_DAYS,
  type ReviewCreateInput,
  type ReviewFeedback,
  type ReviewItem,
} from "@/lib/types/review";
import { applyFeedback } from "@/lib/services/review/scheduler";
import {
  MIND_MAP_VERSION,
  type MindMap,
  type MindMapEdge,
  type MindMapNode,
} from "@/lib/types/mindmap";
import { createDefaultMap } from "@/lib/services/mindmap/defaults";
import { getTemplate } from "@/lib/services/mindmap/templates";
import { LIBRARY_STORAGE_KEY } from "./persistence";
import {
  EMPTY_SNAPSHOT,
  loadSnapshot,
  saveSnapshot,
  type LibrarySnapshot,
} from "./persistence";

/* -------------------------------------------------------------------------- */
/* Small, dependency-free helpers                                             */
/* -------------------------------------------------------------------------- */

function uid(prefix: string): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return `${prefix}-${c.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cleanText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validRating(value: unknown): StarRating | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded as StarRating;
}

function clampMilestone(value: unknown): ReadingProgress {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  const stepped = READING_MILESTONES.reduce((best, m) =>
    Math.abs(m - n) < Math.abs(best - n) ? m : best,
  );
  return stepped;
}

function positiveIntOrNull(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function nonNegativeIntOrNull(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/* -------------------------------------------------------------------------- */
/* Status ↔ progress reconciliation                                           */
/* -------------------------------------------------------------------------- */

/**
 * Reconcile status, milestone progress, page position and the reading timeline
 * into a single consistent record. Documented rules:
 *  - progress 100 ⇒ status "completed" and a completion date.
 *   - reopening a completed book (lowering progress) clears the completion date
 *    and returns the book to "reading".
 *  - "want_to_read" pins progress to 0 and clears reading dates.
 *  - "reading"/"paused" record a start date once, if absent.
 *  - when pageCount + progress are known, currentPage is derived as a
 *    supplement; when a currentPage is given, progress snaps to a milestone.
 *  - the canonical milestone model is always preserved.
 */
function reconcile(
  book: Book,
  patch: BookUpdateInput,
  at: string,
): Book {
  const pageCount =
    patch.pageCount !== undefined ? positiveIntOrNull(patch.pageCount) : book.pageCount;

  let progress: ReadingProgress =
    patch.progress !== undefined ? clampMilestone(patch.progress) : book.progress;
  let currentPage =
    patch.currentPage !== undefined
      ? patch.currentPage === null
        ? null
        : Math.max(0, Math.floor(Number(patch.currentPage)) || 0)
      : book.currentPage;

  // A page position, when pageCount is known, refines the milestone — unless an
  // explicit milestone was supplied in the same patch (which wins).
  if (
    patch.currentPage !== undefined &&
    patch.progress === undefined &&
    pageCount !== null
  ) {
    const derived = milestoneFromPage(currentPage ?? 0, pageCount);
    if (derived !== null) progress = derived;
  }

  // Status: explicit completed wins; otherwise progress governs completion.
  let status: ReadingStatus = patch.status ?? book.status;
  if (patch.status === "completed") {
    progress = 100;
  }
  if (progress >= 100) {
    status = "completed";
  } else if (status === "completed") {
    status = "reading"; // reopened
  }
  // Raising progress above zero means reading has begun, even if the caller did
  // not also change the status (e.g. the progress control in the workspace).
  if (patch.progress !== undefined && progress > 0 && status === "want_to_read") {
    status = "reading";
  }
  if (status === "want_to_read") {
    progress = 0;
    currentPage = pageCount !== null ? 0 : null;
  }

  // Timeline.
  let startedAt = patch.startedAt !== undefined ? patch.startedAt : book.startedAt;
  let completedAt =
    patch.completedAt !== undefined ? patch.completedAt : book.completedAt;
  if (status === "completed") {
    completedAt = completedAt ?? at;
    startedAt = startedAt ?? at;
  } else {
    completedAt = null;
    if (status === "reading" || status === "paused") {
      startedAt = startedAt ?? at;
    }
  }

  // Keep currentPage consistent with the milestone when pageCount is known.
  if (pageCount !== null) {
    if (progress >= 100) {
      currentPage = pageCount;
    } else if (patch.currentPage === undefined) {
      currentPage = Math.round((pageCount * progress) / 100);
    }
    if (currentPage !== null) {
      currentPage = Math.min(pageCount, Math.max(0, currentPage));
    }
  }

  return {
    ...book,
    ...patch,
    id: book.id,
    createdAt: book.createdAt,
    updatedAt: at,
    category: patch.category !== undefined ? patch.category.trim() : book.category,
    coverUrl: patch.coverUrl !== undefined ? patch.coverUrl : book.coverUrl,
    rating: patch.rating !== undefined ? validRating(patch.rating) : book.rating,
    description:
      patch.description !== undefined ? cleanText(patch.description) : book.description,
    isbn: patch.isbn !== undefined ? cleanText(patch.isbn) : book.isbn,
    pageCount,
    language: patch.language !== undefined ? cleanText(patch.language) : book.language,
    publisher: patch.publisher !== undefined ? cleanText(patch.publisher) : book.publisher,
    publishedYear:
      patch.publishedYear !== undefined
        ? positiveIntOrNull(patch.publishedYear)
        : book.publishedYear,
    source: patch.source !== undefined ? patch.source : book.source,
    tags: patch.tags !== undefined ? Array.from(new Set(patch.tags.map((t) => t.trim()).filter(Boolean))) : book.tags,
    status,
    progress,
    currentPage,
    startedAt,
    completedAt,
    personalReview:
      patch.personalReview !== undefined
        ? cleanText(patch.personalReview)
        : book.personalReview,
    keyTakeaway:
      patch.keyTakeaway !== undefined ? cleanText(patch.keyTakeaway) : book.keyTakeaway,
    mostImportantIdea:
      patch.mostImportantIdea !== undefined
        ? cleanText(patch.mostImportantIdea)
        : book.mostImportantIdea,
    personalApplication:
      patch.personalApplication !== undefined
        ? cleanText(patch.personalApplication)
        : book.personalApplication,
  };
}

/* -------------------------------------------------------------------------- */
/* The store — the single source of truth for the reader's library            */
/* -------------------------------------------------------------------------- */

class LibraryStore {
  private state: LibrarySnapshot = EMPTY_SNAPSHOT;
  private listeners = new Set<() => void>();
  private hydrated = false;

  constructor() {
    if (typeof window !== "undefined") this.hydrate();
  }

  private hydrate(): void {
    const loaded = loadSnapshot();
    this.state = loaded ?? EMPTY_SNAPSHOT;
    this.hydrated = true;
    this.emit();
  }

  /** Re-read from storage (used by cross-tab sync and tests). */
  reload(): void {
    this.hydrate();
  }

  private commit(next: LibrarySnapshot): void {
    this.state = next;
    saveSnapshot(next);
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  /* ----- external-store contract ----- */

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): LibrarySnapshot => this.state;

  getServerSnapshot = (): LibrarySnapshot => EMPTY_SNAPSHOT;

  isReady = (): boolean => this.hydrated;

  /* ----- books ----- */

  listBooks(): Book[] {
    return this.state.books;
  }

  getBook(id: string | null | undefined): Book | null {
    if (!id) return null;
    return this.state.books.find((b) => b.id === id) ?? null;
  }

  createBook(input: BookCreateInput): Book {
    const at = nowIso();
    const draft: Book = {
      id: uid("book"),
      title: input.title.trim(),
      author: input.author.trim(),
      category: (input.category ?? "").trim(),
      coverUrl: input.coverUrl ?? null,
      rating: validRating(input.rating),
      status: input.status ?? "want_to_read",
      progress: clampMilestone(input.progress ?? 0),
      description: cleanText(input.description),
      isbn: cleanText(input.isbn),
      pageCount: positiveIntOrNull(input.pageCount),
      language: cleanText(input.language),
      publisher: cleanText(input.publisher),
      publishedYear: positiveIntOrNull(input.publishedYear),
      source: input.source ?? "manual",
      currentPage:
        input.currentPage === undefined || input.currentPage === null
          ? null
          : Math.max(0, Math.floor(input.currentPage)),
      startedAt: null,
      completedAt: null,
      personalReview: null,
      keyTakeaway: null,
      mostImportantIdea: null,
      personalApplication: null,
      tags: input.tags ?? [],
      createdAt: at,
      updatedAt: at,
    };
    const reconciled = reconcile(
      draft,
      {
        status: input.status ?? "want_to_read",
        progress: input.progress,
        currentPage: input.currentPage,
      },
      at,
    );
    this.commit({ ...this.state, books: [reconciled, ...this.state.books] });
    return reconciled;
  }

  updateBook(id: string, patch: BookUpdateInput): Book | null {
    const existing = this.getBook(id);
    if (!existing) return null;
    const updated = reconcile(existing, patch, nowIso());
    this.commit({
      ...this.state,
      books: this.state.books.map((b) => (b.id === id ? updated : b)),
    });
    return updated;
  }

  setStatus(id: string, status: ReadingStatus): Book | null {
    return this.updateBook(id, { status });
  }

  setProgress(id: string, progress: ReadingProgress): Book | null {
    return this.updateBook(id, { progress });
  }

  setRating(id: string, rating: StarRating | null): Book | null {
    return this.updateBook(id, { rating: validRating(rating) });
  }

  setCurrentPage(id: string, page: number | null): Book | null {
    return this.updateBook(id, { currentPage: page });
  }

  /**
   * Delete a book and ALL of its dependent records in one atomic commit, so no
   * orphaned summary / note / quote / session can survive.
   */
  deleteBook(id: string): boolean {
    if (!this.getBook(id)) return false;
    const summaries = { ...this.state.summaries };
    delete summaries[id];
    this.commit({
      books: this.state.books.filter((b) => b.id !== id),
      summaries,
      notes: this.state.notes.filter((n) => n.bookId !== id),
      quotes: this.state.quotes.filter((q) => q.bookId !== id),
      sessions: this.state.sessions.filter((s) => s.bookId !== id),
      mindMaps: this.state.mindMaps.filter((m) => m.bookId !== id),
      reviews: this.state.reviews.filter((r) => r.bookId !== id),
    });
    return true;
  }

  /* ----- summary ----- */

  getSummary(bookId: string): Summary | null {
    return this.state.summaries[bookId] ?? null;
  }

  saveSummary(
    bookId: string,
    content: RichTextDoc | null,
    plainText: string,
  ): Summary | null {
    if (!this.getBook(bookId)) return null;
    const at = nowIso();
    const existing = this.state.summaries[bookId];
    const summary: Summary = {
      bookId,
      content,
      plainText,
      createdAt: existing?.createdAt ?? at,
      updatedAt: at,
    };
    this.commit({
      ...this.state,
      summaries: { ...this.state.summaries, [bookId]: summary },
    });
    return summary;
  }

  /* ----- notes ----- */

  listNotes(bookId: string): Note[] {
    return this.state.notes.filter((n) => n.bookId === bookId);
  }

  createNote(
    bookId: string,
    input: { title?: string | null; body: string; tags?: string[] },
  ): Note | null {
    if (!this.getBook(bookId)) return null;
    const at = nowIso();
    const note: Note = {
      id: uid("note"),
      bookId,
      title: cleanText(input.title),
      body: input.body.trim(),
      tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean),
      createdAt: at,
      updatedAt: at,
    };
    this.commit({ ...this.state, notes: [note, ...this.state.notes] });
    return note;
  }

  updateNote(
    id: string,
    patch: Partial<Pick<Note, "title" | "body" | "tags">>,
  ): Note | null {
    const existing = this.state.notes.find((n) => n.id === id);
    if (!existing) return null;
    const updated: Note = {
      ...existing,
      ...patch,
      title: patch.title !== undefined ? cleanText(patch.title) : existing.title,
      body: patch.body !== undefined ? patch.body : existing.body,
      tags: patch.tags !== undefined ? Array.from(new Set(patch.tags.map((t) => t.trim()).filter(Boolean))) : existing.tags,
      updatedAt: nowIso(),
    };
    this.commit({
      ...this.state,
      notes: this.state.notes.map((n) => (n.id === id ? updated : n)),
    });
    return updated;
  }

  deleteNote(id: string): boolean {
    if (!this.state.notes.some((n) => n.id === id)) return false;
    this.commit({
      ...this.state,
      notes: this.state.notes.filter((n) => n.id !== id),
      reviews: this.detachSource("note", id),
    });
    return true;
  }

  /* ----- quotes ----- */

  listQuotes(bookId: string): Quote[] {
    return this.state.quotes.filter((q) => q.bookId === bookId);
  }

  createQuote(
    bookId: string,
    input: Pick<Quote, "text"> & Partial<Omit<Quote, "id" | "bookId" | "createdAt" | "updatedAt">>,
  ): Quote | null {
    if (!this.getBook(bookId)) return null;
    const at = nowIso();
    const quote: Quote = {
      id: uid("quote"),
      bookId,
      text: input.text.trim(),
      page: nonNegativeIntOrNull(input.page),
      highlight: input.highlight ?? "gold",
      annotation: cleanText(input.annotation),
      createdAt: at,
      updatedAt: at,
    };
    this.commit({ ...this.state, quotes: [quote, ...this.state.quotes] });
    return quote;
  }

  updateQuote(id: string, patch: Partial<Omit<Quote, "id" | "bookId" | "createdAt">>): Quote | null {
    const existing = this.state.quotes.find((q) => q.id === id);
    if (!existing) return null;
    const updated: Quote = {
      ...existing,
      ...patch,
      text: patch.text !== undefined ? patch.text.trim() : existing.text,
      page:
        patch.page !== undefined ? nonNegativeIntOrNull(patch.page) : existing.page,
      annotation:
        patch.annotation !== undefined ? cleanText(patch.annotation) : existing.annotation,
      updatedAt: nowIso(),
    };
    this.commit({
      ...this.state,
      quotes: this.state.quotes.map((q) => (q.id === id ? updated : q)),
    });
    return updated;
  }

  deleteQuote(id: string): boolean {
    if (!this.state.quotes.some((q) => q.id === id)) return false;
    this.commit({
      ...this.state,
      quotes: this.state.quotes.filter((q) => q.id !== id),
      reviews: this.detachSource("quote", id),
    });
    return true;
  }

  /* ----- reading sessions ----- */

  listSessions(bookId: string): ReadingSession[] {
    return this.state.sessions
      .filter((s) => s.bookId === bookId)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }

  createSession(
    bookId: string,
    input: { date: string; minutes: number; pages?: number | null; note?: string | null },
  ): ReadingSession | null {
    if (!this.getBook(bookId)) return null;
    const at = nowIso();
    const session: ReadingSession = {
      id: uid("session"),
      bookId,
      date: input.date,
      minutes: Math.max(0, Math.round(input.minutes)),
      pages: nonNegativeIntOrNull(input.pages),
      note: cleanText(input.note),
      createdAt: at,
      updatedAt: at,
    };
    this.commit({ ...this.state, sessions: [session, ...this.state.sessions] });
    return session;
  }

  updateSession(
    id: string,
    patch: Partial<Omit<ReadingSession, "id" | "bookId" | "createdAt">>,
  ): ReadingSession | null {
    const existing = this.state.sessions.find((s) => s.id === id);
    if (!existing) return null;
    const updated: ReadingSession = {
      ...existing,
      ...patch,
      minutes:
        patch.minutes !== undefined
          ? Math.max(0, Math.round(Number(patch.minutes) || 0))
          : existing.minutes,
      pages: patch.pages !== undefined ? nonNegativeIntOrNull(patch.pages) : existing.pages,
      note: patch.note !== undefined ? cleanText(patch.note) : existing.note,
      updatedAt: nowIso(),
    };
    this.commit({
      ...this.state,
      sessions: this.state.sessions.map((s) => (s.id === id ? updated : s)),
    });
    return updated;
  }

  deleteSession(id: string): boolean {
    if (!this.state.sessions.some((s) => s.id === id)) return false;
    this.commit({
      ...this.state,
      sessions: this.state.sessions.filter((s) => s.id !== id),
    });
    return true;
  }

  /* ----- reviews (Agora) ----- */

  listReviews(): ReviewItem[] {
    return this.state.reviews;
  }

  listBookReviews(bookId: string): ReviewItem[] {
    return this.state.reviews.filter((r) => r.bookId === bookId);
  }

  getReview(id: string | null | undefined): ReviewItem | null {
    if (!id) return null;
    return this.state.reviews.find((r) => r.id === id) ?? null;
  }

  /** Has this exact source record already been queued? */
  findReviewBySource(
    sourceType: ReviewItem["sourceType"],
    sourceId: string,
  ): ReviewItem | null {
    return (
      this.state.reviews.find(
        (r) => r.sourceType === sourceType && r.sourceId === sourceId,
      ) ?? null
    );
  }

  createReview(input: ReviewCreateInput): ReviewItem | null {
    if (!this.getBook(input.bookId)) return null;
    const prompt = input.prompt.trim();
    const answer = input.answer.trim();
    if (prompt.length === 0 || answer.length === 0) return null;
    const at = nowIso();
    const item: ReviewItem = {
      id: uid("review"),
      bookId: input.bookId,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      prompt,
      answer,
      lastReviewedAt: null,
      nextReviewAt: at,
      intervalDays: 0,
      repetitions: 0,
      reviewState: "new",
      createdAt: at,
      updatedAt: at,
    };
    this.commit({ ...this.state, reviews: [item, ...this.state.reviews] });
    return item;
  }

  updateReview(
    id: string,
    patch: Partial<Pick<ReviewItem, "prompt" | "answer">>,
  ): ReviewItem | null {
    const existing = this.getReview(id);
    if (!existing) return null;
    const prompt =
      patch.prompt !== undefined ? patch.prompt.trim() : existing.prompt;
    const answer =
      patch.answer !== undefined ? patch.answer.trim() : existing.answer;
    if (prompt.length === 0 || answer.length === 0) return null;
    const updated: ReviewItem = {
      ...existing,
      prompt,
      answer,
      updatedAt: nowIso(),
    };
    this.commit({
      ...this.state,
      reviews: this.state.reviews.map((r) => (r.id === id ? updated : r)),
    });
    return updated;
  }

  deleteReview(id: string): boolean {
    if (!this.state.reviews.some((r) => r.id === id)) return false;
    this.commit({
      ...this.state,
      reviews: this.state.reviews.filter((r) => r.id !== id),
    });
    return true;
  }

  /** Record the reader's recall feedback and reschedule the item. */
  applyReviewFeedback(
    id: string,
    feedback: ReviewFeedback,
    now: Date = new Date(),
  ): ReviewItem | null {
    const existing = this.getReview(id);
    if (!existing) return null;
    const updated = applyFeedback(existing, feedback, now);
    this.commit({
      ...this.state,
      reviews: this.state.reviews.map((r) => (r.id === id ? updated : r)),
    });
    return updated;
  }

  /**
   * Suspend or resume an item. Resuming makes it due again immediately rather
   * than restoring the old (possibly long-past) due date.
   */
  suspendReview(id: string, suspended: boolean): ReviewItem | null {
    const existing = this.getReview(id);
    if (!existing) return null;
    const updated: ReviewItem = {
      ...existing,
      reviewState: suspended ? "suspended" : "learning",
      nextReviewAt: suspended ? existing.nextReviewAt : nowIso(),
      updatedAt: nowIso(),
    };
    this.commit({
      ...this.state,
      reviews: this.state.reviews.map((r) => (r.id === id ? updated : r)),
    });
    return updated;
  }

  /** Push an item out of the queue for `days` without changing its learning. */
  postponeReview(id: string, days: number, now: Date = new Date()): ReviewItem | null {
    const existing = this.getReview(id);
    if (!existing) return null;
    const clamped = Math.min(REVIEW_INTERVAL_MAX_DAYS, Math.max(1, Math.round(days)));
    const nextReviewAt = new Date(
      now.getTime() + clamped * 24 * 60 * 60 * 1000,
    ).toISOString();
    const updated: ReviewItem = {
      ...existing,
      nextReviewAt,
      updatedAt: nowIso(),
    };
    this.commit({
      ...this.state,
      reviews: this.state.reviews.map((r) => (r.id === id ? updated : r)),
    });
    return updated;
  }

  /**
   * Keep a queued review when its source note/quote is deleted (its snapshot is
   * the reader's material), but drop the now-dead link so the UI never points at
   * a missing record.
   */
  private detachSource(
    sourceType: ReviewItem["sourceType"],
    sourceId: string,
  ): ReviewItem[] {
    return this.state.reviews.map((r) =>
      r.sourceType === sourceType && r.sourceId === sourceId
        ? { ...r, sourceId: null }
        : r,
    );
  }

  /* ----- mind maps ----- */

  listMindMaps(bookId: string): MindMap[] {
    return this.state.mindMaps
      .filter((m) => m.bookId === bookId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getMindMap(id: string | null | undefined): MindMap | null {
    if (!id) return null;
    return this.state.mindMaps.find((m) => m.id === id) ?? null;
  }

  /**
   * Create a map for a book. Always starts from the default graph (a single
   * central node) unless a template is named. A map can only be created for a
   * book that exists — never orphaned.
   */
  createMindMap(
    bookId: string,
    options: { title?: string; templateId?: string } = {},
  ): MindMap | null {
    if (!this.getBook(bookId)) return null;
    const template = options.templateId ? getTemplate(options.templateId) : null;
    const graph = template ? template.build() : null;
    const base = createDefaultMap(
      uid("map"),
      bookId,
      options.title?.trim() || template?.name || "Untitled map",
    );
    const at = nowIso();
    const map: MindMap = {
      ...base,
      title: options.title?.trim() || template?.name || "Untitled map",
      nodes: graph?.nodes ?? base.nodes,
      edges: graph?.edges ?? base.edges,
      createdAt: at,
      updatedAt: at,
    };
    this.commit({ ...this.state, mindMaps: [map, ...this.state.mindMaps] });
    return map;
  }

  updateMindMap(
    id: string,
    patch: Partial<Pick<MindMap, "title" | "nodes" | "edges" | "viewport">>,
  ): MindMap | null {
    const existing = this.getMindMap(id);
    if (!existing) return null;
    const updated: MindMap = {
      ...existing,
      title:
        patch.title !== undefined && patch.title.trim().length > 0
          ? patch.title.trim()
          : existing.title,
      nodes: patch.nodes ?? existing.nodes,
      edges: patch.edges ?? existing.edges,
      viewport: patch.viewport ?? existing.viewport,
      version: MIND_MAP_VERSION,
      updatedAt: nowIso(),
    };
    this.commit({
      ...this.state,
      mindMaps: this.state.mindMaps.map((m) => (m.id === id ? updated : m)),
    });
    return updated;
  }

  deleteMindMap(id: string): boolean {
    if (!this.state.mindMaps.some((m) => m.id === id)) return false;
    this.commit({
      ...this.state,
      mindMaps: this.state.mindMaps.filter((m) => m.id !== id),
    });
    return true;
  }

  /** Deep-copy a map with fresh node/edge ids. */
  duplicateMindMap(id: string): MindMap | null {
    const existing = this.getMindMap(id);
    if (!existing) return null;
    const idMap = new Map<string, string>();
    const nodes: MindMapNode[] = existing.nodes.map((node) => {
      const nextId = uid("mn");
      idMap.set(node.id, nextId);
      return { ...node, id: nextId };
    });
    const edges: MindMapEdge[] = existing.edges
      .map((edge) => {
        const source = idMap.get(edge.source);
        const target = idMap.get(edge.target);
        if (!source || !target) return null;
        return { ...edge, id: uid("me"), source, target };
      })
      .filter((edge): edge is MindMapEdge => edge !== null);
    const at = nowIso();
    const copy: MindMap = {
      ...existing,
      id: uid("map"),
      title: `${existing.title} (copy)`,
      nodes,
      edges,
      viewport: { ...existing.viewport },
      createdAt: at,
      updatedAt: at,
    };
    this.commit({ ...this.state, mindMaps: [copy, ...this.state.mindMaps] });
    return copy;
  }

  /* ----- import / replace (used by dataset for future sync) ----- */

  replaceAll(snapshot: LibrarySnapshot): void {
    this.commit(snapshot);
  }

  /* ----- cross-tab sync ----- */

  bindCrossTabSync(): () => void {
    if (typeof window === "undefined") return () => {};
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === LIBRARY_STORAGE_KEY) {
        this.reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }
}

/** Singleton — one library store per app instance. */
export const library = new LibraryStore();

/** Derived totals for a book's sessions. */
export function computeReadingTotals(sessions: ReadingSession[]): ReadingTotals {
  let totalMinutes = 0;
  let totalPages = 0;
  let lastReadAt: string | null = null;
  for (const s of sessions) {
    totalMinutes += s.minutes;
    totalPages += s.pages ?? 0;
    if (!lastReadAt || s.date > lastReadAt) lastReadAt = s.date;
  }
  return {
    totalMinutes,
    sessionCount: sessions.length,
    totalPages,
    lastReadAt,
  };
}
