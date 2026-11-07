import { describe, expect, it } from 'vitest';
import { notesReducer } from './notesReducer';
import type { Note } from './types';

function makeNote(id: string, zIndex: number, overrides: Partial<Note> = {}): Note {
  return { id, x: 0, y: 0, width: 200, height: 150, text: '', color: 'yellow', zIndex, ...overrides };
}

describe('notesReducer', () => {
  it('creates a note on top of the existing ones', () => {
    const notes = [makeNote('a', 1), makeNote('b', 5)];
    const next = notesReducer(notes, {
      type: 'create',
      id: 'c',
      rect: { x: 10, y: 20, width: 150, height: 120 },
      color: 'pink',
    });

    expect(next).toHaveLength(3);
    expect(next[2]).toEqual({
      id: 'c',
      x: 10,
      y: 20,
      width: 150,
      height: 120,
      text: '',
      color: 'pink',
      zIndex: 6,
    });
  });

  it('moves, resizes, edits text and recolors a note', () => {
    let notes = [makeNote('a', 1)];
    notes = notesReducer(notes, { type: 'move', id: 'a', position: { x: 50, y: 60 } });
    notes = notesReducer(notes, { type: 'resize', id: 'a', size: { width: 300, height: 250 } });
    notes = notesReducer(notes, { type: 'updateText', id: 'a', text: 'Hello' });
    notes = notesReducer(notes, { type: 'changeColor', id: 'a', color: 'blue' });

    expect(notes[0]).toMatchObject({ x: 50, y: 60, width: 300, height: 250, text: 'Hello', color: 'blue' });
  });

  it('returns the same array when an action changes nothing', () => {
    const notes = [makeNote('a', 1, { x: 10, y: 10 })];
    expect(notesReducer(notes, { type: 'move', id: 'a', position: { x: 10, y: 10 } })).toBe(notes);
    expect(notesReducer(notes, { type: 'move', id: 'missing', position: { x: 1, y: 1 } })).toBe(notes);
    expect(notesReducer(notes, { type: 'remove', id: 'missing' })).toBe(notes);
  });

  it('removes a note', () => {
    const notes = [makeNote('a', 1), makeNote('b', 2)];
    expect(notesReducer(notes, { type: 'remove', id: 'a' }).map((note) => note.id)).toEqual(['b']);
  });

  describe('bringToFront', () => {
    it('raises the note and renumbers z-indexes as 1..n', () => {
      const notes = [makeNote('a', 3), makeNote('b', 10), makeNote('c', 7)];
      const next = notesReducer(notes, { type: 'bringToFront', id: 'a' });
      const zIndexById = Object.fromEntries(next.map((note) => [note.id, note.zIndex]));

      expect(zIndexById).toEqual({ c: 1, b: 2, a: 3 });
    });

    it('is a no-op when the note is already on top', () => {
      const notes = [makeNote('a', 1), makeNote('b', 2)];
      expect(notesReducer(notes, { type: 'bringToFront', id: 'b' })).toBe(notes);
    });

    it('breaks ties when several notes share the top z-index', () => {
      const notes = [makeNote('a', 2), makeNote('b', 2)];
      const next = notesReducer(notes, { type: 'bringToFront', id: 'a' });
      expect(next.find((note) => note.id === 'a')?.zIndex).toBe(2);
      expect(next.find((note) => note.id === 'b')?.zIndex).toBe(1);
    });
  });
});
