import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual emphasis level. */
  variant?: "default" | "raised" | "inset";
}

const variantClasses: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "bg-surface border border-line shadow-card",
  raised: "bg-surface-raised border border-line shadow-card-hover",
  inset: "bg-parchment-shade border border-line",
};

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-radius-lg p-5",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Optional header block inside a Card. */
export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-4 flex items-start justify-between gap-3", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}
