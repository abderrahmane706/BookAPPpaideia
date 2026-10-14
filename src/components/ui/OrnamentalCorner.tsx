import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface OrnamentalCornerProps {
  children: ReactNode;
  className?: string;
}

/**
 * OrnamentalCorner — draws four thin architectural L-brackets around its
 * children, like the corner nicks of a printed plate. Purely decorative; the
 * marks are aria-hidden and never reduce text contrast (they sit outside the
 * content box). Does not add padding of its own — spacing is the caller's.
 */
export function OrnamentalCorner({ children, className }: OrnamentalCornerProps) {
  return (
    <div className={cn("ornamental-corners", className)}>
      <span aria-hidden className="ornamental-corners__mark ornamental-corners__mark--tl" />
      <span aria-hidden className="ornamental-corners__mark ornamental-corners__mark--tr" />
      <span aria-hidden className="ornamental-corners__mark ornamental-corners__mark--bl" />
      <span aria-hidden className="ornamental-corners__mark ornamental-corners__mark--br" />
      {children}
    </div>
  );
}
