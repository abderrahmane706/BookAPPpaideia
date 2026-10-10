import type { Book } from "@/lib/types/book";
import { READING_STATUS_LABELS } from "@/lib/types/book";
import type {
  BookDetail,
  Note,
  Quote,
  ReadingSession,
  RichTextDoc,
  RichTextNode,
  Summary,
} from "@/lib/types/library";

/* ------------------------------------------------------------------ */
/* Rich text  ->  Markdown                                            */
/* ------------------------------------------------------------------ */

function escapeText(text: string): string {
  return text.replace(/([\\`*_[\]#])/g, "\\$1");
}

function applyMarks(text: string, marks: RichTextNode["marks"]): string {
  if (!marks || marks.length === 0) return text;
  let out = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        out = `**${out}**`;
        break;
      case "italic":
        out = `*${out}*`;
        break;
      case "code":
        out = `\`${out}\``;
        break;
      case "strike":
        out = `~~${out}~~`;
        break;
      case "highlight":
        out = `==${out}==`;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
        out = href ? `[${out}](${href})` : out;
        break;
      }
      default:
        break;
    }
  }
  return out;
}

function renderInline(nodes: RichTextNode[] = []): string {
  return nodes
    .map((node) => {
      if (node.type === "hardBreak") return "  \n";
      if (typeof node.text === "string") {
        return applyMarks(escapeText(node.text), node.marks);
      }
      if (node.content) return renderInline(node.content);
      return "";
    })
    .join("");
}

function renderListItem(
  item: RichTextNode,
  ordered: boolean,
  index: number,
): string {
  const marker = ordered ? `${index}. ` : "- ";
  const inner = renderBlocks(item.content ?? []);
  const [first = "", ...rest] = inner.split("\n");
  const pad = " ".repeat(marker.length);
  return marker + first + rest.map((line) => `\n${pad}${line}`).join("");
}

function renderBlock(node: RichTextNode): string {
  switch (node.type) {
    case "paragraph":
      return renderInline(node.content);
    case "heading": {
      const level =
        typeof node.attrs?.level === "number" ? node.attrs.level : 1;
      return `${"#".repeat(Math.min(6, Math.max(1, level)))} ${renderInline(
        node.content,
      )}`;
    }
    case "blockquote":
      return renderBlocks(node.content ?? [])
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
    case "codeBlock": {
      const lang =
        typeof node.attrs?.language === "string" ? node.attrs.language : "";
      const code = (node.content ?? []).map((c) => c.text ?? "").join("");
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }
    case "horizontalRule":
      return "---";
    case "bulletList":
      return (node.content ?? [])
        .map((item) => renderListItem(item, false, 1))
        .join("\n");
    case "orderedList":
      return (node.content ?? [])
        .map((item, i) => renderListItem(item, true, i + 1))
        .join("\n");
    case "doc":
      return renderBlocks(node.content ?? []);
    default:
      return node.content ? renderBlocks(node.content) : renderInline([node]);
  }
}

function renderBlocks(nodes: RichTextNode[] = []): string {
  return nodes
    .map(renderBlock)
    .filter((block) => block.trim().length > 0)
    .join("\n\n");
}

/** Convert a stored rich-text document to Markdown. */
export function richTextToMarkdown(doc: RichTextDoc | null): string {
  if (!doc) return "";
  return renderBlocks(doc.content ?? []).trim();
}

/* ------------------------------------------------------------------ */
/* Book  ->  Markdown                                                 */
/* ------------------------------------------------------------------ */

function section(title: string, body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  return `## ${title}\n\n${trimmed}`;
}

