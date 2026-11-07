import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '../domain/types';
import { LOCAL_STORAGE_KEY, LocalStorageNotesRepository } from './LocalStorageNotesRepository';
import { MockApiNotesRepository } from './MockApiNotesRepository';
import type { KeyValueStorage } from './NotesRepository';

class MemoryStorage implements KeyValueStorage {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const note: Note = { id: 'a', x: 1, y: 2, width: 200, height: 150, text: 'Hi', color: 'yellow', zIndex: 1 };

describe('LocalStorageNotesRepository', () => {
  it('round-trips notes', async () => {
    const repository = new LocalStorageNotesRepository(new MemoryStorage());
    await repository.save([note]);
    expect(await repository.load()).toEqual([note]);
  });

  it('returns an empty board when nothing is stored', async () => {
    expect(await new LocalStorageNotesRepository(new MemoryStorage()).load()).toEqual([]);
  });

  it('ignores corrupted data instead of failing', async () => {
    const storage = new MemoryStorage();
    storage.setItem(LOCAL_STORAGE_KEY, '{not json');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await new LocalStorageNotesRepository(storage).load()).toEqual([]);
  });
});

describe('MockApiNotesRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves asynchronously, after the simulated latency', async () => {
    const repository = new MockApiNotesRepository({
      storage: new MemoryStorage(),
      latencyMs: [100, 100],
    });

    let saved = false;
    void repository.save([note]).then(() => {
      saved = true;
    });

    await vi.advanceTimersByTimeAsync(99);
    expect(saved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(saved).toBe(true);

    const loading = repository.load();
    await vi.advanceTimersByTimeAsync(100);
    expect(await loading).toEqual([note]);
  });

  it('does not share object references with the caller', async () => {
    const repository = new MockApiNotesRepository({ storage: new MemoryStorage(), latencyMs: [0, 0] });
    const notes = [{ ...note }];

    const saving = repository.save(notes);
    await vi.runAllTimersAsync();
    await saving;
    notes[0]!.text = 'mutated after save';

    const loading = repository.load();
    await vi.runAllTimersAsync();
    expect((await loading)[0]?.text).toBe('Hi');
  });

  it('rejects with a simulated network error according to the failure rate', async () => {
    const repository = new MockApiNotesRepository({
      storage: new MemoryStorage(),
      latencyMs: [0, 0],
      failureRate: 0.5,
      random: () => 0.1,
    });

    const loading = repository.load();
    const assertion = expect(loading).rejects.toThrow('simulated network error');
    await vi.runAllTimersAsync();
    await assertion;
  });
});
