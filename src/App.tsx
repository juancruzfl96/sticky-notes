import { useCallback, useReducer } from 'react';
import { Board } from './components/Board';
import { SaveStatusIndicator } from './components/SaveStatusIndicator';
import { notesReducer } from './domain/notesReducer';
import type { Note } from './domain/types';
import { createWelcomeNotes } from './domain/welcomeNotes';
import { usePersistence } from './hooks/usePersistence';
import type { NotesRepository } from './services/NotesRepository';
import { createId } from './utils/createId';

interface AppProps {
  repository: NotesRepository;
  isFirstVisit: boolean;
}

export function App({ repository, isFirstVisit }: AppProps) {
  const [notes, dispatch] = useReducer(notesReducer, []);
  const hydrate = useCallback(
    (loaded: Note[]) => {
      const initial =
        isFirstVisit && loaded.length === 0
          ? createWelcomeNotes({ width: window.innerWidth, height: window.innerHeight }, createId)
          : loaded;
      dispatch({ type: 'hydrate', notes: initial });
    },
    [isFirstVisit],
  );
  const { loadStatus, saveStatus, retryLoad, retrySave } = usePersistence(repository, notes, hydrate);

  return (
    <main className="app">
      {loadStatus === 'ready' ? (
        <Board notes={notes} dispatch={dispatch} />
      ) : (
        <div className="load-state" role="status">
          {loadStatus === 'loading' ? (
            <p>Loading your notes…</p>
          ) : (
            <>
              <p>Couldn't load your notes.</p>
              <button type="button" className="text-button" onClick={retryLoad}>
                Try again
              </button>
            </>
          )}
        </div>
      )}
      <SaveStatusIndicator status={saveStatus} onRetry={retrySave} />
    </main>
  );
}
