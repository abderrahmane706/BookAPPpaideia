import { cn } from "@/lib/utils/cn";
import { IllustrationFrame } from "./IllustrationFrame";
import { GreekIllustration } from "./GreekIllustration";

export interface HeroIllustrationProps {
  className?: string;
}

/**
 * Dashboard hero illustration slot.
 *
 * Phase status: PROVISIONAL placeholder only. The final engraved artwork for
 * the hero lands in the visual identity pass. Swap `GreekIllustration` (or the
 * children) once the finished engraving exists — the frame stays as-is.
 */
export function HeroIllustration({ className }: HeroIllustrationProps) {
  return (
    <IllustrationFrame
      aspect="4/3"
      arch
      engraved
      label="Engraving of a classical library"
      className={cn("text-engraving", className)}
    >
      <GreekIllustration className="h-[88%] w-[88%] text-engraving" />
    </IllustrationFrame>
  );
}
