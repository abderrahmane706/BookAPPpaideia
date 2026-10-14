import { BOOK_CATEGORIES } from "@/lib/constants";
import {
  EMPTY_PROFILE,
  PROFILE_BIO_MAX,
  PROFILE_GOAL_MAX,
  PROFILE_LANGUAGES,
  PROFILE_NAME_MAX,
  PROFILE_SCHEMA_VERSION,
  PROFILE_STORAGE_KEY,
  type ProfileLanguage,
  type ReaderProfile,
} from "@/lib/types/profile";

export type ProfileUpdateInput = Partial<
  Pick<
    ReaderProfile,
    "displayName" | "bio" | "annualGoal" | "preferredCategories" | "language"
  >
>;

const CATEGORY_SET = new Set<string>(BOOK_CATEGORIES);
const LANGUAGE_SET = new Set<string>(PROFILE_LANGUAGES);

function clampText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function clampGoal(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1) return null;
  return Math.min(PROFILE_GOAL_MAX, rounded);
}

function clampCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.filter((item): item is string => typeof item === "string")),
  ).filter((item) => CATEGORY_SET.has(item));
}

function clampLanguage(value: unknown): ProfileLanguage | null {
  return typeof value === "string" && LANGUAGE_SET.has(value)
    ? (value as ProfileLanguage)
    : null;
}

/** Coerce an arbitrary record into a valid profile (defensive on read). */
export function normaliseProfile(raw: unknown): ReaderProfile | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    displayName: clampText(record.displayName, PROFILE_NAME_MAX),
    bio: clampText(record.bio, PROFILE_BIO_MAX),
    annualGoal: clampGoal(record.annualGoal),
    preferredCategories: clampCategories(record.preferredCategories),
    language: clampLanguage(record.language),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

function loadProfile(): ReaderProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return normaliseProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

function persistProfile(profileValue: ReaderProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify(profileValue),
    );
  } catch {
    /* private browsing / quota — keep the in-memory value */
  }
}

class ProfileStore {
  private state: ReaderProfile = EMPTY_PROFILE;
  private listeners = new Set<() => void>();
  private hydrated = false;

  /**
   * Read persistence the first time the store is actually observed. Deferring
   * this (rather than hydrating at module scope) keeps the first client render
   * identical to the server render, so `useSyncExternalStore` never trips a
   * hydration mismatch.
   */
  private hydrate(): void {
    this.state = loadProfile() ?? EMPTY_PROFILE;
    this.hydrated = true;
    this.emit();
  }

  reload(): void {
    this.hydrate();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (!this.hydrated && typeof window !== "undefined") this.hydrate();
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ReaderProfile => this.state;

  getServerSnapshot = (): ReaderProfile => EMPTY_PROFILE;

  isReady = (): boolean => this.hydrated;

  get(): ReaderProfile {
    if (!this.hydrated && typeof window !== "undefined") this.hydrate();
    return this.state;
  }

  /** Merge a patch into the profile, validating and persisting the result. */
  update(patch: ProfileUpdateInput): ReaderProfile {
    const next: ReaderProfile = {
      schemaVersion: PROFILE_SCHEMA_VERSION,
      displayName:
        patch.displayName !== undefined
          ? clampText(patch.displayName, PROFILE_NAME_MAX)
          : this.state.displayName,
      bio:
        patch.bio !== undefined
          ? clampText(patch.bio, PROFILE_BIO_MAX)
          : this.state.bio,
      annualGoal:
        patch.annualGoal !== undefined
          ? clampGoal(patch.annualGoal)
          : this.state.annualGoal,
      preferredCategories:
        patch.preferredCategories !== undefined
          ? clampCategories(patch.preferredCategories)
          : this.state.preferredCategories,
      language:
        patch.language !== undefined
          ? clampLanguage(patch.language)
          : this.state.language,
      updatedAt: new Date().toISOString(),
    };
    this.state = next;
    persistProfile(next);
    this.emit();
    return next;
  }

  /** Forget the text profile entirely. (Avatar is cleared separately.) */
  clear(): void {
    this.state = { ...EMPTY_PROFILE };
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    this.emit();
  }
}

/** Singleton — one profile per app instance. */
export const profile = new ProfileStore();
