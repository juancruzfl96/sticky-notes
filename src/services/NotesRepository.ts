import type { Note } from '../domain/types';

export interface NotesRepository {
  load(): Promise<Note[]>;
  save(notes: Note[]): Promise<void>;
}

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;
