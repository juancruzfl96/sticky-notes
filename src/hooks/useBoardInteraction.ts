import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { clampPosition, clampSize, draftRectFromDrag, isPointInRect } from '../domain/geometry';
import type { Point, Rect, Size } from '../domain/types';

export type Interaction =
  | { kind: 'idle' }
  | { kind: 'creating'; pointerId: number; origin: Point; current: Point }
  | {
      kind: 'moving';
      pointerId: number;
      noteId: string;
      size: Size;
      grabOffset: Point;
      start: Point;
      position: Point;
      overTrash: boolean;
    }
  | {
      kind: 'resizing';
      pointerId: number;
      noteId: string;
      start: Rect;
      origin: Point;
      size: Size;
    };

const IDLE: Interaction = { kind: 'idle' };

export const DRAG_HANDLE_ATTRIBUTE = 'data-drag-handle';
export const RESIZE_HANDLE_ATTRIBUTE = 'data-resize-handle';
export const NOTE_ID_ATTRIBUTE = 'data-note-id';

interface UseBoardInteractionOptions {
  boardRef: RefObject<HTMLElement | null>;
  trashRef: RefObject<HTMLElement | null>;
  boardSize: Size | null;
  getNoteRect: (id: string) => Rect | undefined;
  onCreate: (rect: Rect) => void;
  onMove: (id: string, position: Point) => void;
  onResize: (id: string, size: Size) => void;
  onRemove: (id: string, position: Point) => void;
  onBringToFront: (id: string) => void;
}

export function useBoardInteraction({
  boardRef,
  trashRef,
  boardSize,
  getNoteRect,
  onCreate,
  onMove,
  onResize,
  onRemove,
  onBringToFront,
}: UseBoardInteractionOptions) {
  const [interaction, setInteractionState] = useState<Interaction>(IDLE);
  // Handlers read the ref: several pointer events can fire before React re-renders.
  const interactionRef = useRef<Interaction>(IDLE);

  const setInteraction = useCallback((next: Interaction) => {
    interactionRef.current = next;
    setInteractionState(next);
  }, []);

  // Uses the layout box, not getBoundingClientRect(): the zone slides in with a transform.
  const isOverTrash = (event: { clientX: number; clientY: number }): boolean => {
    const trash = trashRef.current;
    const board = boardRef.current;
    if (!trash || !board) return false;
    const point = toBoardPoint(event, board);
    return isPointInRect(point, {
      x: trash.offsetLeft,
      y: trash.offsetTop,
      width: trash.offsetWidth,
      height: trash.offsetHeight,
    });
  };

  const begin = (event: ReactPointerEvent<HTMLElement>, next: Interaction) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setInteraction(next);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (interactionRef.current.kind !== 'idle' || !event.isPrimary || event.button !== 0 || !boardSize) {
      return;
    }

    const board = event.currentTarget;
    const target = event.target as Element;
    const point = toBoardPoint(event, board);
    const noteElement = target.closest<HTMLElement>(`[${NOTE_ID_ATTRIBUTE}]`);

    if (noteElement) {
      const noteId = noteElement.getAttribute(NOTE_ID_ATTRIBUTE);
      const rect = noteId ? getNoteRect(noteId) : undefined;
      if (!noteId || !rect) return;

      onBringToFront(noteId);

      if (target.closest(`[${RESIZE_HANDLE_ATTRIBUTE}]`)) {
        begin(event, {
          kind: 'resizing',
          pointerId: event.pointerId,
          noteId,
          start: rect,
          origin: point,
          size: { width: rect.width, height: rect.height },
        });
      } else if (target.closest(`[${DRAG_HANDLE_ATTRIBUTE}]`) && !target.closest('button')) {
        begin(event, {
          kind: 'moving',
          pointerId: event.pointerId,
          noteId,
          size: { width: rect.width, height: rect.height },
          grabOffset: { x: point.x - rect.x, y: point.y - rect.y },
          start: { x: rect.x, y: rect.y },
          position: { x: rect.x, y: rect.y },
          overTrash: false,
        });
      }
      return;
    }

    if (target !== board) return;

    (document.activeElement as HTMLElement | null)?.blur();
    begin(event, { kind: 'creating', pointerId: event.pointerId, origin: point, current: point });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const current = interactionRef.current;
    if (current.kind === 'idle' || event.pointerId !== current.pointerId || !boardSize) return;

    const point = toBoardPoint(event, event.currentTarget);

    switch (current.kind) {
      case 'creating':
        setInteraction({ ...current, current: clampPoint(point, boardSize) });
        break;

      case 'moving': {
        const desired = { x: point.x - current.grabOffset.x, y: point.y - current.grabOffset.y };
        setInteraction({
          ...current,
          position: clampPosition(desired, current.size, boardSize),
          overTrash: isOverTrash(event),
        });
        break;
      }

      case 'resizing': {
        const desired = {
          width: current.start.width + (point.x - current.origin.x),
          height: current.start.height + (point.y - current.origin.y),
        };
        setInteraction({ ...current, size: clampSize(desired, current.start, boardSize) });
        break;
      }
    }
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const current = interactionRef.current;
    if (current.kind === 'idle' || event.pointerId !== current.pointerId) return;
    setInteraction(IDLE);

    switch (current.kind) {
      case 'creating': {
        const rect = boardSize && draftRectFromDrag(current.origin, current.current, boardSize);
        if (rect) onCreate(rect);
        break;
      }

      case 'moving':
        if (current.overTrash || isOverTrash(event)) {
          onRemove(current.noteId, current.position);
        } else if (current.position.x !== current.start.x || current.position.y !== current.start.y) {
          onMove(current.noteId, current.position);
        }
        break;

      case 'resizing':
        if (current.size.width !== current.start.width || current.size.height !== current.start.height) {
          onResize(current.noteId, current.size);
        }
        break;
    }
  };

  const onPointerAbort = (event: ReactPointerEvent<HTMLElement>) => {
    const current = interactionRef.current;
    if (current.kind !== 'idle' && event.pointerId === current.pointerId) {
      setInteraction(IDLE);
    }
  };

  const activePointerId = interaction.kind === 'idle' ? null : interaction.pointerId;
  useEffect(() => {
    if (activePointerId === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const board = boardRef.current;
      if (board?.hasPointerCapture(activePointerId)) {
        board.releasePointerCapture(activePointerId);
      }
      setInteraction(IDLE);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePointerId, boardRef, setInteraction]);

  return {
    interaction,
    boardHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerAbort,
      onLostPointerCapture: onPointerAbort,
    },
  };
}

function toBoardPoint(event: { clientX: number; clientY: number }, board: Element): Point {
  const bounds = board.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function clampPoint(point: Point, bounds: Size): Point {
  return clampPosition(point, { width: 0, height: 0 }, bounds);
}
