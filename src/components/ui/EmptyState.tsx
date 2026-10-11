import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional action rendered below the description. */
  action?: ReactNode;
  /** Optional decorative glyph. */
  glyph?: ReactNode;
}

/** Invitation-to-act empty state used across sections. */
export function EmptyState({
  title,
  description,
  action,
  glyph,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-radius-lg border border-dashed border-line-strong bg-parchment-shade/40 px-6 py-12 text-center">
      {glyph ? <div className="mb-4 text-engraving/50">{glyph}</div> : null}
      <h3 className="font-editorial text-lg font-semibold tracking-tight text-ink">
        {title}
      </h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
