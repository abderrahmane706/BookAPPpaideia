import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface WorkspaceSectionProps {
  id: string;
  index: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Consistent section frame for the book workspace. */
export function WorkspaceSection({
  id,
  index,
  title,
  description,
  action,
  className,
  children,
}: WorkspaceSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("scroll-mt-24 border-t border-line pt-8", className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="small-caps text-ink-faint">{index}</span>
          <h2 id={`${id}-title`} className="font-display heading-section mt-1 text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-xl text-sm text-ink-soft">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
