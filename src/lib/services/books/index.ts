import type { Book, BookCreateInput, BookUpdateInput } from "@/lib/types/book";
import { library } from "@/lib/services/library/store";

/**
 * Books service — a promise-based facade over the library store.
 *
 * Retained as the documented boundary for book operations so call-sites and any
 * future server-backed implementation share one contract. The reactive hooks in
 * `@/lib/services/library` are the preferred path inside components; this facade
 * exists for imperative/one-shot use and for the async repository shape.
 */

export type CreateBookInput = BookCreateInput;
export type UpdateBookInput = BookUpdateInput;

export interface BooksService {
  listBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | null>;
  createBook(input: BookCreateInput): Promise<Book>;
  updateBook(id: string, input: BookUpdateInput): Promise<Book | null>;
  deleteBook(id: string): Promise<boolean>;
}

export function getBooksService(): BooksService {
  return {
    async listBooks() {
      return library.listBooks();
    },
    async getBook(id) {
      return library.getBook(id);
    },
    async createBook(input) {
      return library.createBook(input);
    },
    async updateBook(id, input) {
      return library.updateBook(id, input);
    },
    async deleteBook(id) {
      return library.deleteBook(id);
    },
  };
}
