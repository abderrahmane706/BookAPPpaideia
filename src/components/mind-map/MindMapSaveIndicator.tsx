"use client";

import { cn } from "@/lib/utils/cn";

export type MindMapSaveStatus = "idle" | "saving" | "saved";

export interface MindMapSaveIndicatorProps {
  status: MindMapSaveStatus;
  className?: string;
}

const COPY: Record<MindMapSaveStatus, string> = {
  idle: "All changes saved",
  saving: "Saving…",
  saved: "Saved",
};

/** Quiet save-state indicator; announced politely for screen readers. */
export function MindMapSaveIndicator({ status, className }: MindMapSaveIndicatorProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-1.5 font-utility text-[11px] text-ink-faint",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors",
          status === "saving"
            ? "bg-gold"
            : status === "saved"
              ? "bg-success"
              : "bg-engraving/40",
        )}
      />
      {COPY[status]}
    </span>
  );
}
