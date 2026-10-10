import { cn } from "@/lib/utils/cn";

export type OrnamentShape = "diamond" | "meander" | "laurel" | "rule";

export interface GreekOrnamentProps {
  shape?: OrnamentShape;
  className?: string;
}

/**
 * GreekOrnament — a small reusable classical motif: an ornamental diamond,
 * a meander strip, a laurel accent, or a plain engraved rule. Purely
 * decorative (aria-hidden); used to punctuate headings and section breaks.
 */
export function GreekOrnament({
  shape = "diamond",
  className,
}: GreekOrnamentProps) {
  if (shape === "meander") {
    return <span aria-hidden className={cn("greek-meander block", className)} />;
  }

  if (shape === "laurel") {
    return <span aria-hidden className={cn("laurel-accent", className)} />;
  }

  if (shape === "rule") {
    return (
      <span
        aria-hidden
        className={cn("block h-px w-full bg-line-strong/70", className)}
      />
    );
  }

  return <span aria-hidden className={cn("greek-diamond", className)} />;
}
