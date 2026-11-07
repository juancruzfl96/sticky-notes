import { useEffect, useMemo, useRef, useState } from 'react';
import type { Note } from '../domain/types';
import type { NotesRepository } from '../services/NotesRepository';
import { createSaveQueue, type SaveStatus } from '../services/saveQueue';

export type LoadStatus = 'loading' | 'ready' | 'failed';

const SAVE_DEBOUNCE_MS = 400;

export function usePersistence(
  repository: NotesRepository,
  notes: Note[],
  onLoad: (notes: Note[]) => void,
) {
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Same reference the reducer stores on hydrate, so freshly loaded notes aren't saved back.
  const loadedNotesRef = useRef<Note[] | null>(null);
  const latestNotesRef = useRef(notes);
  useEffect(() => {
    latestNotesRef.current = notes;
  });

  useEffect(() => {
    let cancelled = false;
    repository.load().then(
      (loaded) => {
        if (cancelled) return;
        loadedNotesRef.current = loaded;
        onLoad(loaded);
        setLoadStatus('ready');
      },
      () => {
        if (!cancelled) setLoadStatus('failed');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, onLoad, loadAttempt]);

  const saveQueue = useMemo(
    () => createSaveQueue<Note[]>((snapshot) => repository.save(snapshot), setSaveStatus),
    [repository],
  );

  useEffect(() => {
    if (loadStatus !== 'ready' || notes === loadedNotesRef.current) {
      return;
    }
    const timer = window.setTimeout(() => void saveQueue.enqueue(notes), SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [notes, loadStatus, saveQueue]);

  return {
    loadStatus,
    saveStatus,
    retryLoad: () => {
      setLoadStatus('loading');
      setLoadAttempt((attempt) => attempt + 1);
    },
    retrySave: () => void saveQueue.enqueue(latestNotesRef.current),
  };
}
