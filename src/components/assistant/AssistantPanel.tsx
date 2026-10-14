"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GroundingSource } from "@/services/ai/types";
import { scopeLabel, type AssistantScope } from "@/services/ai/context";
import {
  assistantConversation,
  useAssistantConversation,
} from "@/lib/services/assistant";
import { useLibrarySnapshot } from "@/lib/services/library";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";
import { GreekOrnament } from "@/components/ui/GreekOrnament";
import { Markdown } from "./Markdown";

export interface AssistantPanelProps {
  scope: AssistantScope;
  variant?: "full" | "compact";
  className?: string;
}

const LIBRARY_SUGGESTIONS = [
  "What have I read most recently?",
  "Which of my notes disagree with each other?",
  "Summarise the key ideas across my library.",
  "What should I revisit next?",
];

const BOOK_SUGGESTIONS = [
  "Summarise my notes on this book.",
  "What was my key takeaway?",
  "Which of my quotations are most important?",
  "What questions does this book leave open?",
];

function sourceHref(source: GroundingSource): string {
  return `/library/${source.bookId}#${source.section}`;
}

/**
 * AssistantPanel — the PAIDEIA conversation, shared by the full workspace and
 * the compact in-book view. Both variants render the single conversation model,
 * so a thread started in a book continues in the workspace and vice versa.
 */
export function AssistantPanel({
  scope,
  variant = "full",
  className,
}: AssistantPanelProps) {
  const state = useAssistantConversation();
  const snapshot = useLibrarySnapshot();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    assistantConversation.setScope(scope);
  }, [scope]);

  const titles = state.messages.length;
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [titles, state.messages]);

  const scopeName = scopeLabel(scope, snapshot);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-radius-lg border border-line bg-surface shadow-card",
        variant === "full" ? "h-[min(72vh,44rem)]" : "",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <GreekOrnament shape="laurel" className="h-5 w-5 text-gold" />
          <div>
            <p className="font-editorial text-sm font-semibold text-ink">
              PAIDEIA
            </p>
            <p className="font-utility text-[0.65rem] uppercase tracking-[0.12em] text-ink-faint">
              {scopeName}
            </p>
          </div>
        </div>
        {state.messages.length > 0 ? (
          <button
            type="button"
            onClick={() => assistantConversation.clear()}
            className="font-utility text-xs uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-engraving-deep"
          >
            Clear
          </button>
        ) : null}
      </header>

      <div
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 py-5 sm:px-6",
          variant === "compact" && "max-h-[26rem]",
        )}
      >
        {state.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <GreekOrnament shape="laurel" className="mb-3 h-8 w-8 text-gold/70" />
            <p className="max-w-sm font-editorial text-base text-ink">
              Ask about what you have read. I can only see the books, notes,
              quotations and reflections in your library.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {(variant === "compact"
                ? BOOK_SUGGESTIONS
                : LIBRARY_SUGGESTIONS
              ).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-full border border-line-strong bg-surface px-3 py-1.5 font-utility text-xs text-ink-soft transition-colors hover:border-engraving hover:text-engraving-deep"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-5">
            {state.messages.map((message) =>
              message.role === "user" ? (
                <li key={message.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-radius-md rounded-br-sm bg-engraving px-4 py-2.5 font-body text-sm leading-relaxed text-surface">
                    {message.content}
                  </p>
                </li>
              ) : (
                <li key={message.id} className="flex flex-col gap-2">
                  <div className="max-w-[92%] rounded-radius-md rounded-bl-sm border border-line bg-parchment-shade/40 px-4 py-3 font-body text-sm leading-relaxed text-ink">
                    {message.pending ? (
                      <span className="inline-flex items-center gap-1.5 py-0.5">
                        <span className="sr-only">Thinking…</span>
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            aria-hidden
                            className="h-1.5 w-1.5 animate-pulse rounded-full bg-engraving/60"
                            style={{ animationDelay: `${dot * 160}ms` }}
                          />
                        ))}
                      </span>
                    ) : message.error ? (
                      <span className="text-ink-soft">{message.error}</span>
                    ) : (
                      <Markdown
                        content={message.content}
                        citationPrefix={message.id}
                      />
                    )}
                  </div>

                  {message.error ? (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void assistantConversation.retry()}
                      >
                        Try again
                      </Button>
                      <span className="font-utility text-xs text-ink-faint">
                        Your question was kept.
                      </span>
                    </div>
                  ) : null}

                  {message.sources && message.sources.length > 0 ? (
                    <div className="rounded-radius-md border border-line/70 bg-parchment-shade/30 px-4 py-3">
                      <span className="small-caps text-ink-faint">Sources</span>
                      <ol className="mt-2 flex flex-col gap-1.5">
                        {message.sources.map((source, index) => (
                          <li
                            key={`${message.id}-source-${index + 1}`}
                            id={`${message.id}-source-${index + 1}`}
                            className="font-utility text-xs text-ink-soft scroll-mt-24"
                          >
                            <span className="text-engraving">[{index + 1}]</span>{" "}
                            <Link
                              href={sourceHref(source)}
                              className="underline decoration-line-strong underline-offset-2 hover:text-engraving-deep"
                            >
                              {source.label}
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        )}
      </div>

      <form
        className="border-t border-line px-4 py-3 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          void assistantConversation.send(input);
          setInput("");
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void assistantConversation.send(input);
                setInput("");
              }
            }}
            rows={variant === "compact" ? 2 : 3}
            placeholder="Ask about your reading…"
            aria-label="Message the assistant"
            disabled={state.messages.some((message) => message.pending)}
            className="min-h-11 w-full resize-none rounded-radius-sm border border-line-strong bg-surface px-3 py-2.5 font-body text-sm text-ink placeholder:text-ink-faint focus:border-engraving focus:outline-none disabled:opacity-60"
          />
          <Button
            type="submit"
            disabled={
              input.trim().length === 0 ||
              state.messages.some((message) => message.pending)
            }
          >
            Ask
          </Button>
        </div>
        <p className="mt-2 font-utility text-[0.65rem] leading-relaxed text-ink-faint">
          Answers are drawn from your own saved material and may be imperfect.
          The assistant never invents quotations.
        </p>
      </form>
    </div>
  );
}
