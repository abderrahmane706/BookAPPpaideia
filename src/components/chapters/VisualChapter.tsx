import { cn } from "@/lib/utils/cn";
import { Reveal } from "./Reveal";
import { ChapterContent } from "./ChapterContent";
import { ChapterArtwork } from "./ChapterArtwork";
import { ArtworkLayer, type LayerPosition } from "./ArtworkLayer";
import { ChapterPlate } from "@/components/ui/ChapterPlate";
import type { ChapterArtworkConfig } from "./types";
import type { ReactNode } from "react";

export interface VisualChapterProps {
  /** Two-digit chapter index, e.g. "01". */
  index: string;
  /** Roman numeral shown on the chapter plate, e.g. "I". */
  numeral: string;
  label: string;
  title: string;
  description?: string;
  /** Optional engraving for this chapter (two-column row mode). */
  artwork?: ChapterArtworkConfig;
  /**
   * Optional full-bleed layer artwork (hero mode). When set, the artwork is
   * positioned as a visual layer across one side of the section and the content
   * sits above it, rather than in a two-column row.
   */
  layerArtwork?: {
    src: string;
    position?: LayerPosition;
    /** Approximate desktop width of the artwork layer (0–1). */
    size?: number;
  };
  /** Body rendered in the content (left) column, beside the artwork. */
  children?: ReactNode;
  /** Full-width body rendered below the header + artwork row / layer. */
  footer?: ReactNode;
  /** id used by the chapter navigator to scroll to this chapter. */
  id?: string;
  /** Constrain the footer content to a narrower measure. */
  footerMax?: string;
  /** Override the heading scale for a balanced wrap (e.g. hero). */
  titleClassName?: string;
  className?: string;
}

/**
 * VisualChapter — the core chapter of the PAIDEIA scholarly manuscript.
 *
 * Two composition modes:
 *   - default: a two-zone row (ChapterContent left, ChapterArtwork right) with
 *     an optional full-width ChapterFooter below.
 *   - hero (layerArtwork set): the artwork becomes an integrated visual layer
 *     across one side of the section (~60% width), the content sits above it
 *     (~40%), and the section is tall enough to feel like an opening plate.
 *     On mobile the layer resets to normal flow below the content.
 *
 * Wrapped in a subtle scroll reveal.
 */
export function VisualChapter({
  index,
  numeral,
  label,
  title,
  description,
  artwork,
  layerArtwork,
  children,
  footer,
  footerMax,
  titleClassName,
  id,
  className,
}: VisualChapterProps) {
  const isHero = Boolean(layerArtwork?.src);
  const position = layerArtwork?.position ?? "right";

  return (
    <Reveal>
      <section
        id={id}
        className={cn(
          "scroll-mt-24 border-t border-line-strong/50 pt-7",
          isHero && "lg:min-h-[620px]",
          className,
        )}
      >
        {/* Chapter plate + numeral (ChapterHeader) */}
        <div className="mb-6 flex items-center gap-3">
          <ChapterPlate>{numeral}</ChapterPlate>
          <span className="small-caps text-ink-faint">
            Chapter {numeral} — {label}
          </span>
        </div>

        {isHero ? (
          /* Hero mode: artwork as an integrated visual layer. */
          <div className="relative lg:flex lg:min-h-[540px] lg:items-center">
            <ArtworkLayer
              src={layerArtwork!.src}
              position={position}
              size={layerArtwork?.size ?? 0.62}
              className="lg:pb-[8%]"
            />
            <div
              className={cn(
                "relative z-10 w-full",
                position === "right" && "lg:pr-[54%]",
                position === "left" && "lg:pl-[54%]",
                position === "bottom" && "lg:pb-[68%]",
                position === "full" && "lg:pr-[42%]",
              )}
            >
              <ChapterContent
                index={index}
                label={label}
                title={title}
                description={description}
                titleClassName={titleClassName}
              >
                {children}
              </ChapterContent>
            </div>
          </div>
        ) : (
          /* Default mode: two-zone row (content + artwork). */
          <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <ChapterContent
              index={index}
              label={label}
              title={title}
              description={description}
              titleClassName={titleClassName}
            >
              {children}
            </ChapterContent>

            <ChapterArtwork artwork={artwork} className="w-full" />
          </div>
        )}

        {/* Full-width ChapterFooter */}
        {footer ? (
          <div className={cn("mt-12 border-t border-line/60 pt-8", footerMax)}>
            {footer}
          </div>
        ) : null}
      </section>
    </Reveal>
  );
}
