import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "default" | "engraving" | "gold" | "success" | "muted";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  default: "bg-engraving/8 text-engraving-deep border-engraving/20",
  engraving: "bg-engraving text-surface border-engraving",
  gold: "bg-gold/10 text-gold border-gold/30",
  success: "bg-success/10 text-success border-success/30",
  muted: "bg-ink/5 text-ink-soft border-line",
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-utility text-[11px] font-medium uppercase tracking-[0.08em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
