import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** Multi-line text field matching the Input primitive. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "min-h-24 w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm leading-relaxed text-ink",
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

Textarea.displayName = "Textarea";
