import { cn } from "@/lib/utils/cn";

export interface GreekMeanderProps {
  className?: string;
}

/**
 * GreekMeander — a repeating Greek key (meander) band used as a classical
 * border rule to open or close a section. Purely decorative (aria-hidden).
 */
export function GreekMeander({ className }: GreekMeanderProps) {
  return <span aria-hidden className={cn("greek-meander block", className)} />;
}
