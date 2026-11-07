import { useCallback, useRef, useState, type Dispatch } from 'react';
import { DEFAULT_NOTE_COLOR, DEFAULT_NOTE_SIZE } from '../domain/constants';
import { draftRectFromDrag, fitRectInBounds, spawnRect } from '../domain/geometry';
import type { NotesAction } from '../domain/notesReducer';
import type { Note, NoteColor, Point, Rect, Size } from '../domain/types';
import { useBoardInteraction, type Interaction } from '../hooks/useBoardInteraction';
import { useElementSize } from '../hooks/useElementSize';
import { createId } from '../utils/createId';
import { PlusIcon } from './icons';
import { StickyNote } from './StickyNote';
import { TrashZone } from './TrashZone';

interface BoardProps {
  notes: Note[];
  dispatch: Dispatch<NotesAction>;
}

export function Board({ notes, dispatch }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const boardSize = useElementSize(boardRef);
  const [focusNoteId, setFocusNoteId] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState<Discard[]>([]);
  const [isTrashSwallowing, setIsTrashSwallowing] = useState(false);

  const discardNote = (id: string, position: Point) => {
    const note = notes.find((candidate) => candidate.id === id);
    const board = boardRef.current;
    const icon = trashRef.current?.querySelector('svg');
    if (!note || !board || !icon || !boardSize || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dispatch({ type: 'remove', id });
      return;
    }

    const { width, height } = fitRectInBounds(note, boardSize);
    const boardBox = board.getBoundingClientRect();
    const iconBox = icon.getBoundingClientRect();
    const offset = {
      x: iconBox.left - boardBox.left + iconBox.width / 2 - (position.x + width / 2),
      y: iconBox.top - boardBox.top + iconBox.height / 2 - (position.y + height / 2),
    };
    setDiscarding((current) => [...current, { id, position, offset }]);
    setIsTrashSwallowing(true);
  };

  const handleDiscarded = useCallback(
    (id: string) => {
      setDiscarding((current) => current.filter((discard) => discard.id !== id));
      dispatch({ type: 'remove', id });
    },
    [dispatch],
  );

  const createNote = useCallback(
    (rect: Rect) => {
      const id = createId();
      dispatch({ type: 'create', id, rect, color: DEFAULT_NOTE_COLOR });
      setFocusNoteId(id);
    },
    [dispatch],
  );

  const handleTextChange = useCallback(
    (id: string, text: string) => dispatch({ type: 'updateText', id, text }),
    [dispatch],
  );

  const handleColorChange = useCallback(
    (id: string, color: NoteColor) => dispatch({ type: 'changeColor', id, color }),
    [dispatch],
  );

  const { interaction, boardHandlers } = useBoardInteraction({
    boardRef,
    trashRef,
    boardSize,
    getNoteRect: (id) => {
      const note = notes.find((candidate) => candidate.id === id);
      return note && boardSize ? fitRectInBounds(note, boardSize) : undefined;
    },
    onCreate: createNote,
    onMove: (id: string, position: Point) => dispatch({ type: 'move', id, position }),
    onResize: (id: string, size: Size) => dispatch({ type: 'resize', id, size }),
    onRemove: discardNote,
    onBringToFront: (id: string) => dispatch({ type: 'bringToFront', id }),
  });

  const draftRect =
    interaction.kind === 'creating' && boardSize
      ? draftRectFromDrag(interaction.origin, interaction.current, boardSize)
      : null;

  return (
    <div ref={boardRef} className={`board board--${interaction.kind}`} {...boardHandlers}>
      <div className="board__notes">
        {boardSize &&
          notes.map((note) => {
            const discard = discarding.find((candidate) => candidate.id === note.id);
            const rect = getDisplayRect(note, interaction, boardSize, discard?.position);
            const isActive = interaction.kind !== 'idle' && 'noteId' in interaction && interaction.noteId === note.id;
            return (
              <StickyNote
                key={note.id}
                note={note}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                isLifted={isActive || Boolean(discard)}
                isOverTrash={isActive && interaction.kind === 'moving' && interaction.overTrash}
                discardOffset={discard?.offset}
                autoFocus={note.id === focusNoteId}
                onTextChange={handleTextChange}
                onColorChange={handleColorChange}
                onDiscarded={handleDiscarded}
              />
            );
          })}

        {draftRect && (
          <div
            className="draft-rect"
            style={{
              width: draftRect.width,
              height: draftRect.height,
              transform: `translate3d(${draftRect.x}px, ${draftRect.y}px, 0)`,
            }}
          />
        )}
      </div>

      {notes.length === 0 && interaction.kind === 'idle' && (
        <div className="empty-hint">
          <div className="empty-hint__card">
            <p className="empty-hint__title">Your board is empty</p>
            <p className="empty-hint__fine">Click and drag anywhere to draw a note, or press +</p>
            <p className="empty-hint__coarse">Tap + to add your first note</p>
          </div>
        </div>
      )}

      <TrashZone
        ref={trashRef}
        visible={interaction.kind === 'moving' || discarding.length > 0 || isTrashSwallowing}
        active={(interaction.kind === 'moving' && interaction.overTrash) || discarding.length > 0}
        swallowing={isTrashSwallowing}
        onSwallowed={() => setIsTrashSwallowing(false)}
      />

      <button
        type="button"
        className={`add-note-button${interaction.kind === 'idle' ? '' : ' add-note-button--hidden'}`}
        aria-label="Add note"
        title="Add note"
        onClick={() => boardSize && createNote(spawnRect(DEFAULT_NOTE_SIZE, boardSize, notes.length))}
      >
        <PlusIcon />
      </button>
    </div>
  );
}

interface Discard {
  id: string;
  position: Point;
  offset: Point;
}

function getDisplayRect(note: Note, interaction: Interaction, bounds: Size, discardPosition?: Point): Rect {
  const rect = fitRectInBounds(note, bounds);
  if (discardPosition) {
    return { ...rect, ...discardPosition };
  }
  if (interaction.kind === 'moving' && interaction.noteId === note.id) {
    return { ...rect, ...interaction.position };
  }
  if (interaction.kind === 'resizing' && interaction.noteId === note.id) {
    return { ...rect, ...interaction.size };
  }
  return rect;
}