function bookHeader(book: Book): string {
  const lines: string[] = [`# ${book.title}`, "", `**Author:** ${book.author}`];
  if (book.category) lines.push(`**Category:** ${book.category}`);
  lines.push(`**Status:** ${READING_STATUS_LABELS[book.status]}`);
  lines.push(`**Progress:** ${book.progress}%`);
  if (book.rating !== null) lines.push(`**Rating:** ${book.rating}/5`);
  if (book.pageCount) {
    lines.push(`**Pages:** ${book.currentPage ?? 0} / ${book.pageCount}`);
  }
  if (book.publisher) lines.push(`**Publisher:** ${book.publisher}`);
  if (book.publishedYear) lines.push(`**Published:** ${book.publishedYear}`);
  if (book.language) lines.push(`**Language:** ${book.language}`);
  if (book.isbn) lines.push(`**ISBN:** ${book.isbn}`);
  if (book.tags.length > 0) lines.push(`**Tags:** ${book.tags.join(", ")}`);
  if (book.startedAt) lines.push(`**Started:** ${book.startedAt.slice(0, 10)}`);
  if (book.completedAt) {
    lines.push(`**Completed:** ${book.completedAt.slice(0, 10)}`);
  }
  return lines.join("\n");
}

function summaryMarkdown(detail: BookDetail): string {
  const { summary } = detail;
  if (!summary) return "";
  const fromDoc = richTextToMarkdown(summary.content);
  return fromDoc || summary.plainText.trim();
}

function quotesMarkdown(quotes: Quote[]): string {
  return quotes
    .map((quote) => {
      const head = `> ${quote.text.replace(/\n/g, "\n> ")}`;
      const meta = [quote.page !== null ? `p. ${quote.page}` : null, quote.annotation]
        .filter(Boolean)
        .join(" — ");
      return meta ? `${head}\n>\n> — ${meta}` : head;
    })
    .join("\n\n");
}

function notesMarkdown(notes: Note[]): string {
  return notes
    .map((note) => {
      const title = note.title ? `### ${note.title}\n\n` : "";
      const tags = note.tags.length ? `\n\n_Tags: ${note.tags.join(", ")}_` : "";
      return `${title}${note.body}${tags}`;
    })
    .join("\n\n");
}

function reviewMarkdown(book: Book): string {
  const fields: Array<[string, string | null]> = [
    ["Personal Review", book.personalReview],
    ["Key Takeaway", book.keyTakeaway],
    ["Most Important Idea", book.mostImportantIdea],
    ["Personal Application", book.personalApplication],
  ];
  return fields
    .filter(([, value]) => value && value.trim().length > 0)
    .map(([label, value]) => `### ${label}\n\n${value!.trim()}`)
    .join("\n\n");
}

function activityMarkdown(sessions: ReadingSession[]): string {
  if (sessions.length === 0) return "";
  const ordered = [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1));
  const rows = ordered.map(
    (session) =>
      `| ${session.date} | ${session.minutes} | ${session.pages ?? ""} | ${(
        session.note ?? ""
      ).replace(/\|/g, "\\|").replace(/\n/g, " ")} |`,
  );
  return [
    "| Date | Minutes | Pages | Note |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

/** Render a complete book record (with all personal material) as Markdown. */
export function bookToMarkdown(detail: BookDetail): string {
  const { book } = detail;
  const parts: string[] = [bookHeader(book)];
  parts.push(section("Summary", summaryMarkdown(detail)));
  parts.push(section("Highlights & Quotations", quotesMarkdown(detail.quotes)));
  parts.push(section("Notes", notesMarkdown(detail.notes)));
  parts.push(section("Review & Reflection", reviewMarkdown(book)));
  parts.push(section("Reading Activity", activityMarkdown(detail.sessions)));
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}

/* ------------------------------------------------------------------ */
/* Library  ->  JSON                                                  */
/* ------------------------------------------------------------------ */

export interface LibraryExportData {
  books: Book[];
  summaries: Record<string, Summary>;
  notes: Note[];
  quotes: Quote[];
  sessions: ReadingSession[];
}

/** Serialise the whole library (structured, lossless, re-importable). */
export function libraryToJson(data: LibraryExportData): string {
  return JSON.stringify(
    {
      format: "paideia.library",
      version: 1,
      exportedAt: new Date().toISOString(),
      books: data.books,
      summaries: data.summaries,
      notes: data.notes,
      quotes: data.quotes,
      sessions: data.sessions,
    },
    null,
    2,
  );
}

/* ------------------------------------------------------------------ */
/* Download helpers (client only)                                     */
/* ------------------------------------------------------------------ */

export function slugifyFilename(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return slug || "untitled";
}

/** Trigger a browser download of a text payload. */
export function downloadText(
  filename: string,
  text: string,
  mime = "text/markdown",
): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
