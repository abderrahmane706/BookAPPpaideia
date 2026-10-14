import type { GroundingSource } from "@/services/ai/types";
import {
  buildAssistantContext,
  type AssistantScope,
} from "@/services/ai/context";
import { library } from "@/lib/services/library";

/**
 * Client conversation store for the PAIDEIA assistant.
 *
 * One conversation model serves both the full workspace and the compact
 * in-book panel. It is a device-local store (persisted to localStorage) so the
 * reader's thread survives navigation; nothing is sent anywhere except the
 * current turn's bounded context to our own server route.
 */

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: GroundingSource[];
  /** Present on assistant bubbles that failed; the user's text is retained. */
  error?: string | null;
  /** True while awaiting a reply (never persisted). */
  pending?: boolean;
}

export interface AssistantState {
  messages: AssistantMessage[];
  scope: AssistantScope;
  ready: boolean;
}

const STORAGE_KEY = "paideia.assistant.v1";

const EMPTY_STATE: AssistantState = {
  messages: [],
  scope: { kind: "library" },
  ready: false,
};

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `m_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/** Always answer about "their reading", never outside the books. */
const OFF_TOPIC_REPLY =
  "I can only help with your own reading and library. Ask me about a book you have saved, your notes, or what to revisit next.";

function persist(state: AssistantState): void {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      scope: state.scope,
      messages: state.messages
        .filter((message) => !message.pending && message.content.trim().length > 0)
        .map(({ id, role, content, sources }) => ({ id, role, content, sources })),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode — keep in-memory */
  }
}

function load(): AssistantState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATE, ready: true };
    const parsed = JSON.parse(raw) as {
      scope?: AssistantScope;
      messages?: AssistantMessage[];
    };
    return {
      scope: parsed.scope?.kind === "book" ? parsed.scope : { kind: "library" },
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      ready: true,
    };
  } catch {
    return { ...EMPTY_STATE, ready: true };
  }
}

class AssistantConversation {
  private state: AssistantState = EMPTY_STATE;
  private listeners = new Set<() => void>();
  private inFlight = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.state = load();
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): AssistantState => this.state;

  getServerSnapshot = (): AssistantState => EMPTY_STATE;

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  private commit(next: AssistantState): void {
    this.state = next;
    persist(next);
    this.emit();
  }

  setScope(scope: AssistantScope): void {
    if (scope.kind === "book" && this.state.scope.kind === "book") {
      if (this.state.scope.bookId === scope.bookId) return;
    } else if (scope.kind === "library" && this.state.scope.kind === "library") {
      return;
    }
    this.commit({ ...this.state, scope });
  }

  clear(): void {
    this.commit({ ...this.state, messages: [] });
  }

  async send(text: string): Promise<void> {
    const content = text.trim();
    if (content.length === 0 || this.inFlight) return;
    const messages = [
      ...this.state.messages,
      { id: uid(), role: "user" as const, content },
      { id: uid(), role: "assistant" as const, content: "", pending: true },
    ];
    this.commit({ ...this.state, messages });
    await this.dispatch();
  }

  /** Re-issue the last question after a failure, dropping the error bubble. */
  async retry(): Promise<void> {
    if (this.inFlight) return;
    const messages = [...this.state.messages];
    while (
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      messages.pop();
    }
    if (messages.length === 0) return;
    messages.push({ id: uid(), role: "assistant", content: "", pending: true });
    this.commit({ ...this.state, messages });
    await this.dispatch();
  }

  private async dispatch(): Promise<void> {
    this.inFlight = true;
    const scope = this.state.scope;

    const history = this.state.messages
      .filter((message) => !message.pending && message.content.trim().length > 0)
      .map((message) => ({ role: message.role, content: message.content }));

    const snapshot = library.getSnapshot();
    const context = buildAssistantContext(snapshot, scope);

    const settle = (patch: Partial<AssistantMessage>): void => {
      const messages = this.state.messages.map((message) =>
        message.pending ? { ...message, ...patch, pending: false } : message,
      );
      this.commit({ ...this.state, messages });
    };

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history, context }),
      });
      const data = (await response.json()) as
        | { ok: true; reply: string; sources?: GroundingSource[] }
        | { ok: false; message?: string };

      if (data.ok) {
        settle({ content: data.reply, sources: data.sources ?? [] });
      } else {
        settle({
          content: "",
          error: data.message || "The assistant could not answer just now.",
        });
      }
    } catch {
      settle({
        content: "",
        error: "The assistant could not be reached. Your question is safe — try again.",
      });
    } finally {
      this.inFlight = false;
    }
  }
}

export const assistantConversation = new AssistantConversation();
export { OFF_TOPIC_REPLY };
