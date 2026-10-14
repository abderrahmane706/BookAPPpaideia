/**
 * Reader-profile domain boundary.
 *
 * Text profile + a compact avatar blob (IndexedDB). Local to the device only —
 * there is no auth, no public profile and no cross-device sync in this build.
 */
export { profile, normaliseProfile, type ProfileUpdateInput } from "./store";
export {
  avatar,
} from "./avatarStore";
export {
  useAvatarReady,
  useAvatarUrl,
  useProfile,
  useProfileReady,
} from "./hooks";
export {
  avatarStorageAvailable,
  deleteAvatarBlob,
  getAvatarBlob,
  processAvatarFile,
  saveAvatarBlob,
  validateAvatarFile,
  type AvatarProcessResult,
} from "./avatar";
