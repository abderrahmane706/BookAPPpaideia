import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface EngravingFrameProps {
  children?: ReactNode;
  /** Natural aspect ratio of the plate, e.g. "1774/887" or "4/3". */
  aspect?: string;
  /**
   * Blend the plate "into" the parchment page:
   *  - multiply makes engraved whites take on the paper tone (printed-in ink)
   *  - a radial mask softens the rectangular edges so no hard image boundary shows
   */
  blendIntoPage?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * A reusable "plate" frame for PAIDEIA artwork.
 *
 * This is deliberately NOT a dashboard card. It renders artwork so it belongs
 * to the page: multiply-blended into the parchment and edge-faded via a mask,
 * so the image reads as a pressed engraving rather than a pasted rectangle.
 * Supply any page's engraving as `children`.
 */
export function EngravingFrame({
  children,
  aspect,
  blendIntoPage = true,
  className,
  style,
}: EngravingFrameProps) {
  return (
    <figure
      className={cn(
        "relative select-none",
        aspect && "aspect-[var(--plate-aspect)]",
        blendIntoPage && "engraving-blend",
        className,
      )}
      style={{
        ...style,
        ...(aspect ? ({ "--plate-aspect": aspect } as CSSProperties) : {}),
      }}
    >
      {children}
    </figure>
  );
}
