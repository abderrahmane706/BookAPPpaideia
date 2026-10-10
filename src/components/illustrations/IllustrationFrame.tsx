import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface IllustrationFrameProps {
  children?: ReactNode;
  /** Thin brass hairline around the frame. */
  engraved?: boolean;
  /** Apply the classical arch-top motif. */
  arch?: boolean;
  /** Aspect ratio of the well, e.g. "4/3", "1/1", "16/9". */
  aspect?: string;
  /** Accessible description of the contained artwork. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The recessed, engraved well that holds page-specific illustrations.
 *
 * This is an architecture/container component: it defines the framing and
 * surface for future Greek-engraving artwork without hardcoding any final
 * illustration. Pages drop their own art into `children`.
 */
export function IllustrationFrame({
  children,
  engraved = true,
  arch = false,
  aspect,
  label,
  className,
  style,
}: IllustrationFrameProps) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "illustration-well relative flex items-center justify-center",
        engraved && "border border-line-strong",
        arch && "arch-top",
        aspect && "aspect-[var(--aspect)]",
        className,
      )}
      style={{
        ...style,
        ...(aspect ? ({ "--aspect": aspect } as CSSProperties) : {}),
      }}
    >
      {children}
    </div>
  );
}
