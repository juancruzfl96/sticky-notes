import { describe, expect, it } from 'vitest';
import { MIN_NOTE_SIZE } from './constants';
import {
  clampPosition,
  clampSize,
  draftRectFromDrag,
  fitRectInBounds,
  isPointInRect,
  rectFromPoints,
  spawnRect,
} from './geometry';

const bounds = { width: 1000, height: 700 };

describe('rectFromPoints', () => {
  it('builds the same rect regardless of drag direction', () => {
    const expected = { x: 10, y: 20, width: 90, height: 60 };
    expect(rectFromPoints({ x: 10, y: 20 }, { x: 100, y: 80 })).toEqual(expected);
    expect(rectFromPoints({ x: 100, y: 80 }, { x: 10, y: 20 })).toEqual(expected);
  });
});

describe('isPointInRect', () => {
  const rect = { x: 0, y: 0, width: 10, height: 10 };

  it('includes the edges', () => {
    expect(isPointInRect({ x: 10, y: 10 }, rect)).toBe(true);
  });

  it('excludes points outside', () => {
    expect(isPointInRect({ x: 11, y: 5 }, rect)).toBe(false);
  });
});

describe('clampPosition', () => {
  it('keeps the element fully inside the bounds', () => {
    expect(clampPosition({ x: -50, y: 900 }, { width: 200, height: 100 }, bounds)).toEqual({ x: 0, y: 600 });
  });
});

describe('clampSize', () => {
  it('enforces the minimum size', () => {
    expect(clampSize({ width: 10, height: 10 }, { x: 0, y: 0 }, bounds)).toEqual(MIN_NOTE_SIZE);
  });

  it('does not let the element overflow the bounds', () => {
    expect(clampSize({ width: 500, height: 500 }, { x: 800, y: 400 }, bounds)).toEqual({ width: 200, height: 300 });
  });
});

describe('fitRectInBounds', () => {
  it('leaves a rect that already fits untouched', () => {
    const rect = { x: 100, y: 100, width: 200, height: 150 };
    expect(fitRectInBounds(rect, bounds)).toEqual(rect);
  });

  it('shrinks rects bigger than the bounds and shifts them inside', () => {
    expect(fitRectInBounds({ x: 300, y: 300, width: 2000, height: 100 }, bounds)).toEqual({
      x: 0,
      y: 300,
      width: 1000,
      height: 100,
    });
  });
});

describe('draftRectFromDrag', () => {
  it('returns null for a click (tiny pointer travel)', () => {
    expect(draftRectFromDrag({ x: 100, y: 100 }, { x: 103, y: 102 }, bounds)).toBeNull();
  });

  it('applies the minimum size to small drags', () => {
    expect(draftRectFromDrag({ x: 100, y: 100 }, { x: 120, y: 110 }, bounds)).toEqual({
      x: 100,
      y: 100,
      ...MIN_NOTE_SIZE,
    });
  });
});

describe('spawnRect', () => {
  it('cascades consecutive notes so they do not fully overlap', () => {
    const size = { width: 200, height: 160 };
    const first = spawnRect(size, bounds, 0);
    const second = spawnRect(size, bounds, 1);
    expect(second.x - first.x).toBe(24);
    expect(second.y - first.y).toBe(24);
  });
});
