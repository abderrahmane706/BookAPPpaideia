/**
 * AI service boundary — provider-independent.
 *
 * PAIDEIA's assistant is a specialized book assistant, not a generic chatbot.
 * The concrete provider/model is never hard-coded here; a future phase supplies
 * an implementation (OpenAI, Anthropic, etc.) behind this interface, and later
 * multiple specialized agents each implement `BookAgent`.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentContext {
  /** Ids of books the conversation is scoped to, when applicable. */
  bookIds?: string[];
  /** Snapshot of the user's notes/summaries the agent may consult, if provided. */
  referenceText?: string[];
}

export interface AgentReply {
  content: string;
  /** Citations or sources the agent drew on, when available. */
  sources?: string[];
}

/** A single specialized book-focused agent. */
export interface BookAgent {
  id: string;
  name: string;
  description: string;
  chat(messages: ChatMessage[], context?: AgentContext): Promise<AgentReply>;
}

/** Registry lookup and provider selection, resolved in a later phase. */
export interface AiProvider {
  id: string;
  available: boolean;
  agent(agentId: string): BookAgent | null;
}

export function getAiProvider(): AiProvider {
  // No provider configured yet — Phase 6 supplies the real implementation.
  return {
    id: "unconfigured",
    available: false,
    agent() {
      return null;
    },
  };
}
