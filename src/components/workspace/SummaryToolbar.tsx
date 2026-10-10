"use client";

import { useEffect, useReducer, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils/cn";
import { HIGHLIGHT_TONES, type TextTone } from "./editor/marks";

const TEXT_TONES: Array<{ tone: TextTone; label: string; swatch: string }> = [
  { tone: "blue", label: "Blue text", swatch: "bg-[#3f5f85]" },
  { tone: "gold", label: "Gold text", swatch: "bg-[#6f5628]" },
  { tone: "ink", label: "Ink text", swatch: "bg-ink" },
  { tone: "soft", label: "Soft text", swatch: "bg-ink-soft" },
];

const HIGHLIGHT_SWATCHES: Record<string, string> = {
  gold: "bg-gold",
  blue: "bg-ink-blue",
  green: "bg-[#5e7c56]",
  rose: "bg-[#96605c]",
};

interface ToolButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-radius-xs px-2 font-utility text-xs transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-engraving",
        "disabled:pointer-events-none disabled:opacity-40",
        active
          ? "bg-engraving text-surface"
          : "text-ink-soft hover:bg-engraving/10 hover:text-engraving-deep",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px bg-line" />;
}

export interface SummaryToolbarProps {
  editor: Editor | null;
}

/** Formatting toolbar for the summary editor. Tokens only — no font pickers. */
export function SummaryToolbar({ editor }: SummaryToolbarProps) {
  const [, force] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    if (!editor) return;
    const update = () => force();
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  const chain = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Summary formatting"
      aria-controls="summary-editor"
      className="flex flex-wrap items-center gap-0.5 border-b border-line pb-2"
    >
      <ToolButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => chain().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolButton>
      <ToolButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => chain().toggleItalic().run()}
      >
        <em>I</em>
      </ToolButton>
      <ToolButton
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => chain().toggleUnderline().run()}
      >
        <span className="underline">U</span>
      </ToolButton>
      <ToolButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => chain().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </ToolButton>

      <Divider />

      <ToolButton
        label="Heading"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => chain().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolButton>
      <ToolButton
        label="Subheading"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => chain().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolButton>
      <ToolButton
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => chain().toggleBulletList().run()}
      >
        • List
      </ToolButton>
      <ToolButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => chain().toggleOrderedList().run()}
      >
        1. List
      </ToolButton>
      <ToolButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => chain().toggleBlockquote().run()}
      >
        ❝
      </ToolButton>

      <Divider />

      <span className="px-1 font-utility text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        Highlight
      </span>
      {HIGHLIGHT_TONES.map((tone) => (
        <button
          key={tone}
          type="button"
          aria-label={`Highlight ${tone}`}
          aria-pressed={editor.isActive("highlightTone", { tone })}
          title={`Highlight ${tone}`}
          onClick={() => {
            if (editor.isActive("highlightTone", { tone })) {
              chain().unsetMark("highlightTone").run();
            } else {
              chain().setMark("highlightTone", { tone }).run();
            }
          }}
          className={cn(
            "h-5 w-5 rounded-full border transition-transform hover:scale-110",
            HIGHLIGHT_SWATCHES[tone],
            editor.isActive("highlightTone", { tone })
              ? "border-ink ring-2 ring-engraving"
              : "border-line-strong",
          )}
        />
      ))}

      <Divider />

      <span className="px-1 font-utility text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        Text
      </span>
      {TEXT_TONES.map(({ tone, label, swatch }) => (
        <button
          key={tone}
          type="button"
          aria-label={label}
          aria-pressed={editor.isActive("textTone", { tone })}
          title={label}
          onClick={() => {
            if (editor.isActive("textTone", { tone })) {
              chain().unsetMark("textTone").run();
            } else {
              chain().setMark("textTone", { tone }).run();
            }
          }}
          className={cn(
            "h-5 w-5 rounded-full border transition-transform hover:scale-110",
            swatch,
            editor.isActive("textTone", { tone })
              ? "border-ink ring-2 ring-engraving"
              : "border-line-strong",
          )}
        />
      ))}

      <Divider />

      <ToolButton
        label="Clear formatting"
        onClick={() => chain().unsetAllMarks().clearNodes().run()}
      >
        ⌫
      </ToolButton>
      <ToolButton
        label="Undo"
        disabled={!editor.can().undo()}
        onClick={() => chain().undo().run()}
      >
        ↶
      </ToolButton>
      <ToolButton
        label="Redo"
        disabled={!editor.can().redo()}
        onClick={() => chain().redo().run()}
      >
        ↷
      </ToolButton>
    </div>
  );
}
