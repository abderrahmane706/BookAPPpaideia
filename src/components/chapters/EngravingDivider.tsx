import { cn } from "@/lib/utils/cn";

/**
 * Thin editorial divider between chapters. A fragile hairline with a small
 * ornamental folio mark at the centre, echoing an engraved section break.
 * Builds its own hairline so it never collides with other ornament rules.
 */
export function EngravingDivider({
  className,
  ornament = "❧",
}: {
  className?: string;
  ornament?: string;
}) {
  return (
    <div
      className={cn("relative my-8 w-full", className)}
      aria-hidden
    >
      <div className="h-px w-full bg-gradient-to-r from-transparent via-line-strong to-transparent" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-parchment px-4 font-display text-sm leading-none text-gold-soft">
        {ornament}
      </span>
    </div>
  );
}
