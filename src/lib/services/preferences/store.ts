import {
  DEFAULT_EXPERIENCE,
  EXPERIENCE_SCHEMA_VERSION,
  EXPERIENCE_STORAGE_KEY,
  isEntrancePolicy,
  type EntrancePolicy,
  type ExperiencePreferences,
} from "@/lib/types/experience";

export interface ExperienceUpdateInput {
  entrancePolicy?: EntrancePolicy;
}

/** Coerce a persisted record into a valid preferences object (defensive). */
export function normaliseExperience(raw: unknown): ExperiencePreferences | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  return {
    schemaVersion: EXPERIENCE_SCHEMA_VERSION,
    entrancePolicy: isEntrancePolicy(record.entrancePolicy)
      ? record.entrancePolicy
      : DEFAULT_EXPERIENCE.entrancePolicy,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
  };
}

function load(): ExperiencePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(EXPERIENCE_STORAGE_KEY);
    if (!raw) return null;
    return normaliseExperience(JSON.parse(raw));
  } catch {
    return null;
  }
}

function persist(value: ExperiencePreferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* private browsing / quota — keep the in-memory value */
  }
}

/**
 * Device-local experience preferences. Hydration is deferred until the store is
 * first observed, mirroring the profile store, so the first client render is
 * identical to the server render (no hydration mismatch).
 */
class ExperienceStore {
  private state: ExperiencePreferences = DEFAULT_EXPERIENCE;
  private listeners = new Set<() => void>();
  private hydrated = false;

  private hydrate(): void {
    this.state = load() ?? DEFAULT_EXPERIENCE;
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

  getSnapshot = (): ExperiencePreferences => this.state;

  getServerSnapshot = (): ExperiencePreferences => DEFAULT_EXPERIENCE;

  isReady = (): boolean => this.hydrated;

  get(): ExperiencePreferences {
    if (!this.hydrated && typeof window !== "undefined") this.hydrate();
    return this.state;
  }

  update(patch: ExperienceUpdateInput): ExperiencePreferences {
    const next: ExperiencePreferences = {
      schemaVersion: EXPERIENCE_SCHEMA_VERSION,
      entrancePolicy:
        patch.entrancePolicy !== undefined
          ? patch.entrancePolicy
          : this.state.entrancePolicy,
      updatedAt: new Date().toISOString(),
    };
    this.state = next;
    persist(next);
    this.emit();
    return next;
  }
}

/** Singleton — one preferences store per app instance. */
export const experience = new ExperienceStore();
