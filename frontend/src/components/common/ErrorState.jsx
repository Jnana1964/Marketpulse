import { AlertTriangle, WifiOff } from 'lucide-react';

export function ErrorState({ message, onRetry, offline = false }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-10 text-center">
      {offline ? (
        <WifiOff size={28} className="text-[var(--color-text-muted)]" />
      ) : (
        <AlertTriangle size={28} className="text-[var(--color-warning)]" />
      )}
      <p className="text-sm font-semibold text-white">
        {offline ? "You're offline." : 'Unable to refresh market data.'}
      </p>
      <p className="max-w-sm text-xs text-[var(--color-text-secondary)]">
        {message || 'Showing the last available data.'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          Try again
        </button>
      )}
    </div>
  );
}
