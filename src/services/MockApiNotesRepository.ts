import { parseNotes } from '../domain/noteSchema';
import type { Note } from '../domain/types';
import { readNotes } from './LocalStorageNotesRepository';
import type { KeyValueStorage, NotesRepository } from './NotesRepository';

export const MOCK_API_STORAGE_KEY = 'sticky-notes/mock-api/v1';

export interface MockApiOptions {
  storage: KeyValueStorage;
  latencyMs?: readonly [min: number, max: number];
  failureRate?: number;
  random?: () => number;
}

export class MockApiNotesRepository implements NotesRepository {
  private readonly storage: KeyValueStorage;
  private readonly latencyMs: readonly [number, number];
  private readonly failureRate: number;
  private readonly random: () => number;

  constructor({ storage, latencyMs = [250, 700], failureRate = 0, random = Math.random }: MockApiOptions) {
    this.storage = storage;
    this.latencyMs = latencyMs;
    this.failureRate = failureRate;
    this.random = random;
  }

  load(): Promise<Note[]> {
    return this.request('GET /api/notes', () => readNotes(this.storage, MOCK_API_STORAGE_KEY));
  }

  save(notes: Note[]): Promise<void> {
    const body = JSON.stringify(notes);
    return this.request('PUT /api/notes', () => {
      this.storage.setItem(MOCK_API_STORAGE_KEY, JSON.stringify(parseNotes(JSON.parse(body))));
    });
  }

  private request<T>(endpoint: string, handler: () => T): Promise<T> {
    const [min, max] = this.latencyMs;
    const delay = min + this.random() * (max - min);

    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (this.random() < this.failureRate) {
          reject(new Error(`${endpoint} failed: simulated network error`));
          return;
        }
        try {
          resolve(handler());
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }
}
