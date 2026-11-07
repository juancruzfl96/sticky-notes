import { describe, expect, it } from 'vitest';
import { parseNotes } from './noteSchema';

const validNote = { id: 'a', x: 1, y: 2, width: 200, height: 150, text: 'Hi', color: 'green', zIndex: 1 };

describe('parseNotes', () => {
  it('keeps valid notes', () => {
    expect(parseNotes([validNote])).toEqual([validNote]);
  });

  it('drops invalid entries', () => {
    expect(
      parseNotes([
        validNote,
        { ...validNote, id: 'b', color: 'purple' },
        { ...validNote, id: 'c', x: Number.NaN },
        { ...validNote, id: 'd', text: undefined },
        null,
        'note',
      ]),
    ).toEqual([validNote]);
  });

  it('returns an empty list for anything that is not an array', () => {
    expect(parseNotes({ notes: [validNote] })).toEqual([]);
    expect(parseNotes(null)).toEqual([]);
  });
});
