/**
 * Experience preferences — how the reader wants PAIDEIA to behave across
 * sessions. Kept separate from the Reader Profile (identity) because these are
 * behavioural switches, not personal data.
 *
 * Currently this governs the Threshold entrance (Workstream B6): whether the
 * immersive entrance appears once per browser session, once per day, or never.
 */

export const EXPERIENCE_SCHEMA_VERSION = 1;

/** Storage key for the (device-local) experience preferences. */
export const EXPERIENCE_STORAGE_KEY = "paideia.preferences.v1";

/** Session marker written once the entrance has been shown this session. */
export const ENTRANCE_SESSION_KEY = "paideia-entrance-session";
/** Day marker (YYYY-MM-DD) written once the entrance has been shown today. */
export const ENTRANCE_DAY_KEY = "paideia-entrance-day";

export type EntrancePolicy = "session" | "daily" | "off";

export const ENTRANCE_POLICIES: EntrancePolicy[] = ["session", "daily", "off"];

export const ENTRANCE_POLICY_LABELS: Record<EntrancePolicy, string> = {
  session: "Once per session",
  daily: "Once per day",
  off: "Disabled",
};

export interface ExperiencePreferences {
  schemaVersion: number;
  entrancePolicy: EntrancePolicy;
  updatedAt: string;
}

export const DEFAULT_EXPERIENCE: ExperiencePreferences = {
  schemaVersion: EXPERIENCE_SCHEMA_VERSION,
  entrancePolicy: "session",
  updatedAt: "",
};

export function isEntrancePolicy(value: unknown): value is EntrancePolicy {
  return (
    value === "session" || value === "daily" || value === "off"
  );
}
