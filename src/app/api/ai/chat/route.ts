import { runAssistant } from "@/services/ai";
import { rateLimit } from "@/services/ai/rate-limit";

/**
 * POST /api/ai/chat — the only server entry point for the PAIDEIA assistant.
 *
 * Security properties:
 *  - Provider credentials live only in server env vars; nothing is echoed back.
 *  - Remote inference is blocked in production unless PAIDEIA_AI_ALLOW_REMOTE
 *    is explicitly set (an access boundary must exist behind it).
 *  - Input is validated and bounded; failures return generic messages.
 *  - A fixed-window rate limit absorbs runaway clients.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "local";
}

export async function POST(request: Request): Promise<Response> {
  const limit = rateLimit(clientKey(request), MAX_REQUESTS, WINDOW_MS);
  if (!limit.allowed) {
    return Response.json(
      {
        ok: false,
        reason: "rate_limited",
        message: "You are asking quite quickly — please pause a moment.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, reason: "invalid", message: "That request could not be read." },
      { status: 400 },
    );
  }

  const result = await runAssistant(body);
  if (result.ok) {
    return Response.json(result, { status: 200 });
  }

  const status =
    result.reason === "invalid"
      ? 400
      : result.reason === "rate_limited"
        ? 429
        : result.reason === "unconfigured" || result.reason === "blocked"
          ? 503
          : 502;

  return Response.json(result, { status });
}
