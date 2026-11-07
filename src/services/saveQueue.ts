export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export interface SaveQueue<T> {
  enqueue(snapshot: T): Promise<void>;
}

// One save in flight at a time; only the latest pending snapshot is sent next,
// so a slow older request can never overwrite newer data.
export function createSaveQueue<T>(
  save: (snapshot: T) => Promise<void>,
  onStatusChange: (status: SaveStatus) => void,
): SaveQueue<T> {
  let inFlight = false;
  let pending: { snapshot: T } | null = null;

  async function run(snapshot: T): Promise<void> {
    inFlight = true;
    onStatusChange('saving');

    let failed = false;
    try {
      await save(snapshot);
    } catch {
      failed = true;
    }
    inFlight = false;

    if (pending) {
      const next = pending.snapshot;
      pending = null;
      return run(next);
    }
    onStatusChange(failed ? 'failed' : 'saved');
  }

  return {
    enqueue(snapshot) {
      if (inFlight) {
        pending = { snapshot };
        return Promise.resolve();
      }
      return run(snapshot);
    },
  };
}
