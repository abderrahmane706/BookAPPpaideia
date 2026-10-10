import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface InkUnderlineProps {
  children: ReactNode;
  className?: string;
}

/**
 * InkUnderline — an engraved underline that inks in from the left on hover and
 * on keyboard focus. A quiet, classical emphasis for a word or short phrase;
 * on touch devices the rule is shown statically so nothing is hover-only.
 */
export function InkUnderline({ children, className }: InkUnderlineProps) {
  return <span className={cn("ink-underline", className)}>{children}</span>;
}
