import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "btn-carved bg-engraving font-medium text-surface hover:bg-engraving-deep shadow-card",
  secondary:
    "btn-parchment border border-line-strong bg-surface text-ink hover:border-engraving hover:text-engraving-deep",
  ghost:
    "btn-quiet bg-transparent text-ink-soft hover:text-engraving-deep hover:bg-engraving/5",
  danger:
    "border border-danger/40 bg-surface text-danger hover:bg-danger hover:text-surface transition-colors",
};

const sizeStyles: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1.5",
  sm: "h-8.5 px-3.5 text-sm gap-2",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex select-none items-center justify-center rounded-radius-sm font-utility font-medium tracking-[0.01em] btn-press",
          "disabled:pointer-events-none disabled:opacity-50",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
