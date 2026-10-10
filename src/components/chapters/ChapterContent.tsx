import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { AnimatedChapterNumber } from "./AnimatedChapterNumber";
import { GreekRule } from "@/components/ui/GreekRule";

export interface ChapterContentProps {
  /** Two-digit index rendered as a small plate, e.g. "01". */
  index?: string;
  /** Roman numeral for the folio, e.g. "I". */
  numeral?: string;
  /** Whether this chapter is currently active (drives numeral micro-animation). */
  active?: boolean;
  label: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Override the default heading scale (e.g. for a balanced hero wrap). */
  titleClassName?: string;
}

/**
 * ChapterContent — the textual column of a visual chapter.
 * Animated folio number + small chapter label, the chapter heading, a subtitle
 * line, a classical rule, and the chapter body.
 */
export function ChapterContent({
  index,
  numeral,
  active,
  label,
  title,
  description,
  children,
  className,
  titleClassName,
}: ChapterContentProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <p className="kicker mb-3">
        {numeral ? (
          <AnimatedChapterNumber numeral={numeral} active={active} />
        ) : index ? (
          <span className="mr-1 text-engraving">{index} ·</span>
        ) : null}
        {label}
      </p>

      <h2
        className={cn(
          "font-display font-semibold text-ink",
          titleClassName ?? "heading-chapter",
        )}
      >
        {title}
      </h2>

      {description ? (
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          {description}
        </p>
      ) : null}

      <GreekRule className="mt-5 max-w-xs" />

      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
