/**
 * Experience preferences boundary (device-local).
 *
 * Behavioural switches — currently the Threshold entrance policy — kept
 * separate from the Reader Profile. No auth, no server, no sync.
 */
export {
  experience,
  normaliseExperience,
  type ExperienceUpdateInput,
} from "./store";
export { threshold, todayKey, type ThresholdSnapshot } from "./entrance";
export {
  useExperience,
  useExperienceReady,
  useThreshold,
} from "./hooks";
export {
  DEFAULT_EXPERIENCE,
  ENTRANCE_DAY_KEY,
  ENTRANCE_POLICIES,
  ENTRANCE_POLICY_LABELS,
  ENTRANCE_SESSION_KEY,
  EXPERIENCE_SCHEMA_VERSION,
  EXPERIENCE_STORAGE_KEY,
  isEntrancePolicy,
} from "@/lib/types/experience";
export type {
  EntrancePolicy,
  ExperiencePreferences,
} from "@/lib/types/experience";
