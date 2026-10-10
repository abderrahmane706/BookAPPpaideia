import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * Custom marks for the summary editor.
 *
 * Instead of storing raw colours/fonts (which would break in the night theme),
 * we persist a *tone* and render a semantic class. The actual colours live in
 * globals.css and switch with the theme.
 */

export const HIGHLIGHT_TONES = ["gold", "blue", "green", "rose"] as const;
export type HighlightTone = (typeof HIGHLIGHT_TONES)[number];

export const TEXT_TONES = ["blue", "gold", "ink", "soft"] as const;
export type TextTone = (typeof TEXT_TONES)[number];

export const HighlightToneMark = Mark.create({
  name: "highlightTone",
  addAttributes() {
    return {
      tone: {
        default: "gold",
        parseHTML: (element) => element.getAttribute("data-tone") ?? "gold",
        renderHTML: (attributes) => ({ "data-tone": attributes.tone }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "mark[data-tone]" }, { tag: "mark" }];
  },
  renderHTML({ HTMLAttributes }) {
    const tone =
      typeof HTMLAttributes["data-tone"] === "string"
        ? HTMLAttributes["data-tone"]
        : "gold";
    return [
      "mark",
      mergeAttributes(HTMLAttributes, { class: `hl hl-${tone}` }),
      0,
    ];
  },
});

export const TextTone = Mark.create({
  name: "textTone",
  addAttributes() {
    return {
      tone: {
        default: "blue",
        parseHTML: (element) => element.getAttribute("data-text-tone") ?? "blue",
        renderHTML: (attributes) => ({ "data-text-tone": attributes.tone }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-text-tone]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const tone = (HTMLAttributes["data-text-tone"] as string) ?? "blue";
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: `c-${tone}` }),
      0,
    ];
  },
});
