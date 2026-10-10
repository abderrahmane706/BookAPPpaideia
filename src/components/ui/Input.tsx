import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-10 w-full rounded-radius-sm border border-line-strong bg-surface px-3 text-sm text-ink",
          "placeholder:text-ink-faint transition-colors",
          "focus:border-engraving focus:outline-none",
          invalid && "border-danger",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
