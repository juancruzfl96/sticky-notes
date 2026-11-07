import type { NoteColor, Size } from './types';

export const NOTE_COLORS: readonly NoteColor[] = ['yellow', 'green', 'pink', 'blue'];

export const DEFAULT_NOTE_COLOR: NoteColor = 'yellow';

export const MIN_NOTE_SIZE: Size = { width: 120, height: 90 };

export const DEFAULT_NOTE_SIZE: Size = { width: 200, height: 160 };

export const CLICK_THRESHOLD_PX = 8;
