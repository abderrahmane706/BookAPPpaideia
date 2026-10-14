/**
 * PAIDEIA AI — shared types for the book-focused assistant.
 *
 * The assistant is deliberately narrow: it reasons over the reader's own
 * library material and answers questions about it. It is not a general chat
 * bot. Everything the model is allowed to see arrives in a bounded "context"
 * payload assembled on the client from the reader's local library; the server
 * never stores it and treats it as untrusted reference data.
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** One addressable piece of the reader's material, for citations. */
export interface GroundingSource {
  /** Stable id the model cites as [n] (1-based in the rendered prompt). */
  id: string;
  /** Human label, e.g. "Note — Meditations". */
  label: string;
  bookId: string;
  /** Workspace section the source lives in: overview|summary|notes|quotes|review. */
  section: string;
  /** Kinds: note | quote | summary | reflection | book. */
  kind: string;
}

export interface BookContext {
  bookId: string;
  title: string;
  author: string;
  status?: string;
  summary?: string;
  notes?: Array<{ title: string | null; body: string }>;
  quotes?: Array<{ text: string; page: number | null }>;
  reflections?: Record<string, string>;
}

export interface AssistantContext {
  scope: "library" | "book";
  /** Book id when scope is "book". */
  bookId?: string;
  books: BookContext[];
  sources: GroundingSource[];
}

export interface AssistantChatRequest {
  messages: ChatMessage[];
  context: AssistantContext;
}

export type ChatUnavailableReason =
  | "unconfigured"
  | "blocked"
  | "invalid"
  | "rate_limited"
  | "provider_error";

export interface AssistantChatReply {
  ok: true;
  reply: string;
  provider: string;
  /** Sources actually offered for this turn (the model cites them by id). */
  sources: GroundingSource[];
}

export interface AssistantChatUnavailable {
  ok: false;
  reason: ChatUnavailableReason;
  message: string;
}

export type AssistantChatResult = AssistantChatReply | AssistantChatUnavailable;

/** Guard rails applied to every request, server-side. */
export const ASSISTANT_MAX_MESSAGES = 24;
export const ASSISTANT_MAX_MESSAGE_CHARS = 4000;
export const ASSISTANT_MAX_CONTEXT_BOOKS = 40;
export const ASSISTANT_MAX_CONTEXT_CHARS = 24_000;
