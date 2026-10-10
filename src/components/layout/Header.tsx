import Link from "next/link";
import { InkUnderline } from "@/components/ui/InkUnderline";

/**
 * Header — the restrained top band of the scholarly workspace.
 * PAIDEIA mark + tagline, a quiet search field, and a profile placeholder.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-parchment/90 backdrop-blur">
      <div className="container-paideia flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 font-display text-xl font-semibold tracking-tight text-ink"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-radius-sm border border-engraving/30 bg-surface font-display text-lg text-engraving-deep">
            Π
          </span>
          <span>
            Paideia
            <InkUnderline className="block font-utility text-[10px] font-medium uppercase tracking-[0.24em] text-gold">
              The Reader&apos;s Library
            </InkUnderline>
          </span>
        </Link>

        <div className="hidden w-full max-w-xs md:block">
          <input
            type="search"
            aria-label="Search"
            placeholder="Search books, notes..."
            className="h-9 w-full border border-line bg-surface-raised px-3 py-2 font-body text-sm text-ink placeholder:text-ink-faint/70 focus:border-line-strong focus:outline-none"
          />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong bg-surface-raised font-display text-xs font-semibold text-engraving">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
