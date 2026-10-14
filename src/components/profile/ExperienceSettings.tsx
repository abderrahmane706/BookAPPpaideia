"use client";

import {
  ENTRANCE_POLICIES,
  ENTRANCE_POLICY_LABELS,
  experience,
  threshold,
  useExperience,
  type EntrancePolicy,
} from "@/lib/services/preferences";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import { notify } from "@/components/ui/feedback";

/**
 * ExperienceSettings — the reader's control over the Threshold entrance:
 * how often it appears, and a way to replay it. Reads/writes the device-local
 * experience preferences; nothing here touches the profile or the library.
 */
export function ExperienceSettings() {
  const pref = useExperience();

  function changePolicy(policy: EntrancePolicy): void {
    experience.update({ entrancePolicy: policy });
    threshold.evaluate(policy);
    SoundManager.playToggle();
  }

  function replay(): void {
    threshold.evaluate(pref.entrancePolicy);
    threshold.replay();
    SoundManager.playClick();
    notify("The Threshold will appear.");
  }

  return (
    <section className="mt-10 border-t border-line pt-8">
      <span className="kicker mb-2">Experience</span>
      <h2 className="font-editorial text-2xl font-semibold tracking-tight text-ink">
        The Threshold
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
        The immersive entrance that greets you before the library. Choose how
        often it appears, or replay it now.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field
          label="Show the entrance"
          htmlFor="entrance-policy"
          hint="Stored on this device only."
        >
          <Select
            id="entrance-policy"
            value={pref.entrancePolicy}
            onChange={(event) =>
              changePolicy(event.target.value as EntrancePolicy)
            }
          >
            {ENTRANCE_POLICIES.map((policy) => (
              <option key={policy} value={policy}>
                {ENTRANCE_POLICY_LABELS[policy]}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="button" variant="secondary" onClick={replay}>
          Replay entrance
        </Button>
      </div>
    </section>
  );
}
