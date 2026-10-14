"use client";

import type { ReviewItem, ReviewSourceType } from "@/lib/types/review";
import { useReviewForSource } from "@/lib/services/review";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/feedback";

export interface QueueForReviewButtonProps {
  sourceType: ReviewSourceType;
  sourceId: string;
  /** Queue the item; returns the created item, or null when nothing to queue. */
  onQueue: () => ReviewItem | null;
  size?: "xs" | "sm";
  label?: string;
}

/**
 * QueueForReviewButton — the single action that moves the reader's material
 * into the Agora. Once queued it settles into a quiet “In review” mark, so the
 * action is idempotent from the reader's point of view.
 */
export function QueueForReviewButton({
  sourceType,
  sourceId,
  onQueue,
  size = "xs",
  label = "Add to review",
}: QueueForReviewButtonProps) {
  const existing = useReviewForSource(sourceType, sourceId);

  if (existing) {
    return (
      <span
        className="inline-flex h-7 items-center gap-1.5 rounded-radius-sm px-2.5 font-utility text-xs text-ink-faint"
        title="Already in your review queue"
      >
        <span aria-hidden className="greek-diamond scale-75" />
        In review
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => {
        const created = onQueue();
        if (created) {
          SoundManager.playCreate();
          notify("Added to your review queue.");
        } else {
          notify("There is nothing to queue from this yet.", "info");
        }
      }}
    >
      {label}
    </Button>
  );
}
