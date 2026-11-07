import type { Note, NoteColor, Point, Rect, Size } from './types';

export type NotesAction =
  | { type: 'hydrate'; notes: Note[] }
  | { type: 'create'; id: string; rect: Rect; color: NoteColor }
  | { type: 'move'; id: string; position: Point }
  | { type: 'resize'; id: string; size: Size }
  | { type: 'updateText'; id: string; text: string }
  | { type: 'changeColor'; id: string; color: NoteColor }
  | { type: 'bringToFront'; id: string }
  | { type: 'remove'; id: string };

export function notesReducer(notes: Note[], action: NotesAction): Note[] {
  switch (action.type) {
    case 'hydrate':
      return action.notes;

    case 'create':
      return [
        ...notes,
        {
          id: action.id,
          x: action.rect.x,
          y: action.rect.y,
          width: action.rect.width,
          height: action.rect.height,
          text: '',
          color: action.color,
          zIndex: topZIndex(notes) + 1,
        },
      ];

    case 'move':
      return updateNote(notes, action.id, { x: action.position.x, y: action.position.y });

    case 'resize':
      return updateNote(notes, action.id, {
        width: action.size.width,
        height: action.size.height,
      });

    case 'updateText':
      return updateNote(notes, action.id, { text: action.text });

    case 'changeColor':
      return updateNote(notes, action.id, { color: action.color });

    case 'bringToFront':
      return bringToFront(notes, action.id);

    case 'remove': {
      const remaining = notes.filter((note) => note.id !== action.id);
      return remaining.length === notes.length ? notes : remaining;
    }
  }
}

function topZIndex(notes: Note[]): number {
  return notes.reduce((max, note) => Math.max(max, note.zIndex), 0);
}

function updateNote(notes: Note[], id: string, changes: Partial<Omit<Note, 'id'>>): Note[] {
  let changed = false;
  const next = notes.map((note) => {
    if (note.id !== id) {
      return note;
    }
    const keys = Object.keys(changes) as (keyof typeof changes)[];
    if (keys.every((key) => note[key] === changes[key])) {
      return note;
    }
    changed = true;
    return { ...note, ...changes };
  });
  return changed ? next : notes;
}

function bringToFront(notes: Note[], id: string): Note[] {
  const target = notes.find((note) => note.id === id);
  if (!target) {
    return notes;
  }

  const isAlreadyOnTop = notes.every((note) => note.id === id || note.zIndex < target.zIndex);
  if (isAlreadyOnTop) {
    return notes;
  }

  const stack = notes
    .filter((note) => note.id !== id)
    .sort((a, b) => a.zIndex - b.zIndex)
    .concat(target);
  const zIndexById = new Map(stack.map((note, index) => [note.id, index + 1]));

  return notes.map((note) => {
    const zIndex = zIndexById.get(note.id) ?? note.zIndex;
    return zIndex === note.zIndex ? note : { ...note, zIndex };
  });
}
