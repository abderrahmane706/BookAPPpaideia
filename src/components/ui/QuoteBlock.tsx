"use client";

import { cn } from "@/lib/utils/cn";
import { TextReveal } from "@/components/ui/TextReveal";

export interface QuoteBlockProps {
  text: string;
  source?: string;
  className?: string;
  /** Reveal the quotation word by word when it enters the viewport. */
  reveal?: boolean;
}

/** Engraved philosophical / literary quotation. */
export function QuoteBlock({ text, source, className, reveal }: QuoteBlockProps) {
  return (
    <figure className={cn("", className)}>
      <blockquote className="font-display text-xl italic leading-relaxed text-ink md:text-2xl">
        {reveal ? (
          <TextReveal text={`“${text}”`} stagger={38} />
        ) : (
          `“${text}”`
        )}
      </blockquote>
      {source ? (
        <figcaption className="mt-3 flex items-center gap-3 font-utility text-xs uppercase tracking-[0.18em] text-engraving">
          <span className="inline-block h-px w-8 bg-engraving/40" />
          {source}
        </figcaption>
      ) : null}
    </figure>
  );
}
