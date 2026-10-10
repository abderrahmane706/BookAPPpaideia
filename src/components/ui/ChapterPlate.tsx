import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface ChapterPlateProps {
  children: ReactNode;
  className?: string;
}

/**
 * ChapterPlate — a small framed plate for a chapter index or numeral, like a
 * printed folio mark on a title page. Decorative (aria-hidden); the adjacent
 * text carries the accessible label.
 */
export function ChapterPlate({ children, className }: ChapterPlateProps) {
  return (
    <span aria-hidden className={cn("chapter-plate", className)}>
      {children}
    </span>
  );
}
