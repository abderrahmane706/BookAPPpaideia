import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block font-utility text-xs font-medium uppercase tracking-[0.12em] text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}
