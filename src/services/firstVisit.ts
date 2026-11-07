import type { KeyValueStorage } from './NotesRepository';

export const WELCOME_SEEN_KEY = 'sticky-notes/welcome-seen';

export function consumeFirstVisit(storage: KeyValueStorage): boolean {
  try {
    if (storage.getItem(WELCOME_SEEN_KEY)) {
      return false;
    }
    storage.setItem(WELCOME_SEEN_KEY, '1');
    return true;
  } catch {
    return false;
  }
}
