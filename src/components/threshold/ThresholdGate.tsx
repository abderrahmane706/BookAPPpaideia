"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  threshold,
  useExperience,
  useExperienceReady,
  useThreshold,
} from "@/lib/services/preferences";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { ThresholdExperience } from "./ThresholdExperience";

/** Matches `.threshold-shell--closing` (600ms) in globals.css. */
const CLOSE_MS = 600;

export interface ThresholdGateProps {
  children: ReactNode;
}

/**
 * ThresholdGate — renders the immersive entrance above the real application.
 *
 * It lives in the root layout (above every route), so:
 *  - navigating between routes never remounts it and never replays the
 *    entrance;
 *  - the application shell is always the real one rendered underneath — the
 *    entrance only veils it, then reveals it.
 *
 * The entry decision is made by the device-local `threshold` controller from the
 * reader's stored `entrancePolicy`, so there is no hydration mismatch and no
 * `setState`-in-effect: the effect only asks the external store to evaluate.
 */
export function ThresholdGate({ children }: ThresholdGateProps) {
  const ready = useExperienceReady();
  const pref = useExperience();
  const { open } = useThreshold();
  const reducedMotion = usePrefersReducedMotion();
  const [closing, setClosing] = useState(false);

  // Ask the controller to evaluate once preferences have hydrated (and again
  // only if the policy itself changes).
  useEffect(() => {
    if (ready) threshold.evaluate(pref.entrancePolicy);
  }, [ready, pref.entrancePolicy]);

  // Lock background scroll while the entrance is open; restore on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function finish(): void {
    threshold.dismiss();
    setClosing(false);
  }

  function handleContinue(): void {
    if (closing) return;
    SoundManager.playThreshold();
    if (reducedMotion) {
      finish();
      return;
    }
    setClosing(true);
    window.setTimeout(finish, CLOSE_MS);
  }

  function handleSkip(): void {
    threshold.dismiss();
    setClosing(false);
  }

  return (
    <>
      {children}
      {open ? (
        <ThresholdExperience
          closing={closing}
          onContinue={handleContinue}
          onSkip={handleSkip}
        />
      ) : null}
    </>
  );
}
