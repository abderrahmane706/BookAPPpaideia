import { library } from "@/lib/services/library/store";
import type { Quote, QuoteHighlight } from "@/lib/types/library";

export interface QuoteInput {
  text: string;
  page?: number | null;
  highlight?: QuoteHighlight;
  annotation?: string | null;
}

/** Quotations / highlights service boundary. */
export interface QuotesService {
  list(bookId: string): Promise<Quote[]>;
  create(bookId: string, input: QuoteInput): Promise<Quote | null>;
  update(id: string, patch: Partial<QuoteInput>): Promise<Quote | null>;
  remove(id: string): Promise<boolean>;
}

export function getQuotesService(): QuotesService {
  return {
    async list(bookId) {
      return library.listQuotes(bookId);
    },
    async create(bookId, input) {
      return library.createQuote(bookId, input);
    },
    async update(id, patch) {
      return library.updateQuote(id, patch);
    },
    async remove(id) {
      return library.deleteQuote(id);
    },
  };
}
