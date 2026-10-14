"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
} from "react";
import { cn } from "@/lib/utils/cn";

export interface TextRevealProps {
  /** The text to reveal. Split on whitespace into words. */
  text: string;
  /** Semantic element to render as (defaults to a paragraph). */
  as?: ElementType;
  className?: string;
  /** Delay before the first word, in ms. */
  delay?: number;
  /** Delay between consecutive words, in ms. */
  stagger?: number;
  /** IntersectionObserver threshold (0–1). */
  threshold?: number;
}

/**
 * TextReveal — a restrained word-by-word entrance for short display copy.
 *
 * Words rise a few pixels and ink in with a short stagger, evoking type being
 * set on a page. It runs once, when the block scrolls into view, and degrades
 * to a plain fade under `prefers-reduced-motion`.
 *
 * Accessibility & robustness:
 *  - The full text is exposed once to screen readers via an `sr-only` copy; the
 *    animated words are `aria-hidden`, so assistive tech never reads fragments.
 *  - Words are `inline-block` so they never break mid-word, while the spaces
 *    between them preserve normal line wrapping and text selection.
 *  - The server and first client render are identical (not-yet-visible), so no
 *    hydration mismatch occurs.
 */
export function TextReveal({
  text,
  as,
  className,
  delay = 0,
  stagger = 46,
  threshold = 0.25,
}: TextRevealProps) {
  const Tag = (as ?? "p") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      className={cn("text-reveal", visible && "is-visible", className)}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            {index > 0 ? " " : null}
            <span
              className="text-reveal__word"
              style={
                {
                  "--tr-delay": `${delay + index * stagger}ms`,
                } as CSSProperties
              }
            >
              {word}
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
