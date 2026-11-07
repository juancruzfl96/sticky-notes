import { fitRectInBounds } from './geometry';
import type { Note, NoteColor, Size } from './types';

const WELCOME_CONTENT: readonly { text: string; color: NoteColor }[] = [
  { text: 'Welcome! Draw on an empty spot to create a note, or press +.', color: 'yellow' },
  { text: 'Drag the top bar to move a note. Drop it on the trash to delete it.', color: 'green' },
  { text: 'Resize from the bottom-right corner. Pick a color with the dots on top.', color: 'pink' },
];

const NOTE_SIZE: Size = { width: 220, height: 170 };
const GAP = 24;
const TOP_OFFSET = 72;

export function createWelcomeNotes(bounds: Size, makeId: () => string): Note[] {
  const count = WELCOME_CONTENT.length;
  const rowWidth = count * NOTE_SIZE.width + (count - 1) * GAP;
  const fitsInRow = rowWidth + 2 * GAP <= bounds.width;

  return WELCOME_CONTENT.map(({ text, color }, index) => {
    const rect = fitsInRow
      ? {
          x: (bounds.width - rowWidth) / 2 + index * (NOTE_SIZE.width + GAP),
          y: Math.max(TOP_OFFSET, (bounds.height - NOTE_SIZE.height) / 3),
          ...NOTE_SIZE,
        }
      : {
          x: GAP,
          y: TOP_OFFSET + index * (NOTE_SIZE.height + GAP / 2),
          width: Math.min(NOTE_SIZE.width + 40, bounds.width - 2 * GAP),
          height: NOTE_SIZE.height,
        };
    return { id: makeId(), ...fitRectInBounds(rect, bounds), text, color, zIndex: index + 1 };
  });
}
