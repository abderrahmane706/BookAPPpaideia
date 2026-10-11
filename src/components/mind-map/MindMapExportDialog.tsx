"use client";

import { useState } from "react";
import { Button, Modal, notify } from "@/components/ui";
import type { MindMap } from "@/lib/types/mindmap";
import {
  downloadMindMapJson,
  downloadMindMapPng,
  downloadMindMapSvg,
} from "@/lib/services/mindmap";

export interface MindMapExportDialogProps {
  open: boolean;
  onClose: () => void;
  map: MindMap;
}

/** Export the current map as JSON (round-trippable), SVG or PNG. */
export function MindMapExportDialog({ open, onClose, map }: MindMapExportDialogProps) {
  const [busy, setBusy] = useState(false);

  const run = (action: () => void | Promise<void>, label: string) => {
    try {
      const result = action();
      if (result instanceof Promise) {
        setBusy(true);
        result
          .then(() => notify(`${label} exported.`))
          .catch(() => notify(`Could not export ${label}.`, "error"))
          .finally(() => setBusy(false));
      } else {
        notify(`${label} exported.`);
      }
    } catch {
      notify(`Could not export ${label}.`, "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Export map">
      <p className="mb-4 text-sm text-ink-soft">
        Keep a portable copy of “{map.title}”. JSON can be re-imported later;
        SVG and PNG are for sharing.
      </p>
      <div className="grid gap-2.5">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            run(() => downloadMindMapJson(map), "JSON");
            onClose();
          }}
        >
          JSON — full, re-importable
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            run(() => downloadMindMapSvg(map), "SVG");
            onClose();
          }}
        >
          SVG — scalable image
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => run(() => downloadMindMapPng(map), "PNG")}
        >
          {busy ? "Rendering…" : "PNG — image (2×)"}
        </Button>
      </div>
    </Modal>
  );
}
