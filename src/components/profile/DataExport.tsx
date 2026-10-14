"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { notify } from "@/components/ui/feedback";
import { useLibrarySnapshot, useLibraryReady } from "@/lib/services/library/hooks";
import { getAvatarBlob, useProfile } from "@/lib/services/profile";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { downloadText } from "@/lib/utils/export";
import {
  booksToCsv,
  buildBackup,
  downloadBackup,
  type BackupManifest,
} from "@/lib/services/backup";

/**
 * DataExport — local backup and export controls.
 *
 * A full backup is generated in the browser (JSON + CSV + per-book Markdown +
 * manifest, zipped). Nothing is uploaded, and the UI states plainly that the
 * archive covers this device only.
 */
export function DataExport() {
  const snapshot = useLibrarySnapshot();
  const ready = useLibraryReady();
  const profile = useProfile();

  const [busy, setBusy] = useState(false);
  const [manifest, setManifest] = useState<BackupManifest | null>(null);

  const empty = ready && snapshot.books.length === 0;

  const runBackup = async () => {
    setBusy(true);
    try {
      const avatarBlob = await getAvatarBlob().catch(() => null);
      const result = await buildBackup({
        snapshot,
        profile,
        avatar: avatarBlob,
      });
      downloadBackup(result);
      setManifest(result.manifest);
      SoundManager.playSave();
      notify("Backup archive prepared.");
    } catch {
      notify("The backup could not be prepared.", "error");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(
      `paideia-library-${stamp}.csv`,
      booksToCsv(snapshot.books),
      "text/csv",
    );
    SoundManager.playSave();
    notify("Library exported as CSV.");
  };

  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="font-editorial text-lg font-semibold tracking-tight text-ink">
        Your data
      </h2>
      <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
        Download a complete copy of everything PAIDEIA holds on this device: your
        books, notes, quotations, summaries, mind maps and profile. The archive is
        built in your browser and never uploaded.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy || empty}
          onClick={() => void runBackup()}
        >
          {busy ? "Preparing…" : "Download full backup (.zip)"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={empty}
          onClick={exportCsv}
        >
          Export books (.csv)
        </Button>
      </div>

      {empty ? (
        <p className="mt-3 text-xs text-ink-faint">
          Add a book to enable exports.
        </p>
      ) : null}

      {manifest ? (
        <div className="mt-4 rounded-radius-md border border-line bg-parchment-shade/25 p-4 text-xs text-ink-soft">
          <p className="font-utility uppercase tracking-[0.12em] text-ink-faint">
            Last archive · {manifest.datasets.length} datasets
          </p>
          <ul className="mt-2 grid gap-1">
            {manifest.datasets.map((dataset) => (
              <li key={dataset.path} className="flex justify-between gap-4">
                <span className="font-utility">{dataset.path}</span>
                <span className="text-ink-faint">
                  {dataset.kind} · {dataset.records}
                </span>
              </li>
            ))}
          </ul>
          {manifest.omitted.length > 0 ? (
            <p className="mt-2 text-ink-faint">
              Omitted: {manifest.omitted.join("; ")}.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
