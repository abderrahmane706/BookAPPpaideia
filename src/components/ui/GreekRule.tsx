import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface GreekRuleProps {
  /** Optional centred label or motif set into the rule. */
  children?: ReactNode;
  className?: string;
}

/**
 * GreekRule — a classical horizontal divider: a hairline interrupted at the
 * centre by a small ornamental diamond or label, like a rule on a printed
 * title page. Decorative by default; pass `children` for a labelled variant.
 */
export function GreekRule({ children, className }: GreekRuleProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-hidden>
      <span className="h-px flex-1 bg-line-strong/70" />
      {children ?? <span className="greek-diamond" />}
      <span className="h-px flex-1 bg-line-strong/70" />
    </div>
  );
}
