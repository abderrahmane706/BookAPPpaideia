"use client";

import { Modal } from "@/components/ui";
import { MIND_MAP_TEMPLATES } from "@/lib/services/mindmap";

export interface MindMapTemplatePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (templateId: string) => void;
}

/** Choose a starting shape for a brand-new map. */
export function MindMapTemplatePicker({
  open,
  onClose,
  onPick,
}: MindMapTemplatePickerProps) {
  return (
    <Modal open={open} onClose={onClose} title="New mind map" className="max-w-xl">
      <p className="mb-4 text-sm text-ink-soft">
        Start from a blank canvas or an arrangement tuned to a way of thinking.
        You can reshape everything afterwards.
      </p>
      <ul className="grid gap-2.5">
        {MIND_MAP_TEMPLATES.map((template) => (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => onPick(template.id)}
              className="w-full rounded-radius-sm border border-line bg-surface/60 px-4 py-3 text-left transition-colors hover:border-engraving hover:bg-engraving/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-engraving"
            >
              <span className="block font-editorial text-base font-semibold text-ink">
                {template.name}
              </span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                {template.description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
