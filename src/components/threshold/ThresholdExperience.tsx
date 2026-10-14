import type { CSSProperties } from "react";
import { TextReveal } from "@/components/ui/TextReveal";
import { ClassicalDivider } from "@/components/ui/ClassicalDivider";

export interface ThresholdExperienceProps {
  /** True while the closing reveal is playing. */
  closing?: boolean;
  onContinue: () => void;
  onSkip: () => void;
}

/**
 * Deterministic dust field — positions are derived from the index so the SSR
 * and client markup are identical (no random values, no hydration mismatch).
 */
const DUST = Array.from({ length: 22 }, (_, i) => {
  const golden = (i * 0.61803398875) % 1;
  return {
    x: `${Math.round(8 + ((i * 37) % 84))}%`,
    y: `${Math.round(28 + ((i * 53) % 62))}%`,
    size: `${2 + (i % 3)}px`,
    duration: `${10 + (i % 7) * 1.6}s`,
    delay: `${(golden * 9).toFixed(2)}s`,
    dx: `${(i % 2 === 0 ? 1 : -1) * (6 + (i % 5) * 3)}px`,
  };
});

/**
 * ThresholdExperience — the immersive entrance to PAIDEIA.
 *
 * A warm parchment chamber with an arched doorway of light, faint rays and
 * drifting engraving dust, composed entirely from CSS geometry (no stock
 * imagery). It presents a short greeting and a single clear Continue action.
 * Kept free of book business logic; the gate above it owns the policy.
 */
export function ThresholdExperience({
  closing = false,
  onContinue,
  onSkip,
}: ThresholdExperienceProps) {
  return (
    <div
      className={`threshold-shell${closing ? " threshold-shell--closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Paideia"
    >
      {/* Decorative chamber — never interactive, never over the copy. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="threshold-door">
          <div className="threshold-door__light" />
        </div>
        <div className="threshold-rays" />
        <div className="threshold-bloom" />
        {DUST.map((dust, index) => (
          <span
            key={index}
            className="threshold-dust"
            style={
              {
                "--dust-x": dust.x,
                "--dust-y": dust.y,
                "--dust-size": dust.size,
                "--dust-duration": dust.duration,
                "--dust-delay": dust.delay,
                "--dust-dx": dust.dx,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-lg px-6 text-center">
        <span aria-hidden className="threshold-emblem">
          Π
        </span>

        <TextReveal
          text="Welcome"
          as="h1"
          delay={200}
          stagger={0}
          className="font-display heading-display mt-7 text-ink"
        />

        <TextReveal
          text="You have crossed the threshold into your library."
          as="p"
          delay={480}
          stagger={34}
          className="mx-auto mt-3 max-w-md font-editorial text-xl italic leading-snug text-ink-soft"
        />

        <ClassicalDivider
          density="section"
          form="flourish"
          glyph="a"
          className="mx-auto mt-7 max-w-xs"
        />

        <p className="mt-7 max-w-sm mx-auto text-sm leading-relaxed text-ink-faint">
          How will you read today?
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 pb-6">
          <button
            type="button"
            autoFocus
            onClick={onContinue}
            className="btn-carved btn-press inline-flex h-12 items-center justify-center rounded-radius-sm bg-engraving px-8 font-utility text-sm font-medium tracking-[0.01em] text-surface shadow-card hover:bg-engraving-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving"
          >
            Enter the library
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="btn-quiet btn-press rounded-radius-sm px-3 py-1.5 font-utility text-xs text-ink-faint hover:text-ink"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
