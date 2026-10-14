import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type MeanderDensity = "major" | "panel" | "section";

export interface GreekMeanderRuleProps {
  density?: MeanderDensity;
  /** Optional small-caps label set above the band. */
  label?: ReactNode;
  className?: string;
}

const DENSITY_CLASS: Record<MeanderDensity, string> = {
  major: "meander-band--major",
  panel: "meander-band--panel",
  section: "meander-band--section",
};

/**
 * GreekMeanderRule — a repeating Greek-key (meander) band used to open or close
 * a section. Three densities keep it from becoming the single repetitive
 * pattern in the app. Purely decorative (aria-hidden); pair with readable text.
 */
export function GreekMeanderRule({
  density = "panel",
  label,
  className,
}: GreekMeanderRuleProps) {
  return (
    <div className={cn("grid gap-1.5", className)} aria-hidden>
      {label ? (
        <span className="small-caps text-center text-ink-faint">{label}</span>
      ) : null}
      <span className={cn("meander-band block", DENSITY_CLASS[density])} />
    </div>
  );
}
