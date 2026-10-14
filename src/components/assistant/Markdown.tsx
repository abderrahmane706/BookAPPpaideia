"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface MarkdownProps {
  content: string;
  className?: string;
  /** When set, "[n]" citations link to `#{prefix}-source-{n}`. */
  citationPrefix?: string;
}

function sanitizeUrl(raw: string): string | null {
  const url = raw.trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return null;
}

const INLINE_PATTERN =
  /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\d+\])/g;

/** Render inline emphasis, code, links and [n] citations as React nodes. */
function renderInline(
  text: string,
  keyPrefix: string,
  citationPrefix?: string,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;
  INLINE_PATTERN.lastIndex = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-i${index++}`;

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={key}
          className="rounded-radius-sm bg-engraving/8 px-1 py-0.5 font-utility text-[0.85em] text-engraving-deep"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const href = link ? sanitizeUrl(link[2]) : null;
      if (link && href) {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-engraving-deep underline decoration-line-strong underline-offset-2 hover:decoration-engraving"
          >
            {link[1]}
          </a>,
        );
      } else if (link) {
        nodes.push(<Fragment key={key}>{link[1]}</Fragment>);
      }
    } else if (token.startsWith("[")) {
      const number = /^\[(\d+)\]$/.exec(token)?.[1] ?? "";
      nodes.push(
        citationPrefix ? (
          <a
            key={key}
            href={`#${citationPrefix}-source-${number}`}
            className="ml-0.5 align-super font-utility text-[0.65em] text-engraving hover:text-engraving-deep"
          >
            [{number}]
          </a>
        ) : (
          <sup key={key} className="text-engraving/80">
            [{number}]
          </sup>
        ),
      );
    }

    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/**
 * Markdown — a deliberately small renderer for assistant replies.
 *
 * It supports only what the assistant is instructed to produce — paragraphs,
 * bullet/numbered lists, headings, bold/italic, inline code and links — and
 * renders to React nodes (never `dangerouslySetInnerHTML`). Link URLs are
 * restricted to http(s) and app-relative paths, so a reply can never inject a
 * `javascript:` or `data:` URL.
 */
export function Markdown({ content, className, citationPrefix }: MarkdownProps) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let key = 0;
  let i = 0;

  const isBlockStart = (line: string): boolean =>
    /^#{1,6}\s/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line);

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const text = line.replace(/^#{1,6}\s/, "");
      blocks.push(
        <p
          key={`b${key++}`}
          className="mt-3 font-editorial text-base font-semibold text-ink"
        >
          {renderInline(text, `h${key}`, citationPrefix)}
        </p>,
      );
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      const listKey = `ul${key++}`;
      blocks.push(
        <ul key={listKey} className="ml-4 list-disc space-y-1">
          {items.map((item, n) => (
            <li key={`${listKey}-${n}`} className="pl-1">
              {renderInline(item, `${listKey}-${n}`, citationPrefix)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      const listKey = `ol${key++}`;
      blocks.push(
        <ol key={listKey} className="ml-4 list-decimal space-y-1">
          {items.map((item, n) => (
            <li key={`${listKey}-${n}`} className="pl-1">
              {renderInline(item, `${listKey}-${n}`, citationPrefix)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraph: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !isBlockStart(lines[i])
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={`p${key++}`} className="whitespace-pre-wrap">
        {renderInline(paragraph.join(" "), `p${key}`, citationPrefix)}
      </p>,
    );
  }

  return <div className={cn("space-y-2", className)}>{blocks}</div>;
}
