import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Visual weight, from a major chapter transition down to an inline seam. */
export type DividerDensity = "major" | "section" | "panel" | "inline";
/** The centred form set into the rule. */
export type DividerForm = "diamond" | "lozenge" | "flourish" | "bare";

export interface ClassicalDividerProps {
  density?: DividerDensity;
  form?: DividerForm;
  /** Mesures dingbat letter a–z used when `form="flourish"`. */
  glyph?: string;
  /** Optional centred label; when present it is announced to AT. */
  label?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * ClassicalDivider — a hairline interrupted by a small classical form. Four
 * densities (major / section / panel / inline) let chapter transitions, panel
 * seams, section headings and inline breaks differ without repeating one motif.
 * Decorative unless a `label` is supplied, in which case it is a named rule.
 */
export function ClassicalDivider({
  density = "section",
  form = "diamond",
  glyph = "a",
  label,
  className,
  children,
}: ClassicalDividerProps) {
  if (form === "bare") {
    return (
      <hr
        aria-hidden
        className={cn(
          "engraved-rule",
          density === "major" && "engraved-rule--carved",
          className,
        )}
      />
    );
  }

  const centre: ReactNode =
    children ??
    (label ? (
      <span className="small-caps whitespace-nowrap text-ink-faint">{label}</span>
    ) : form === "flourish" ? (
      <span className="flourish">{glyph}</span>
    ) : form === "lozenge" ? (
      <span className="inline-block h-1.5 w-3 rotate-45 border border-gold-soft/70 bg-gold-soft/20" />
    ) : (
      <span className="greek-diamond" />
    ));

  return (
    <div
      role="separator"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn(
        "classical-divider",
        `classical-divider--${density}`,
        className,
      )}
    >
      {centre}
    </div>
  );
}

/** A convenience rule that centres an arbitrary label between hairlines. */
export function LabelledDivider({
  children,
  density = "major",
  className,
}: {
  children: ReactNode;
  density?: DividerDensity;
  className?: string;
}) {
  return (
    <div
      role="separator"
      className={cn(
        "flex items-center gap-3 text-ink-faint",
        density === "major" && "gap-4",
        className,
      )}
    >
      <span className="h-px flex-1 bg-line-strong/70" />
      <span className="small-caps whitespace-nowrap">{children}</span>
      <span className="h-px flex-1 bg-line-strong/70" />
    </div>
  );
}
