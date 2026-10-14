import {
  ASSISTANT_MAX_CONTEXT_BOOKS,
  ASSISTANT_MAX_MESSAGE_CHARS,
  ASSISTANT_MAX_MESSAGES,
  type AssistantChatRequest,
  type AssistantChatResult,
  type ChatMessage,
  type GroundingSource,
} from "./types";
import { buildProviderMessages } from "./prompt";
import { completeChat, getProviderConfig } from "./provider";

/**
 * The PAIDEIA assistant service — orchestrates validation, the production
 * safety gate, context bounding and the provider call, and returns a single
 * result shape the API route can serialize. It never throws to the caller and
 * never leaks provider internals.
 */

/** Remote inference is blocked in production unless an access boundary is set. */
export function remoteInferenceAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.PAIDEIA_AI_ALLOW_REMOTE === "true";
}

function sanitiseMessages(messages: unknown): ChatMessage[] | null {
  if (!Array.isArray(messages)) return null;
  const cleaned: ChatMessage[] = [];
  for (const raw of messages) {
    if (typeof raw !== "object" || raw === null) return null;
    const record = raw as { role?: unknown; content?: unknown };
    const role = record.role === "assistant" ? "assistant" : "user";
    const content = typeof record.content === "string" ? record.content : "";
    if (content.trim().length === 0) continue;
    cleaned.push({ role, content: content.slice(0, ASSISTANT_MAX_MESSAGE_CHARS) });
  }
  if (cleaned.length === 0 || cleaned.length > ASSISTANT_MAX_MESSAGES) return null;
  return cleaned;
}

function sanitiseSources(value: unknown): GroundingSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .slice(0, ASSISTANT_MAX_CONTEXT_BOOKS * 8)
    .map((item, index) => ({
      id: String(item.id ?? index + 1),
      label: String(item.label ?? "Source").slice(0, 200),
      bookId: String(item.bookId ?? ""),
      section: String(item.section ?? "overview"),
      kind: String(item.kind ?? "book"),
    }));
}

/** Coerce an untrusted request body into a bounded, safe request, or null. */
function sanitiseRequest(body: unknown): AssistantChatRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as { messages?: unknown; context?: unknown };
  const messages = sanitiseMessages(record.messages);
  if (!messages) return null;

  const contextRecord =
    typeof record.context === "object" && record.context !== null
      ? (record.context as Record<string, unknown>)
      : {};
  const scope = contextRecord.scope === "book" ? "book" : "library";
  const books = Array.isArray(contextRecord.books)
    ? contextRecord.books.slice(0, ASSISTANT_MAX_CONTEXT_BOOKS)
    : [];

  return {
    messages,
    context: {
      scope,
      bookId:
        typeof contextRecord.bookId === "string" ? contextRecord.bookId : undefined,
      books: books as AssistantChatRequest["context"]["books"],
      sources: sanitiseSources(contextRecord.sources),
    },
  };
}

/** Run one assistant turn. Never throws. */
export async function runAssistant(body: unknown): Promise<AssistantChatResult> {
  const request = sanitiseRequest(body);
  if (!request) {
    return {
      ok: false,
      reason: "invalid",
      message: "That request could not be understood.",
    };
  }

  const config = getProviderConfig();
  if (!config) {
    return {
      ok: false,
      reason: "unconfigured",
      message:
        "The assistant is not configured yet. Add your provider credentials on the server to enable it.",
    };
  }

  if (!remoteInferenceAllowed()) {
    return {
      ok: false,
      reason: "blocked",
      message:
        "The assistant is disabled in this environment until an access boundary is configured.",
    };
  }

  try {
    const messages = buildProviderMessages(request.context, request.messages);
    const { text } = await completeChat(config, messages);
    return {
      ok: true,
      reply: text,
      provider: config.id,
      sources: request.context.sources,
    };
  } catch (error) {
    // Log server-side only; never echo the upstream error to the client.
    console.error("[paideia:ai] provider call failed:", error);
    return {
      ok: false,
      reason: "provider_error",
      message: "The assistant could not complete that answer. Please try again.",
    };
  }
}
