"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { ChapterContent } from "./ChapterContent";
import { ArtworkLayer, type LayerPosition } from "./ArtworkLayer";
import { useActiveChapter } from "./chapterObserver";

export interface ScrollChapterProps {
  id: string;
  index: string;
  numeral: string;
  label: string;
  title: string;
  description?: string;
  titleClassName?: string;
  artwork?: {
    src: string;
    position?: LayerPosition;
    /** Approximate desktop width of the artwork layer (0–1). */
    size?: number;
  };
  /** Content column rendered above the artwork (shared region). */
  children?: ReactNode;
  /** Full-width body rendered below the chapter scene. */
  footer?: ReactNode;
  className?: string;
}

/**
 * ScrollChapter — a chapter composed as ONE editorial region.
 *
 * Desktop: the chapter label + title + body sit in a LEFT content column
 * (≈42%) and the artwork is an absolutely-positioned RIGHT layer (≈58%),
 * both anchored to the SAME vertical region — so the heading and the artwork
 * begin together instead of the artwork detaching above the text. The artwork
 * is confined to its own chapter (position: absolute inside a relative
 * chapter; never fixed on the page, never overflowing the section).
 *
 * Mobile: the artwork returns to normal document flow, placed AFTER the
 * chapter content (label → title → content → artwork → section content),
 * capped to ~45vh, full-width, so the page grows naturally with its content
 * and there is no nested scrollbar or absolute-overlap.
 *
 * Motion: a light enter/active/exit emphasis driven by CSS custom properties
 * written from an IntersectionObserver (no re-render per scroll pixel).
 * prefers-reduced-motion collapses this to a plain fade.
 */
export function ScrollChapter({
  id,
  index,
  numeral,
  label,
  title,
  description,
  titleClassName,
  artwork,
  children,
  footer,
  className,
}: ScrollChapterProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const { activeChapter } = useActiveChapter();
  const isActive = activeChapter === id;

  useEffect(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    if (!section || !scene) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / total));

      let opacity: number;
      let ty: number;
      let scale: number;

      if (reduced) {
        opacity = Math.min(1, p * 3);
        ty = 0;
        scale = 1;
      } else {
        if (p < 0.3) {
          const t = p / 0.3;
          opacity = 0.45 + 0.55 * t;
          ty = 18 * (1 - t);
          scale = 0.99 - 0.01 * t;
        } else if (p < 0.7) {
          opacity = 1;
          ty = 0;
          scale = 1;
        } else {
          const t = (p - 0.7) / 0.3;
          opacity = 1 - 0.5 * t;
          ty = -14 * t;
          scale = 1;
        }
      }

      scene.style.setProperty("--ch-opacity", opacity.toFixed(3));
      scene.style.setProperty("--ch-ty", `${ty.toFixed(1)}px`);
      scene.style.setProperty("--ch-scale", scale.toFixed(3));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) onScroll();
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    observer.observe(section);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const position = artwork?.position ?? "right";
  const size = artwork?.size ?? 0.58;
  const hasArt = Boolean(artwork?.src);

  return (
    <section
      id={id}
      ref={sectionRef}
      className={cn(
        "scroll-chapter relative scroll-mt-16 pt-7",
        hasArt && "lg:min-h-[78svh]",
        isActive && "chapter-active",
        className,
      )}
    >
      {/* The single chapter region: artwork + content share this space. */}
      <div
        ref={sceneRef}
        className={cn(
          "chapter-scene relative",
          hasArt && "lg:flex lg:min-h-[72svh] lg:items-center",
          !hasArt && "h-full",
        )}
      >
        {/* Content column (left on desktop, first in flow on mobile). */}
        <div
          className={cn(
            "relative z-10 w-full max-w-3xl lg:w-[42%] lg:max-w-none",
          )}
        >
          <ChapterContent
            index={index}
            numeral={numeral}
            active={isActive}
            label={label}
            title={title}
            description={description}
            titleClassName={titleClassName}
          >
            {children}
          </ChapterContent>
        </div>

        {/* Artwork — absolute right on desktop; normal flow below content on mobile. */}
        {artwork ? (
          <ArtworkLayer
            src={artwork.src}
            position={position}
            size={size}
            className={cn(
              "lg:absolute lg:inset-y-0",
              position === "left" && "lg:left-0 lg:right-auto",
              position === "right" && "lg:right-0 lg:left-auto",
              position === "bottom" && "lg:inset-x-0 lg:bottom-0 lg:top-auto lg:h-[58%]",
              position === "full" && "lg:inset-0",
            )}
          />
        ) : null}
      </div>

      {/* Full-width chapter-specific content (e.g. reading-book grid). */}
      {footer ? (
        <div className={cn("relative z-10 mt-10 border-t border-line/60 pt-8 lg:mt-12")}>
          {footer}
        </div>
      ) : null}

      {/* Narrator cue when active */}
      {isActive ? (
        <span className="pointer-events-none absolute bottom-4 left-0 hidden font-utility text-[10px] uppercase tracking-[0.3em] text-gold/70 lg:block">
          Chapter {numeral}
        </span>
      ) : null}
    </section>
  );
}