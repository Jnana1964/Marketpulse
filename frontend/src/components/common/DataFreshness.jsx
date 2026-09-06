import { timeAgo } from '../../utils/formatTime';

const STATUS_STYLES = {
  LIVE: { dot: 'bg-[var(--color-positive)]', text: 'text-[var(--color-positive)]', label: 'LIVE', pulse: true },
  DELAYED: { dot: 'bg-[var(--color-warning)]', text: 'text-[var(--color-warning)]', label: 'DELAYED', pulse: false },
  STALE: { dot: 'bg-[var(--color-negative)]', text: 'text-[var(--color-negative)]', label: 'STALE', pulse: false },
  DEMO: { dot: 'bg-[var(--color-text-muted)]', text: 'text-[var(--color-text-muted)]', label: 'DEMO DATA', pulse: false },
};

/**
 * Never claims LIVE unless the underlying data actually is — dataStatus
 * comes straight from the backend's freshness calculation (spec section 39).
 */
export function DataFreshness({ dataStatus, timestamp, className = '' }) {
  const style = STATUS_STYLES[dataStatus] || {
    dot: 'bg-[var(--color-text-muted)]',
    text: 'text-[var(--color-text-muted)]',
    label: 'UNKNOWN',
    pulse: false,
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot} ${style.pulse ? 'animate-pulse-dot' : ''}`} />
      <span className={`font-semibold tracking-wide ${style.text}`}>{style.label}</span>
      <span className="text-[var(--color-text-muted)]">
        {timestamp ? `Updated ${timeAgo(timestamp)}` : 'Update time unavailable.'}
      </span>
    </div>
  );
}
