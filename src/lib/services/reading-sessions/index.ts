import { library } from "@/lib/services/library/store";
import type { ReadingSession } from "@/lib/types/library";

export interface SessionInput {
  date: string;
  minutes: number;
  pages?: number | null;
  note?: string | null;
}

/** Reading-sessions service boundary. */
export interface ReadingSessionsService {
  list(bookId: string): Promise<ReadingSession[]>;
  create(bookId: string, input: SessionInput): Promise<ReadingSession | null>;
  update(id: string, patch: Partial<SessionInput>): Promise<ReadingSession | null>;
  remove(id: string): Promise<boolean>;
}

export function getReadingSessionsService(): ReadingSessionsService {
  return {
    async list(bookId) {
      return library.listSessions(bookId);
    },
    async create(bookId, input) {
      return library.createSession(bookId, input);
    },
    async update(id, patch) {
      return library.updateSession(id, patch);
    },
    async remove(id) {
      return library.deleteSession(id);
    },
  };
}
