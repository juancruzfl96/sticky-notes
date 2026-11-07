import { clamp } from '../domain/geometry';
import { LocalStorageNotesRepository } from './LocalStorageNotesRepository';
import { MockApiNotesRepository } from './MockApiNotesRepository';
import type { NotesRepository } from './NotesRepository';

export function createNotesRepository(search: string = window.location.search): NotesRepository {
  const params = new URLSearchParams(search);

  if (params.get('storage') === 'local') {
    return new LocalStorageNotesRepository(window.localStorage);
  }

  const failureRate = Number(params.get('failureRate') ?? 0);
  return new MockApiNotesRepository({
    storage: window.localStorage,
    failureRate: Number.isFinite(failureRate) ? clamp(failureRate, 0, 1) : 0,
  });
}
