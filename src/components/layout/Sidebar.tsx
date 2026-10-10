"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { SoundToggle } from "@/components/ui/SoundToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useActiveChapter } from "@/components/chapters/chapterObserver";
import { SoundManager } from "@/lib/services/sound/SoundManager";

type SidebarLink =
  | { kind: "route"; label: string; href: string }
  | { kind: "section"; label: string; id: string };

/**
 * Persistent navigation for the scholarly workspace.
 * Route links navigate between real pages (Dashboard, Library); section links
 * scroll to a chapter on the dashboard.
 */
const SIDEBAR_LINKS: SidebarLink[] = [
  { kind: "route", label: "Dashboard", href: "/" },
  { kind: "route", label: "Library", href: "/library" },
  { kind: "section", label: "Reading", id: "chapter-reading" },
  { kind: "section", label: "Insights", id: "chapter-insights" },
  { kind: "section", label: "Reflection", id: "chapter-reflection" },
];

const PHILOSOPHICAL_STATEMENT = "Knowledge is not gathered, but remembered.";

/**
 * Sidebar — the persistent quiet left rail of the scholarly workspace.
 * Navigation, a philosophical statement, and theme/sound preferences at the
 * base. Section links perform a deliberate chapter navigation (scroll + a
 * single page-turn).
 */
export function Sidebar({ className }: { className?: string }) {
  const { activeChapter, navigateToChapter } = useActiveChapter();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-8 border-r border-line bg-parchment/60 lg:h-full " +
          "lg:w-56 lg:shrink-0 lg:flex-col lg:py-8 lg:pr-6",
        className,
      )}
    >
      <nav aria-label="Sidebar" className="flex flex-col gap-1">
        {SIDEBAR_LINKS.map((link) => {
          if (link.kind === "route") {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={() => SoundManager.playClick()}
                className={linkClass(active)}
              >
                <span className={markClass(active)} />
                {link.label}
              </Link>
            );
          }

          const active = pathname === "/" && activeChapter === link.id;
          return (
            <Link
              key={link.label}
              href={`/#${link.id}`}
              aria-current={active ? "true" : undefined}
              onClick={(event) => {
                if (pathname === "/") {
                  event.preventDefault();
                  navigateToChapter(link.id);
                }
              }}
              className={linkClass(active)}
            >
              <span className={markClass(active)} />
              {link.label}
            </Link>
          );
        })}
        <span className="flex cursor-not-allowed items-center gap-3 border-l border-transparent py-2 pl-3 font-utility text-sm text-ink-faint/60">
          <span className="h-px w-4 bg-line/60" />
          Mind Map
        </span>
      </nav>

      <p className="hidden max-w-[12rem] border-t border-line-strong/50 pt-5 font-display text-sm italic leading-relaxed text-ink-faint lg:block">
        {PHILOSOPHICAL_STATEMENT}
      </p>

      <div className="flex flex-row flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-strong/50 pt-4 lg:mt-auto lg:flex-col lg:items-start lg:gap-3 lg:pt-5">
        <span className="small-caps text-ink-faint">Preferences</span>
        <ThemeToggle />
        <SoundToggle />
      </div>
    </aside>
  );
}

function linkClass(active: boolean): string {
  return cn(
    "hover-lift group flex items-center gap-3 border-l py-2 pl-3 font-utility text-sm transition-colors",
    active
      ? "border-gold text-engraving-deep"
      : "border-transparent text-ink-soft hover:border-gold hover:text-engraving-deep",
  );
}

function markClass(active: boolean): string {
  return active
    ? "h-px w-4 bg-gold transition-colors"
    : "h-px w-4 bg-line-strong transition-colors group-hover:bg-gold";
}
