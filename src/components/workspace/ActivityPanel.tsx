"use client";

import { useState } from "react";
import type { ReadingSession } from "@/lib/types/library";
import { computeReadingTotals, library } from "@/lib/services/library";
import { SoundManager } from "@/lib/services/sound/SoundManager";
import { notify } from "@/components/ui/feedback";

export interface ActivityPanelProps {
  bookId: string;
  sessions: ReadingSession[];
  pageCount: number | null;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** Reading activity: light session log with derived totals. */
export function ActivityPanel({ bookId, sessions, pageCount }: ActivityPanelProps) {
  const totals = computeReadingTotals(sessions);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [minutes, setMinutes] = useState("");
  const [pages, setPages] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addSession() {
    const minutesValue = Number(minutes);
    if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
      setError("Enter how many minutes you read.");
      return;
    }
    library.createSession(bookId, {
      date: date || new Date().toISOString().slice(0, 10),
      minutes: minutesValue,
      pages: pages ? Number(pages) : null,
      note: note.trim() || null,
    });
    setMinutes("");
    setPages("");
    setNote("");
    setError(null);
    SoundManager.playCreate();
    notify("Reading session logged.");
  }

  return (
    <div className="grid gap-5">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sessions" value={String(totals.sessionCount)} />
        <Stat label="Minutes read" value={String(totals.totalMinutes)} />
        <Stat label="Pages read" value={String(totals.totalPages)} />
        <Stat
          label="Last read"
          value={totals.lastReadAt ? totals.lastReadAt.slice(0, 10) : "—"}
        />
      </dl>

      <div className="grid gap-3 rounded-radius-md border border-line bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="font-utility text-sm font-medium text-ink">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="font-utility text-sm font-medium text-ink">
              Minutes
            </span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              placeholder="e.g. 30"
              className="w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="font-utility text-sm font-medium text-ink">
              Pages <span className="text-ink-faint">(optional)</span>
            </span>
            <input
              type="number"
              min={0}
              max={pageCount ?? undefined}
              inputMode="numeric"
              value={pages}
              onChange={(event) => setPages(event.target.value)}
              className="w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
            />
          </label>
        </div>
        <label className="grid gap-1.5">
          <span className="font-utility text-sm font-medium text-ink">
            Note <span className="text-ink-faint">(optional)</span>
          </span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Where you left off…"
            className="w-full rounded-radius-sm border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-engraving focus:outline-none"
          />
        </label>
        {error ? (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={addSession}
            className="btn-press rounded-radius-sm bg-engraving px-4 py-1.5 font-utility text-sm font-medium text-surface hover:bg-engraving-deep"
          >
            Add session
          </button>
        </div>
      </div>

      <ul className="grid gap-2">
        {sessions.map((session) => (
          <li
            key={session.id}
            className="flex items-center justify-between gap-3 rounded-radius-sm border border-line bg-surface px-4 py-2.5"
          >
            <div>
              <p className="font-utility text-sm text-ink">
                {session.date} · {formatMinutes(session.minutes)}
                {session.pages !== null ? ` · ${session.pages} pages` : ""}
              </p>
              {session.note ? (
                <p className="text-xs text-ink-faint">{session.note}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                library.deleteSession(session.id);
                SoundManager.playDelete();
              }}
              className="font-utility text-xs text-danger underline decoration-line-strong underline-offset-2"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-radius-sm border border-line bg-surface px-3 py-2">
      <dt className="font-utility text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-lg font-semibold text-engraving-deep">
        {value}
      </dd>
    </div>
  );
}
