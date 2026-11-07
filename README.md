# Sticky Notes

A single-page sticky notes board built with **React + TypeScript**, without UI kits or
drag-and-drop libraries. All dragging, resizing and hit-testing is implemented from scratch
on top of the Pointer Events API.

## Getting started

Requirements: Node.js **20.19+** and npm.

```bash
npm install
npm run dev        # starts the dev server at http://localhost:5173
```

Other scripts:

| Script              | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `npm run build`     | Type-checks and builds a production bundle to `dist/` |
| `npm run preview`   | Serves the production build locally            |
| `npm test`          | Runs the unit tests once (Vitest)              |
| `npm run typecheck` | Runs the TypeScript compiler without emitting  |

To try it on a phone in the same network: `npm run dev -- --host` and open the printed
network URL.

## Features

Required (all four implemented):

1. **Create a note of a given size at a given position** – click and drag on an empty area
   of the board to draw the note. A dashed preview shows its final size (a minimum size is
   enforced). The **+** button creates a default-sized note, which is the main way to
   create notes on touch screens.
2. **Resize by dragging** – the handle in the bottom-right corner.
3. **Move by dragging** – grab the note's top bar.
4. **Delete by dragging to the trash** – while a note is being moved, a trash zone slides in
   at the bottom of the screen. Releasing the note while the **pointer** is over it deletes it:
   the note is pulled into the trash icon, which bounces, and only then is it removed
   (instantly when the system asks for reduced motion).

Bonus (all five implemented):

- **I. Edit note text** – the note body is a text area; new notes get focus automatically.
- **II. Bring to front** – pressing anywhere on a note raises it above the others.
- **III. Local storage** – notes are restored on page load.
- **IV. Colors** – four colors, picked from the swatches in the note's top bar.
- **V. REST API (mocked, async)** – the default persistence layer is an asynchronous mock of
  `GET /api/notes` and `PUT /api/notes` with simulated latency and optional failures.

Extras: on the first visit the board starts with three welcome notes that explain the
gestures (laid out in a row on desktop, stacked on phones); `Escape` cancels a
drag/resize/draw and puts the note back; notes always stay inside the board; touch support
with larger hit areas; save status indicator with retry.

### Persistence modes

Selected with URL parameters:

| URL                  | Behavior                                                      |
| -------------------- | ------------------------------------------------------------- |
| `/`                  | Mocked REST API (250–700 ms latency), stored in localStorage  |
| `/?storage=local`    | Plain localStorage repository                                 |
| `/?failureRate=0.3`  | Mocked API where 30% of requests fail, to try error states    |

## Architecture

```
src/
  domain/      Pure logic, no React: types, geometry, notes reducer, runtime validation
  services/    Persistence: NotesRepository interface + localStorage and mock API implementations, save queue
  hooks/       useBoardInteraction (pointer state machine), usePersistence, useElementSize
  components/  Board, StickyNote, TrashZone, SaveStatusIndicator, icons
  App.tsx      Wires state, persistence and the board
```

### Key decisions

- **Pointer Events + pointer capture** instead of the HTML5 Drag and Drop API. Native DnD
  gives poor control over the drag image, behaves differently in Firefox, doesn't work on
  touch and can't express resizing. Pointer Events cover mouse, pen and touch with one code
  path, and `setPointerCapture` keeps the gesture alive when the pointer moves fast or leaves
  the board.
- **One delegated handler on the board.** The board decides what a press means by looking at
  `data-*` markers (`data-note-id`, `data-drag-handle`, `data-resize-handle`), so notes stay
  dumb, presentational components.
- **Interaction as a state machine** (`idle | creating | moving | resizing`) instead of loose
  booleans. Invalid combinations (e.g. moving and resizing at once) can't be represented.
- **Live gesture values are kept out of the notes state.** While dragging, only the
  interaction state changes; the note is committed to the reducer on pointer up. Cancelling
  is free, and persistence runs once per gesture instead of on every pointer move.
- **Pure reducer with structural sharing.** No-op actions return the same array, so memoized
  notes don't re-render and nothing is saved. z-indexes are renumbered `1..n` when a note is
  raised, so they never grow unbounded.
- **Non-destructive fitting.** On smaller screens notes are fitted into the board at render
  time; the stored geometry only changes when the user actually moves or resizes a note.
- **Repository pattern for persistence.** The UI depends on a `NotesRepository` interface, so
  localStorage, the mock API or a real backend are interchangeable. Loaded data is validated
  at runtime, since storage and network are untrusted.
- **Serialized "latest wins" saves.** Saves are debounced (400 ms) and at most one request is
  in flight; changes made meanwhile are collapsed into a single follow-up save. A slow, older
  request can never overwrite newer data.
- **No saving before a successful load.** If loading fails the board isn't shown (with a
  retry), so stored notes are never overwritten by an empty board.

## Browser support

Latest Chrome (Windows, macOS), Firefox (all platforms) and Edge. Touch devices are supported
as well. All APIs used (Pointer Events, pointer capture, `ResizeObserver`) are available in
every supported browser.

## Trade-offs and next steps

- **Saving sends the whole collection.** Simple and robust for a handful of notes. With a real
  API I'd send per-note `POST/PATCH/DELETE` requests with optimistic updates and rollback.
- **Changes made right before closing the tab can be lost.** Saves wait 400 ms of inactivity,
  and the mocked API adds 250–700 ms of latency, so the window is up to ~1 s (400 ms with
  `?storage=local`). A real API would flush on `pagehide` with
  `fetch(..., { keepalive: true })` or `navigator.sendBeacon`.
- **Keyboard support for moving/resizing** (arrow keys on a focused note) and an **undo** for
  deletions would be the next accessibility/UX improvements.
- **Component and end-to-end tests** (Testing Library, Playwright) for the drag interactions;
  the current tests cover the domain logic and persistence services.
- **Multi-tab sync** through the `storage` event.
