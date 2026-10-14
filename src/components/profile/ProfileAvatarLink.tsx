"use client";

import Link from "next/link";
import {
  useAvatarReady,
  useAvatarUrl,
  useProfile,
  useProfileReady,
} from "@/lib/services/profile";
import { profileMonogram } from "@/lib/types/profile";

/**
 * Header avatar — links to the reader's profile and reflects the monogram (or
 * uploaded portrait) once the device data has hydrated. Renders a neutral state
 * on the server and first paint so hydration never mismatches.
 */
export function ProfileAvatarLink() {
  const profile = useProfile();
  const profileReady = useProfileReady();
  const avatarUrl = useAvatarUrl();
  const avatarReady = useAvatarReady();

  const name = profileReady ? profile.displayName.trim() : "";
  const monogram = profileMonogram(profile);
  const label = name ? `${name}'s profile` : "Open your reader profile";

  return (
    <Link
      href="/profile"
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-raised font-display text-xs font-semibold text-engraving transition-colors hover:border-engraving focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving"
    >
      {avatarReady && avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{monogram}</span>
      )}
    </Link>
  );
}
