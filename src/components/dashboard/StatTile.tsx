import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Short supporting caption under the value. */
  hint?: string;
  /** Emphasize this tile as a primary metric. */
  accent?: boolean;
  className?: string;
}

export function StatTile({
  label,
  value,
  hint,
  accent,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-radius-md border border-line bg-surface px-4 py-3 shadow-card",
        "transition-colors",
        accent &&
          "border-engraving/40 bg-engraving/[0.03] shadow-[0_2px_10px_rgba(47,74,111,0.06)]",
        className,
      )}
    >
      <p className="font-utility text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold text-engraving-deep">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
