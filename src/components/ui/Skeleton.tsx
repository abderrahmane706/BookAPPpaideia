import { cn } from "@/lib/utils/cn";

export interface SkeletonProps {
  className?: string;
}

/** Shimmer placeholder used during loading states. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-radius-sm bg-engraving/10",
        className,
      )}
    />
  );
}
