"use client";

import { useRef, useState } from "react";
import {
  BOOK_CATEGORIES,
} from "@/lib/constants";
import {
  PROFILE_BIO_MAX,
  PROFILE_GOAL_MAX,
  PROFILE_LANGUAGES,
  PROFILE_NAME_MAX,
  profileMonogram,
  type ProfileLanguage,
} from "@/lib/types/profile";
import {
  avatar,
  processAvatarFile,
  profile,
  useAvatarReady,
  useAvatarUrl,
  useProfile,
  useProfileReady,
  type ProfileUpdateInput,
} from "@/lib/services/profile";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { TextReveal } from "@/components/ui/TextReveal";
import { notify } from "@/components/ui/feedback";
import { DataExport } from "./DataExport";
import { ExperienceSettings } from "./ExperienceSettings";

const ACCEPTED = "image/png,image/jpeg,image/webp,image/avif";
const EMPTY_EDITS: ProfileUpdateInput = {};

/**
 * Reader profile editor.
 *
 * Edits are held as a sparse patch; the rendered value is the persisted profile
 * merged with that patch. This keeps partial completion always valid and lets
 * the profile hydrate asynchronously without a copy-into-state effect.
 */
export function ProfileView() {
  const stored = useProfile();
  const profileReady = useProfileReady();
  const avatarUrl = useAvatarUrl();
  const avatarReady = useAvatarReady();

  const [edits, setEdits] = useState<ProfileUpdateInput>(EMPTY_EDITS);
  const [justSaved, setJustSaved] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [busyAvatar, setBusyAvatar] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = Object.keys(edits).length > 0;
  const value = { ...stored, ...edits };
  const goalValue =
    edits.annualGoal !== undefined ? edits.annualGoal : stored.annualGoal;
  const languageValue =
    edits.language !== undefined ? edits.language : stored.language;
  const monogram = profileMonogram(value);

  const patch = (next: ProfileUpdateInput) => {
    setJustSaved(false);
    setEdits((current) => ({ ...current, ...next }));
  };

  const save = () => {
    profile.update(edits);
    setEdits(EMPTY_EDITS);
    setJustSaved(true);
    SoundManager.playSave();
    notify("Profile saved.");
  };

  const toggleCategory = (category: string) => {
    SoundManager.playToggle();
    setEdits((current) => {
      const list =
        current.preferredCategories ?? stored.preferredCategories;
      const next = list.includes(category)
        ? list.filter((item) => item !== category)
        : [...list, category];
      return { ...current, preferredCategories: next };
    });
  };

  const onChooseFile = async (file: File) => {
    setAvatarError(null);
    setBusyAvatar(true);
    const result = await processAvatarFile(file);
    if (!result.ok) {
      setBusyAvatar(false);
      setAvatarError(result.reason);
      notify(result.reason, "error");
      return;
    }
    const storedOk = await avatar.save(result.blob);
    setBusyAvatar(false);
    if (storedOk) {
      setJustSaved(false);
      notify("Portrait updated.");
    } else {
      setAvatarError("This browser could not store the image.");
    }
  };

  const removeAvatar = async () => {
    await avatar.clear();
    setAvatarError(null);
    notify("Portrait removed.");
  };

  const statusLabel = dirty
    ? "Unsaved changes"
    : justSaved
      ? "Saved"
      : profileReady
        ? "All changes saved"
        : "";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 border-b border-line pb-5">
        <span className="kicker mb-2">Your Reader Profile</span>
        <TextReveal
          as="h1"
          text="Reader Profile"
          className="heading-display font-display font-semibold text-ink"
        />
        <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-ink-soft">
          Describe the reader behind the library. Everything here is optional and
          stored on this device only — it is never published or synced.
        </p>
      </header>

      <section className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface-raised">
          {avatarReady && avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Your portrait"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-3xl font-semibold text-engraving">
              {monogram}
            </span>
          )}
        </div>
        <div className="grid gap-3">
          <span className="small-caps text-ink-faint">Portrait</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busyAvatar}
              onClick={() => fileRef.current?.click()}
            >
              {busyAvatar
                ? "Processing…"
                : avatarUrl
                  ? "Replace image"
                  : "Choose image"}
            </Button>
            {avatarUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeAvatar}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="font-utility text-xs text-ink-faint">
            PNG, JPEG, WebP or AVIF, up to 2 MB. Cropped square and stored in this
            browser.
          </p>
          {avatarError ? (
            <p role="alert" className="text-xs text-danger">
              {avatarError}
            </p>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED}
            className="sr-only"
            aria-label="Choose a portrait image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void onChooseFile(file);
            }}
          />
        </div>
      </section>

      <form
        className="grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <Field
          label="Display name"
          htmlFor="profile-name"
          hint="Shown in the header. Optional."
        >
          <Input
            id="profile-name"
            maxLength={PROFILE_NAME_MAX}
            value={value.displayName}
            onChange={(event) => patch({ displayName: event.target.value })}
            placeholder="e.g. Marcus Aurelius"
          />
        </Field>

        <Field
          label="Reading statement"
          htmlFor="profile-bio"
          hint="A short reflection on your reading life."
        >
          <Textarea
            id="profile-bio"
            rows={4}
            maxLength={PROFILE_BIO_MAX}
            value={value.bio}
            onChange={(event) => patch({ bio: event.target.value })}
            placeholder="A sentence or two about how and why you read…"
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="Annual reading goal"
            htmlFor="profile-goal"
            hint="Books you intend to read this year. Leave empty for none."
          >
            <Input
              id="profile-goal"
              type="number"
              min={1}
              max={PROFILE_GOAL_MAX}
              inputMode="numeric"
              value={goalValue === null ? "" : String(goalValue)}
              onChange={(event) => {
                const raw = event.target.value;
                patch({ annualGoal: raw === "" ? null : Number(raw) });
              }}
              placeholder="e.g. 24"
            />
          </Field>

          <Field
            label="Preferred language"
            htmlFor="profile-language"
            hint="Optional. Used for reading preferences later."
          >
            <Select
              id="profile-language"
              value={languageValue ?? ""}
              onChange={(event) =>
                patch({
                  language: (event.target.value || null) as ProfileLanguage | null,
                })
              }
            >
              <option value="">Not set</option>
              {PROFILE_LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium text-ink">
            Preferred categories
          </legend>
          <p className="text-xs text-ink-faint">
            Choose the subjects you are drawn to.
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {BOOK_CATEGORIES.map((category) => {
              const selected = value.preferredCategories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category)}
                  className={
                    selected
                      ? "border border-engraving bg-engraving px-3 py-1.5 font-utility text-xs uppercase tracking-[0.1em] text-surface transition-colors"
                      : "border border-line-strong bg-surface px-3 py-1.5 font-utility text-xs uppercase tracking-[0.1em] text-ink-soft transition-colors hover:border-engraving hover:text-engraving-deep"
                  }
                >
                  {category}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <span
            aria-live="polite"
            className={
              dirty
                ? "font-utility text-xs uppercase tracking-[0.12em] text-gold"
                : "font-utility text-xs uppercase tracking-[0.12em] text-ink-faint"
            }
          >
            {statusLabel}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={!dirty}
              onClick={() => setEdits(EMPTY_EDITS)}
            >
              Discard
            </Button>
            <Button type="submit" disabled={!dirty}>
              Save profile
            </Button>
          </div>
        </div>
      </form>

      <ExperienceSettings />

      <DataExport />
    </div>
  );
}
