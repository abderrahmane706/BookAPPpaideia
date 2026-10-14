import {
  ENTRANCE_DAY_KEY,
  ENTRANCE_SESSION_KEY,
  type EntrancePolicy,
} from "@/lib/types/experience";

/**
 * Threshold entrance policy controller.
 *
 * The entrance is shown based on a device-local marker (a session flag or a
 * day stamp) rather than in component state. Navigation between routes never
 * remounts this controller (it lives above the app shell), so a route change can
 * never unexpectedly replay the entrance.
 */

function safeSession(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function safeLocal(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** Local calendar day key (YYYY-MM-DD), matching the insights day basis. */
export function todayKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function hasSeen(policy: EntrancePolicy, now: Date): boolean {
  if (policy === "off") return true;
  if (policy === "daily") {
    return safeLocal()?.getItem(ENTRANCE_DAY_KEY) === todayKey(now);
  }
  return safeSession()?.getItem(ENTRANCE_SESSION_KEY) === "1";
}

function markSeen(policy: EntrancePolicy, now: Date): void {
  if (policy === "daily") {
    safeLocal()?.setItem(ENTRANCE_DAY_KEY, todayKey(now));
  } else if (policy === "session") {
    safeSession()?.setItem(ENTRANCE_SESSION_KEY, "1");
  }
}

function clearSeen(policy: EntrancePolicy): void {
  if (policy === "daily") {
    safeLocal()?.removeItem(ENTRANCE_DAY_KEY);
  } else {
    safeSession()?.removeItem(ENTRANCE_SESSION_KEY);
  }
}

export interface ThresholdSnapshot {
  open: boolean;
  evaluated: boolean;
}

const SERVER_SNAPSHOT: ThresholdSnapshot = { open: false, evaluated: false };

class ThresholdStore {
  private snap: ThresholdSnapshot = { open: false, evaluated: false };
  private policy: EntrancePolicy = "session";
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ThresholdSnapshot => this.snap;

  getServerSnapshot = (): ThresholdSnapshot => SERVER_SNAPSHOT;

  /** Decide whether the entrance should be open for the given policy. */
  evaluate(policy: EntrancePolicy, now: Date = new Date()): void {
    if (this.snap.evaluated && this.policy === policy) return;
    this.policy = policy;
    const open = !hasSeen(policy, now);
    this.set({ open, evaluated: true });
  }

  /** The reader crossed the threshold — remember it and close. */
  dismiss(now: Date = new Date()): void {
    markSeen(this.policy, now);
    this.set({ open: false, evaluated: true });
  }

  /** Re-open the entrance on demand (from settings), ignoring the marker. */
  replay(): void {
    clearSeen(this.policy);
    this.set({ open: true, evaluated: true });
  }

  private set(next: ThresholdSnapshot): void {
    this.snap = next;
    this.listeners.forEach((listener) => listener());
  }
}

/** Singleton — one threshold controller per app instance. */
export const threshold = new ThresholdStore();
