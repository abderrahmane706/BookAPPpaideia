import { library } from "@/lib/services/library/store";
import type { RichTextDoc, Summary } from "@/lib/types/library";

/** Summary (personal book summary) service boundary. */
export interface SummariesService {
  get(bookId: string): Promise<Summary | null>;
  save(
    bookId: string,
    content: RichTextDoc | null,
    plainText: string,
  ): Promise<Summary | null>;
}

export function getSummariesService(): SummariesService {
  return {
    async get(bookId) {
      return library.getSummary(bookId);
    },
    async save(bookId, content, plainText) {
      return library.saveSummary(bookId, content, plainText);
    },
  };
}
