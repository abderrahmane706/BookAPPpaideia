import { cn } from "@/lib/utils/cn";

export interface ProgressProps {
  /** Progress as an integer 0–100. */
  value: number;
  /** Accessible label for the bar. */
  label?: string;
  className?: string;
}

/**
 * Milestone-aware reading progress bar.
 * Renders a 25%-stepped track so the 0/25/50/75/100 model is visually legible.
 */
export function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const filledSegments = Math.round(clamped / 25);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("flex w-full gap-1", className)}
    >
      {[0, 1, 2, 3].map((segment) => {
        const filled = segment < filledSegments;
        return (
          <div
            key={segment}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              filled ? "bg-engraving" : "bg-engraving/15",
            )}
          />
        );
      })}
    </div>
  );
}
