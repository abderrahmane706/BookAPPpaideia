import { cn } from "@/lib/utils/cn";

export interface DecorativeEngravingProps {
  /** Render as a vertical divider (columns) vs horizontal rule. */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

/**
 * Small ornamental divider motif used to punctuate sections with an
 * engraved feel — a centered lozenge between two hairlines.
 */
export function DecorativeEngraving({
  orientation = "horizontal",
  className,
}: DecorativeEngravingProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center text-gold/70",
        orientation === "horizontal" ? "w-full gap-3" : "flex-col gap-3",
        className,
      )}
    >
      <span
        className={cn(
          "bg-line-strong",
          orientation === "horizontal" ? "h-px flex-1" : "w-px flex-1",
        )}
      />
      <span className="inline-block h-2 w-2 rotate-45 border border-gold/60 bg-transparent" />
      <span
        className={cn(
          "bg-line-strong",
          orientation === "horizontal" ? "h-px flex-1" : "w-px flex-1",
        )}
      />
    </span>
  );
}
