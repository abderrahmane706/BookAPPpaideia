"use client";

import { useSyncExternalStore } from "react";
import type { ReaderProfile } from "@/lib/types/profile";
import { profile } from "./store";
import { avatar } from "./avatarStore";

/** The reader's profile (server snapshot is the empty profile). */
export function useProfile(): ReaderProfile {
  return useSyncExternalStore(
    profile.subscribe,
    profile.getSnapshot,
    profile.getServerSnapshot,
  );
}

/** True once the client has hydrated the profile from persistence. */
export function useProfileReady(): boolean {
  return useSyncExternalStore(profile.subscribe, profile.isReady, () => false);
}

/** The current avatar object URL, or null when none is set. */
export function useAvatarUrl(): string | null {
  return useSyncExternalStore(
    avatar.subscribe,
    () => avatar.getSnapshot().url,
    () => null,
  );
}

/** True once the avatar store has finished its initial read. */
export function useAvatarReady(): boolean {
  return useSyncExternalStore(avatar.subscribe, avatar.isReady, () => false);
}
