"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { useIsClient } from "@/lib/hooks/useIsClient";

export type FeedbackTone = "success" | "error" | "info";

interface FeedbackItem {
  id: number;
  message: string;
  tone: FeedbackTone;
}

const TONE_DOT: Record<FeedbackTone, string> = {
  success: "bg-success",
  error: "bg-danger",
  info: "bg-engraving",
};

let counter = 0;

/**
 * Tiny in-app notification store. Used for save / create / delete / export
 * confirmations and recoverable errors. Deliberately dependency-free.
 */
class FeedbackStore {
  private items: FeedbackItem[] = [];
  private listeners = new Set<() => void>();
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.items;

  push(message: string, tone: FeedbackTone = "success") {
    const id = ++counter;
    this.items = [...this.items, { id, message, tone }];
    this.emit();
    this.timers.set(
      id,
      setTimeout(() => this.dismiss(id), tone === "error" ? 7000 : 4500),
    );
  }

  dismiss(id: number) {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.items = this.items.filter((item) => item.id !== id);
    this.emit();
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

export const feedback = new FeedbackStore();

export function notify(message: string, tone: FeedbackTone = "success") {
  feedback.push(message, tone);
}

const EMPTY: FeedbackItem[] = [];

/** Mounted once in the app shell; renders the live notification region. */
export function FeedbackViewport() {
  const items = useSyncExternalStore(
    feedback.subscribe,
    feedback.getSnapshot,
    () => EMPTY,
  );
  const mounted = useIsClient();

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-2 p-4"
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          role={item.tone === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-radius-sm",
            "border border-line bg-surface-raised px-4 py-3 text-sm text-ink shadow-card-hover animate-fade-in",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
              TONE_DOT[item.tone],
            )}
          />
          <span className="flex-1 leading-relaxed">{item.message}</span>
          <button
            type="button"
            onClick={() => feedback.dismiss(item.id)}
            aria-label="Dismiss notification"
            className="text-ink-faint transition-colors hover:text-ink focus:outline-none"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
