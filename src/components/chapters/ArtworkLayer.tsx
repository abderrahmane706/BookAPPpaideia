import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";

export type LayerPosition = "right" | "left" | "bottom" | "full";

export interface ArtworkLayerProps {
  src: string;
  alt?: string;
  /** Which side the artwork layer occupies on desktop. */
  position?: LayerPosition;
  /** Approximate desktop width of the artwork layer (0–1). */
  size?: number;
  className?: string;
}

/**
 * ArtworkLayer — a reusable artwork layer integrated into a section's
 * composition (not a card): the artwork is positioned as a visual layer across
 * one side and blends toward the content with a parchment-compatible mask.
 *
 * It is deliberately NOT a rounded card — no border, no generic shadow. It
 * fills its allocated area via object-fit: cover and keeps the engraved blue
 * clearly legible (the mask only fades the very edge toward the content side).
 *
 * On mobile it resets to normal flow (below the content) so the composition
 * never breaks on small screens.
 */
export function ArtworkLayer({
  src,
  alt = "PAIDEIA engraving",
  position = "right",
  size = 0.62,
  className,
}: ArtworkLayerProps) {
  const artStyle = {
    "--art-w": `${Math.round(size * 100)}%`,
  } as CSSProperties;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none relative w-full overflow-hidden",
        "lg:absolute lg:top-0 lg:h-full",
        position === "left" && "lg:left-0",
        position === "right" && "lg:right-0",
        position === "bottom" && "lg:inset-x-0 lg:bottom-0 lg:top-auto lg:h-[58%]",
        position === "full" && "lg:inset-0",
        "lg:w-[var(--art-w)]",
        className,
      )}
      style={artStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover object-center artwork-blend",
          "artwork-mask",
          position === "left" && "artwork-mask-left object-[30%_50%]",
          position === "right" && "object-[70%_50%]",
          position === "bottom" && "artwork-mask-bottom object-[50%_35%]",
          position === "full" && "artwork-mask-full",
        )}
      />
    </div>
  );
}