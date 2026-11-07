import { CLICK_THRESHOLD_PX, MIN_NOTE_SIZE } from './constants';
import type { Point, Rect, Size } from './types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function rectFromPoints(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function clampPosition(position: Point, size: Size, bounds: Size): Point {
  return {
    x: clamp(position.x, 0, Math.max(0, bounds.width - size.width)),
    y: clamp(position.y, 0, Math.max(0, bounds.height - size.height)),
  };
}

export function clampSize(
  size: Size,
  position: Point,
  bounds: Size,
  min: Size = MIN_NOTE_SIZE,
): Size {
  return {
    width: clamp(size.width, min.width, Math.max(min.width, bounds.width - position.x)),
    height: clamp(size.height, min.height, Math.max(min.height, bounds.height - position.y)),
  };
}

export function fitRectInBounds(rect: Rect, bounds: Size, min: Size = MIN_NOTE_SIZE): Rect {
  const size = {
    width: clamp(rect.width, min.width, Math.max(min.width, bounds.width)),
    height: clamp(rect.height, min.height, Math.max(min.height, bounds.height)),
  };
  return { ...clampPosition(rect, size, bounds), ...size };
}

export function draftRectFromDrag(origin: Point, current: Point, bounds: Size): Rect | null {
  if (distance(origin, current) < CLICK_THRESHOLD_PX) {
    return null;
  }
  return fitRectInBounds(rectFromPoints(origin, current), bounds);
}

export function spawnRect(size: Size, bounds: Size, index: number): Rect {
  const cascade = (index % 6) * 24;
  return fitRectInBounds(
    {
      x: (bounds.width - size.width) / 2 + cascade,
      y: (bounds.height - size.height) / 3 + cascade,
      ...size,
    },
    bounds,
  );
}
