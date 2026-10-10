import { cn } from "@/lib/utils/cn";

export interface AnimatedChapterNumberProps {
  /** Roman numeral, e.g. "IV". */
  numeral: string;
  /** Two-digit index, e.g. "04". */
  index?: string;
  active?: boolean;
  className?: string;
}

/**
 * AnimatedChapterNumber — the chapter's folio number.
 * Applies the `.chapter-numeral` micro-animation (letter-spacing + colour
 * settle when the chapter is active — driven by the shared active-chapter
 * state, no per-pixel JS). Purely typographic; no motion on reduced-motion.
 */
export function AnimatedChapterNumber({
  numeral,
  index,
  active,
  className,
}: AnimatedChapterNumberProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 font-utility",
        className,
      )}
    >
      {index ? (
        <span className="text-xs tracking-[0.2em] text-ink-faint">{index}</span>
      ) : null}
      <span
        className={cn(
          "chapter-numeral text-sm font-semibold tracking-[0.2em] text-engraving",
          active && "text-gold",
        )}
      >
        {numeral}
      </span>
    </span>
  );
}
