import { cn } from "@/lib/utils/cn";

export interface BookCoverProps {
  title: string;
  /** Public URL or storage URL; null falls back to an engraved placeholder. */
  src?: string | null;
  className?: string;
}

/**
 * Book cover display. Renders the image when available; otherwise an
 * engraved placeholder built from the title's silhouette.
 */
export function BookCover({ title, src, className }: BookCoverProps) {
  if (src) {
    return (
      // Plain img so remote storage URLs don't require next/image config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={`Cover of ${title}`}
        className={cn(
          "h-full w-full object-cover shadow-card",
          className,
        )}
      />
    );
  }

  return (
    <div
      aria-label={`Cover of ${title}`}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-engraving/10 to-engraving/20 p-4 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className="font-display text-3xl font-semibold text-engraving-deep/70"
      >
        {titleSilhouette(title)}
      </span>
      <span className="engraving-rule w-8" aria-hidden />
      <span className="line-clamp-2 font-display text-sm font-medium leading-snug text-engraving-deep">
        {title}
      </span>
    </div>
  );
}

function titleSilhouette(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "▮";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
