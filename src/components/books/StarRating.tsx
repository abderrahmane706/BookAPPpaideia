import { cn } from "@/lib/utils/cn";
import type { StarRating } from "@/lib/types/book";

export interface StarRatingProps {
  rating: StarRating | null;
  className?: string;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn(
        "h-3.5 w-3.5",
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

/** Read-only five-star rating. */
export function StarRatingComponent({ rating, className }: StarRatingProps) {
  if (rating === null) {
    return (
      <span className={cn("font-utility text-[11px] text-ink-faint", className)}>
        Unrated
      </span>
    );
  }
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Rated ${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= rating} />
      ))}
    </div>
  );
}
