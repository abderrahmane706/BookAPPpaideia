import { library } from "@/lib/services/library/store";
import type { Note } from "@/lib/types/library";

export interface NoteInput {
  title?: string | null;
  body: string;
  tags?: string[];
}

/** Notes service boundary. */
export interface NotesService {
  list(bookId: string): Promise<Note[]>;
  create(bookId: string, input: NoteInput): Promise<Note | null>;
  update(id: string, patch: Partial<NoteInput>): Promise<Note | null>;
  remove(id: string): Promise<boolean>;
}

export function getNotesService(): NotesService {
  return {
    async list(bookId) {
      return library.listNotes(bookId);
    },
    async create(bookId, input) {
      return library.createNote(bookId, input);
    },
    async update(id, patch) {
      return library.updateNote(id, patch);
    },
    async remove(id) {
      return library.deleteNote(id);
    },
  };
}
