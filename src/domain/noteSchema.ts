import { NOTE_COLORS } from './constants';
import type { Note } from './types';

const VALID_COLORS = new Set<string>(NOTE_COLORS);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.text === 'string' &&
    typeof candidate.color === 'string' &&
    VALID_COLORS.has(candidate.color) &&
    isFiniteNumber(candidate.x) &&
    isFiniteNumber(candidate.y) &&
    isFiniteNumber(candidate.width) &&
    isFiniteNumber(candidate.height) &&
    isFiniteNumber(candidate.zIndex)
  );
}

export function parseNotes(value: unknown): Note[] {
  return Array.isArray(value) ? value.filter(isNote) : [];
}
