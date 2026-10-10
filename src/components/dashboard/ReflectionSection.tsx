import { SectionHeader } from "@/components/ui/SectionHeader";

/**
 * The five structural reflection prompts. Placeholder copy only — the writing
 * surface itself arrives with the reflection phase (no editor in this phase).
 */
const REFLECTION_PROMPTS = [
  {
    id: "teach",
    question: "What did this book teach you?",
    hint: "The single lesson you would carry forward.",
  },
  {
    id: "key-idea",
    question: "Key idea",
    hint: "The argument in one sentence, in your own words.",
  },
  {
    id: "favorite-insight",
    question: "Favorite insight",
    hint: "The passage or thought you will return to.",
  },
  {
    id: "apply",
    question: "How will you apply it?",
    hint: "Where this reading meets your life.",
  },
  {
    id: "personal",
    question: "Personal reflection",
    hint: "Anything else the pages called up in you.",
  },
];

/**
 * Chapter V — Reflection.
 * Structural placeholders for the five prompts: quiet, on-brand invitation
 * cards that reserve the layout without fabricating a text editor.
 */
export function ReflectionSection() {
  return (
    <section aria-labelledby="reflection-title">
      <SectionHeader
        eyebrow="Commonplace"
        title="Your reflections"
        description="Prompts for the margins of your reading."
      />

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REFLECTION_PROMPTS.map((prompt) => (
          <li
            key={prompt.id}
            className="flex flex-col gap-2 rounded-radius-md border border-line bg-surface p-5 shadow-card"
          >
            <span
              aria-hidden
              className="greek-diamond"
            />
            <h3 className="font-display text-lg font-semibold leading-snug text-ink">
              {prompt.question}
            </h3>
            <p className="text-sm leading-relaxed text-ink-soft">{prompt.hint}</p>
            <div className="mt-auto border-t border-line/70 pt-3">
              <span className="font-utility text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                Awaiting your first entry
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
