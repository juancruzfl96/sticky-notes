import { parseNotes } from '../domain/noteSchema';
import type { Note } from '../domain/types';
import type { KeyValueStorage, NotesRepository } from './NotesRepository';

export const LOCAL_STORAGE_KEY = 'sticky-notes/v1';

export class LocalStorageNotesRepository implements NotesRepository {
  private readonly storage: KeyValueStorage;
  private readonly key: string;

  constructor(storage: KeyValueStorage, key: string = LOCAL_STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
  }

  async load(): Promise<Note[]> {
    return readNotes(this.storage, this.key);
  }

  async save(notes: Note[]): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(notes));
  }
}

export function readNotes(storage: KeyValueStorage, key: string): Note[] {
  const raw = storage.getItem(key);
  if (!raw) {
    return [];
  }
  try {
    return parseNotes(JSON.parse(raw));
  } catch {
    console.warn(`Ignoring unreadable notes stored under "${key}".`);
    return [];
  }
}
