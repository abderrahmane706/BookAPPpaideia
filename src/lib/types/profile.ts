/**
 * Reader-profile domain types.
 *
 * A profile describes the reader — never a public identity. There is no auth,
 * no public table and no sync in this build: the profile is stored on the
 * device only, alongside the library.
 */

export const PROFILE_SCHEMA_VERSION = 1;

/** Storage key for the (text-only) profile record. */
export const PROFILE_STORAGE_KEY = "paideia.profile.v1";

/** Curated language options for the optional reading-language preference. */
export const PROFILE_LANGUAGES = [
  "English",
  "Arabic",
  "French",
  "German",
  "Greek",
  "Italian",
  "Latin",
  "Spanish",
] as const;

export type ProfileLanguage = (typeof PROFILE_LANGUAGES)[number];

export const PROFILE_BIO_MAX = 600;
export const PROFILE_NAME_MAX = 80;
export const PROFILE_GOAL_MAX = 1000;

export interface ReaderProfile {
  schemaVersion: number;
  /** Display name shown in the header and profile page. May be empty. */
  displayName: string;
  /** A short free-text biography / reading statement. May be empty. */
  bio: string;
  /** Books the reader intends to read this year. Null = unset. */
  annualGoal: number | null;
  /** Preferred categories (subset of the curated book categories). */
  preferredCategories: string[];
  /** Optional preferred reading language. Null = unset. */
  language: ProfileLanguage | null;
  updatedAt: string;
}

export const EMPTY_PROFILE: ReaderProfile = {
  schemaVersion: PROFILE_SCHEMA_VERSION,
  displayName: "",
  bio: "",
  annualGoal: null,
  preferredCategories: [],
  language: null,
  updatedAt: "",
};

/** True when the reader has filled in nothing yet. */
export function isProfileEmpty(profile: ReaderProfile): boolean {
  return (
    profile.displayName.trim().length === 0 &&
    profile.bio.trim().length === 0 &&
    profile.annualGoal === null &&
    profile.preferredCategories.length === 0 &&
    profile.language === null
  );
}

/** A stable two-letter monogram derived from the display name. */
export function profileMonogram(profile: ReaderProfile): string {
  const name = profile.displayName.trim();
  if (!name) return "Π";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
