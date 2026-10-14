import { cn } from "@/lib/utils/cn";

export type EngravedRuleVariant = "plain" | "carved" | "marked";

export interface EngravedRuleProps {
  variant?: EngravedRuleVariant;
  className?: string;
}

/**
 * EngravedRule — a printed / incised horizontal rule. `plain` is a fine printed
 * hairline with end ticks; `carved` adds the lit/shaded stone edge; `marked`
 * sets a centred folio lozenge into an incised line. Decorative.
 */
export function EngravedRule({
  variant = "plain",
  className,
}: EngravedRuleProps) {
  if (variant === "marked") {
    return <div aria-hidden className={cn("carved-separator-marked", className)} />;
  }
  if (variant === "carved") {
    return (
      <div
        aria-hidden
        className={cn("engraved-rule engraved-rule--carved", className)}
      />
    );
  }
  return <div aria-hidden className={cn("engraved-rule", className)} />;
}
