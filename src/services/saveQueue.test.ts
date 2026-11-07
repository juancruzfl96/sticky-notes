import { describe, expect, it, vi } from 'vitest';
import { createSaveQueue, type SaveStatus } from './saveQueue';

function controllableSave() {
  const calls: { snapshot: string; resolve: () => void; reject: (error: Error) => void }[] = [];
  const save = vi.fn(
    (snapshot: string) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ snapshot, resolve, reject });
      }),
  );
  return { save, calls };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createSaveQueue', () => {
  it('reports saving and then saved', async () => {
    const statuses: SaveStatus[] = [];
    const queue = createSaveQueue(async () => {}, (status) => statuses.push(status));

    await queue.enqueue('v1');

    expect(statuses).toEqual(['saving', 'saved']);
  });

  it('never runs two saves at once and only sends the latest pending snapshot', async () => {
    const { save, calls } = controllableSave();
    const queue = createSaveQueue(save, () => {});

    void queue.enqueue('v1');
    void queue.enqueue('v2');
    void queue.enqueue('v3');
    expect(save).toHaveBeenCalledTimes(1);

    calls[0]?.resolve();
    await flush();

    expect(save).toHaveBeenCalledTimes(2);
    expect(calls.map((call) => call.snapshot)).toEqual(['v1', 'v3']);
  });

  it('reports a failure when the last save fails', async () => {
    const statuses: SaveStatus[] = [];
    const queue = createSaveQueue(
      () => Promise.reject(new Error('offline')),
      (status) => statuses.push(status),
    );

    await queue.enqueue('v1');

    expect(statuses).toEqual(['saving', 'failed']);
  });

  it('a newer snapshot supersedes a failed save', async () => {
    const { save, calls } = controllableSave();
    const statuses: SaveStatus[] = [];
    const queue = createSaveQueue(save, (status) => statuses.push(status));

    void queue.enqueue('v1');
    void queue.enqueue('v2');
    calls[0]?.reject(new Error('offline'));
    await flush();
    calls[1]?.resolve();
    await flush();

    expect(statuses.at(-1)).toBe('saved');
  });
});
