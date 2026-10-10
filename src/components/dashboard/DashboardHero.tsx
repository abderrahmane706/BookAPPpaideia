import type { ReactNode } from "react";
import { QuoteBlock } from "@/components/ui/QuoteBlock";

export interface DashboardHeroProps {
  benediction: string;
  quote: { text: string; source: string };
  actions?: ReactNode;
  /** Override the provisional hero artwork. */
  illustration?: ReactNode;
}

/**
 * Dashboard hero: greeting, literary quote and the reserved engraving frame.
 * Composes the welcome message + quote + illustration into one section.
 */
export function DashboardHero({
  benediction,
  quote,
  actions,
  illustration,
}: DashboardHeroProps) {
  return (
    <section className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-center">
      <div className="animate-rise">
        <p className="kicker mb-4">Your Scholar&apos;s Library</p>
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink md:text-5xl">
          {benediction}
        </h1>
        <div className="mt-6 max-w-xl border-l-2 border-engraving/30 pl-5">
          <QuoteBlock text={quote.text} source={quote.source} />
        </div>
        {actions ? (
          <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>

      <div className="flex justify-center lg:justify-end">
        {illustration ?? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/paideia/dashboard-hero.png"
            alt="PAIDEIA scholarly classical engraving"
            className="w-full max-w-md"
          />
        )}
      </div>
    </section>
  );
}
