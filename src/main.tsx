import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createNotesRepository } from './services/createNotesRepository';
import { consumeFirstVisit } from './services/firstVisit';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App repository={createNotesRepository()} isFirstVisit={consumeFirstVisit(window.localStorage)} />
  </StrictMode>,
);
