"use client";

import { cn } from "@/lib/utils/cn";

export interface SectionNavItem {
  id: string;
  index: string;
  label: string;
}

export interface SectionNavProps {
  items: SectionNavItem[];
  className?: string;
}

/** In-page navigation for the workspace sections. */
export function SectionNav({ items, className }: SectionNavProps) {
  return (
    <nav
      aria-label="Book sections"
      className={cn(
        "sticky top-16 z-10 -mx-[clamp(1rem,4vw,2rem)] border-b border-line bg-parchment/95 px-[clamp(1rem,4vw,2rem)] py-2 backdrop-blur-sm",
        className,
      )}
    >
      <ul className="flex gap-1 overflow-x-auto">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <a
              href={`#${item.id}`}
              className="flex items-baseline gap-1.5 rounded-radius-sm px-3 py-1.5 font-utility text-xs text-ink-soft transition-colors hover:bg-engraving/5 hover:text-engraving-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving"
            >
              <span className="text-ink-faint">{item.index}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
