import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Reveal } from "./Reveal";

export interface VisualSectionProps {
  /** Chapter number, rendered as an engraved Roman numeral plate (e.g. "I"). */
  chapter?: string;
  kicker: string;
  title: string;
  description?: string;
  /** Optional artwork shown at the top of the chapter. */
  children?: ReactNode;
  className?: string;
}

/**
 * A scroll "chapter" of the scholastic publication.
 * Composes a chapter numeral, editorial kicker + title, an optional artwork
 * slot, and the chapter body — one building block that every major page reuses
 * so the whole application belongs to the same visual world.
 */
export function VisualSection({
  chapter,
  kicker,
  title,
  description,
  children,
  className,
}: VisualSectionProps) {
  return (
    <Reveal>
      <section
        className={cn(
          "border-t border-line-strong/60 pt-8",
          className,
        )}
      >
        <header className="flex items-start gap-4">
          {chapter ? (
            <span
              aria-hidden
              className="mt-0.5 inline-flex shrink-0 items-center justify-center border border-line-strong/70 px-2 py-1 font-display text-sm font-semibold text-engraving"
            >
              {chapter}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="kicker mb-2">{kicker}</p>
            <h2 className="font-display text-3xl font-semibold leading-tight text-ink md:text-4xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-xl text-base text-ink-soft">
                {description}
              </p>
            ) : null}
          </div>
        </header>

        {children ? <div className="mt-8">{children}</div> : null}
      </section>
    </Reveal>
  );
}
