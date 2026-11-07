import type { SaveStatus } from '../services/saveQueue';

const LABELS: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'All changes saved',
  failed: "Couldn't save your changes",
};

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onRetry: () => void;
}

export function SaveStatusIndicator({ status, onRetry }: SaveStatusIndicatorProps) {
  return (
    <div className={`save-status save-status--${status}`} role="status" aria-live="polite">
      {status !== 'idle' && (
        <>
          <span>{LABELS[status]}</span>
          {status === 'failed' && (
            <button type="button" className="text-button" onClick={onRetry}>
              Retry
            </button>
          )}
        </>
      )}
    </div>
  );
}
