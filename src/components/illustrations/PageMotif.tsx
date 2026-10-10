import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface PageMotifProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Top-of-page engraved ornament. A thin decorative band that marks the start
 * of a page as belonging to the PAIDEIA visual language. The final artwork is
 * a later-phase concern; this reserves the place and structure.
 */
export function PageMotif({ children, className }: PageMotifProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "mx-auto mb-6 flex max-w-sm items-center gap-3 text-engraving/40",
        className,
      )}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-line-strong" />
      <span className="font-display text-2xl leading-none text-gold-soft">
        {children ?? "❦"}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-line-strong" />
    </div>
  );
}
