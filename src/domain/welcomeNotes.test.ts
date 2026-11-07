import { describe, expect, it } from 'vitest';
import { fitRectInBounds } from './geometry';
import { createWelcomeNotes } from './welcomeNotes';

function makeIds() {
  let next = 0;
  return () => `id-${next++}`;
}

describe('createWelcomeNotes', () => {
  const desktop = { width: 1024, height: 768 };
  const phone = { width: 375, height: 812 };

  it('creates three notes with unique ids and increasing z-indexes', () => {
    const notes = createWelcomeNotes(desktop, makeIds());
    expect(notes.map((note) => note.id)).toEqual(['id-0', 'id-1', 'id-2']);
    expect(notes.map((note) => note.zIndex)).toEqual([1, 2, 3]);
    expect(notes.every((note) => note.text.length > 0)).toBe(true);
  });

  it('lays the notes out in a row on desktop', () => {
    const notes = createWelcomeNotes(desktop, makeIds());
    expect(new Set(notes.map((note) => note.y)).size).toBe(1);
  });

  it('stacks the notes vertically on a phone without overlapping', () => {
    const notes = createWelcomeNotes(phone, makeIds());
    for (let i = 1; i < notes.length; i++) {
      const previous = notes[i - 1]!;
      expect(notes[i]!.y).toBeGreaterThanOrEqual(previous.y + previous.height);
    }
  });

  it.each([desktop, phone])('keeps every note inside a %o board', (bounds) => {
    for (const note of createWelcomeNotes(bounds, makeIds())) {
      const rect = { x: note.x, y: note.y, width: note.width, height: note.height };
      expect(fitRectInBounds(rect, bounds)).toEqual(rect);
    }
  });
});
