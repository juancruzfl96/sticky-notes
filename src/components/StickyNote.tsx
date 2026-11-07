import { memo, type CSSProperties } from 'react';
import { NOTE_COLORS } from '../domain/constants';
import type { Note, NoteColor, Point } from '../domain/types';
import { DRAG_HANDLE_ATTRIBUTE, NOTE_ID_ATTRIBUTE, RESIZE_HANDLE_ATTRIBUTE } from '../hooks/useBoardInteraction';

interface StickyNoteProps {
  note: Note;
  x: number;
  y: number;
  width: number;
  height: number;
  isLifted: boolean;
  isOverTrash: boolean;
  discardOffset: Point | undefined;
  autoFocus: boolean;
  onTextChange: (id: string, text: string) => void;
  onColorChange: (id: string, color: NoteColor) => void;
  onDiscarded: (id: string) => void;
}

export const StickyNote = memo(function StickyNote({
  note,
  x,
  y,
  width,
  height,
  isLifted,
  isOverTrash,
  discardOffset,
  autoFocus,
  onTextChange,
  onColorChange,
  onDiscarded,
}: StickyNoteProps) {
  const className = [
    'note',
    `note--${note.color}`,
    isLifted && 'note--lifted',
    isOverTrash && 'note--over-trash',
    discardOffset && 'note--discarding',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={className}
      style={{
        width,
        height,
        zIndex: note.zIndex,
        transform: `translate3d(${x}px, ${y}px, 0)`,
        ...(discardOffset && ({
          '--discard-x': `${discardOffset.x}px`,
          '--discard-y': `${discardOffset.y}px`,
        } as CSSProperties)),
      }}
      aria-label="Sticky note"
      onAnimationEnd={(event) => {
        if (discardOffset && event.target === event.currentTarget) onDiscarded(note.id);
      }}
      {...{ [NOTE_ID_ATTRIBUTE]: note.id }}
    >
      <header className="note__header" title="Drag to move" {...{ [DRAG_HANDLE_ATTRIBUTE]: '' }}>
        <div className="note__swatches" role="group" aria-label="Note color">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`note__swatch note__swatch--${color}`}
              aria-label={`Make note ${color}`}
              aria-pressed={note.color === color}
              onClick={() => onColorChange(note.id, color)}
            />
          ))}
        </div>
      </header>

      <textarea
        className="note__text"
        value={note.text}
        placeholder="Write something…"
        aria-label="Note text"
        autoFocus={autoFocus}
        onChange={(event) => onTextChange(note.id, event.target.value)}
      />

      <div className="note__resize-handle" title="Drag to resize" {...{ [RESIZE_HANDLE_ATTRIBUTE]: '' }} />
    </article>
  );
});
