"use client";

import { cn } from "@/lib/utils/cn";
import type { StarRating } from "@/lib/types/book";

export interface StarRatingInputProps {
  rating: StarRating | null;
  onChange: (rating: StarRating | null) => void;
  disabled?: boolean;
  className?: string;
}

const STARS: StarRating[] = [1, 2, 3, 4, 5];

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn(
        "h-5 w-5",
        filled ? "fill-gold text-gold" : "fill-transparent text-gold-soft/50",
      )}
    >
      <path
        stroke="currentColor"
        strokeWidth="1.4"
        d="M10 1.5l2.5 5.1 5.6.8-4 4 .9 5.6L10 14.4l-5 2.6.9-5.6-4-4 5.6-.8z"
      />
    </svg>
  );
}

/** Interactive five-star rating with keyboard support and a clear control. */
export function StarRatingInput({
  rating,
  onChange,
  disabled,
  className,
}: StarRatingInputProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        role="radiogroup"
        aria-label="Personal rating"
        className="flex items-center gap-0.5"
      >
        {STARS.map((n) => {
          const active = rating !== null && n <= rating;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              disabled={disabled}
              onClick={() => onChange(rating === n ? null : n)}
              className={cn(
                "rounded-radius-xs p-0.5 transition-transform",
                "hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
            >
              <Star filled={active} />
            </button>
          );
        })}
      </div>
      <span className="font-utility text-xs text-ink-faint" aria-live="polite">
        {rating === null ? "Unrated" : `${rating}/5`}
      </span>
    </div>
  );
}
