import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { EngravingFrame } from "./EngravingFrame";

export interface SectionArtworkProps {
  /** Path to a PAIDEIA engraving asset (under /images/paideia). */
  src?: string;
  alt?: string;
  /** Natural aspect ratio of the asset, e.g. "1774/887". */
  aspect?: string;
  /** Show `children` (a placeholder) when no src is provided. */
  placeholder?: ReactNode;
  className?: string;
}

/**
 * Reusable artwork slot for a visual section/chapter.
 * Renders the official engraving through EngravingFrame (printed into the
 * parchment). When no asset is provided, renders a clean placeholder that a
 * future official asset can drop in without restructure.
 */
export function SectionArtwork({
  src,
  alt = "PAIDEIA engraving",
  aspect,
  placeholder,
  className,
}: SectionArtworkProps) {
  if (!src) {
    return (
      <EngravingFrame
        aspect={aspect}
        blendIntoPage={false}
        className={cn(
          "flex items-center justify-center border border-dashed border-line-strong bg-parchment-shade/40",
          className,
        )}
      >
        {placeholder ?? (
          <span className="small-caps px-6 text-center text-ink-faint">
            Engraving placeholder
          </span>
        )}
      </EngravingFrame>
    );
  }

  return (
    <EngravingFrame
      aspect={aspect}
      className={cn("animate-ink", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </EngravingFrame>
  );
}
