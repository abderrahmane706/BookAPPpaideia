import type { Book } from "@/lib/types/book";
import { cn } from "@/lib/utils/cn";

export interface CategoryDistributionProps {
  books: Book[];
}

interface CategoryRow {
  category: string;
  count: number;
  share: number;
}

/**
 * CategoryDistribution — Chapter IV's category breakdown.
 * Derived purely from the real collection; rendered as quiet engraved bars
 * (no charting library — CSS widths only).
 */
export function CategoryDistribution({ books }: CategoryDistributionProps) {
  if (books.length === 0) {
    return (
      <p className="mt-4 border border-dashed border-line-strong bg-parchment-shade/25 p-6 text-center text-sm text-ink-soft">
        Add volumes to see how your collection is composed.
      </p>
    );
  }

  const counts = new Map<string, number>();
  books.forEach((b) => {
    const key = b.category.trim() || "Uncategorised";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const rows: CategoryRow[] = [...counts.entries()]
    .map(([category, count]) => ({
      category,
      count,
      share: Math.round((count / books.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="mt-5">
      <h3 className="font-utility text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
        Categories on your shelves
      </h3>
      <ul className="mt-3 grid gap-2.5">
        {rows.map((row) => (
          <li key={row.category} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-utility text-sm text-ink">{row.category}</span>
              <span className="font-utility text-xs text-ink-faint">
                {row.count} {row.count === 1 ? "volume" : "volumes"} · {row.share}%
              </span>
            </div>
            <div
              className="h-1.5 w-full bg-parchment-deep"
              role="img"
              aria-label={`${row.category}: ${row.share}% of the library`}
            >
              <div
                className={cn("progress-animate h-full bg-engraving/70")}
                style={{ width: `${row.share}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
