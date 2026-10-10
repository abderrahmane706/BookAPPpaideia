import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { ChapterArtworkConfig } from "./types";

export interface ChapterArtworkProps {
  artwork?: ChapterArtworkConfig;
  /** Fallback if no src provided. */
  placeholder?: ReactNode;
  className?: string;
}

/** Default plate aspect used when the config does not specify one (matches the
 *  landscape hero engraving so placeholders reserve realistic proportions). */
const DEFAULT_ASPECT = "16/9";

function DefaultPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center border border-dashed border-line-strong bg-parchment-shade/25 px-6 text-center">
      <span className="small-caps text-ink-faint">{label}</span>
    </div>
  );
}

/**
 * ChapterArtwork — the artwork slot for a visual chapter.
 *
 * With a real asset it renders the engraving and merges it into the parchment
 * (soft edge fade + multiply blend). Without one it reserves a proportional
 * placeholder (matching the hero's landscape plate) so the zone reads as an
 * integrated future engraving — never a giant empty rectangle or a detached
 * card. It never fabricates artwork.
 */
export function ChapterArtwork({
  artwork,
  placeholder,
  className,
}: ChapterArtworkProps) {
  const { src, aspect } = artwork ?? {};
  const plateAspect = aspect || DEFAULT_ASPECT;

  const frameClass = cn(
    "w-full overflow-hidden aspect-[var(--plate-aspect)]",
    className,
  );
  const plateStyle = { "--plate-aspect": plateAspect } as CSSProperties;

  if (!src) {
    return (
      <div className={frameClass} style={plateStyle}>
        {placeholder ?? <DefaultPlaceholder label="Engraving reserved" />}
      </div>
    );
  }

  return (
    <figure className={cn(frameClass, "engraving-blend")} style={plateStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="PAIDEIA scholarly engraving"
        className="h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </figure>
  );
}
