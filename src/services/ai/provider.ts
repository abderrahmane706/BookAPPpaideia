/**
 * Provider abstraction for the PAIDEIA assistant.
 *
 * The app talks to any OpenAI-compatible Chat Completions endpoint. Credentials
 * are read from server-only environment variables (never `NEXT_PUBLIC_*`) and
 * never leave this process. When configuration is absent the assistant reports
 * itself unconfigured rather than pretending to answer.
 */

export interface ProviderConfig {
  id: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Read provider configuration from the environment, or null if incomplete. */
export function getProviderConfig(): ProviderConfig | null {
  const apiKey = process.env.PAIDEIA_AI_API_KEY?.trim();
  const baseUrl = process.env.PAIDEIA_AI_BASE_URL?.trim();
  const model = process.env.PAIDEIA_AI_MODEL?.trim();
  if (!apiKey || !baseUrl || !model) return null;
  return {
    id: "openai-compatible",
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    model,
  };
}

export interface CompletionResult {
  text: string;
}

/**
 * Call the provider. Throws on transport/HTTP errors; callers convert those to
 * a generic, non-leaking failure state. We never surface the raw upstream body
 * (it can contain prompt echoes or stack details).
 */
export async function completeChat(
  config: ProviderConfig,
  messages: ProviderMessage[],
  signal?: AbortSignal,
): Promise<CompletionResult> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.3,
      max_tokens: 700,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Provider responded ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty completion");
  return { text };
}
