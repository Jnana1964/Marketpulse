import { useCallback, useState } from 'react';
import { Activity, Bell } from 'lucide-react';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/dashboard/EmptyState';
import { InsightCard } from '../components/insights/InsightCard';
import { useMarketData } from '../hooks/useMarketData';
import { fetchChanges } from '../api/insightApi';
import { formatTimeShort } from '../utils/formatTime';

const PRIORITY_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'HIGH_PRIORITY', label: 'High Priority' },
  { key: 'IMPORTANT', label: 'Important' },
  { key: 'MODERATE', label: 'Moderate' },
  { key: 'LOW', label: 'Low' },
];

const TIME_FILTERS = [
  { key: 'SINCE_LAST_CHECK', label: 'Since last check' },
  { key: 'TODAY', label: 'Today' },
  { key: 'LAST_24H', label: 'Last 24 hours' },
];

export function Changes() {
  const [priority, setPriority] = useState('ALL');
  const [time, setTime] = useState('SINCE_LAST_CHECK');

  const load = useCallback(() => fetchChanges({ priority, time }), [priority, time]);
  const { data, loading, error, refresh } = useMarketData(load, { intervalMs: 60000 });

  const latest = data?.changes?.[0];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Since Your Last Visit</p>
          <h1 className="mt-1 text-3xl font-extrabold text-white sm:text-4xl">Here's what's changed.</h1>
          <p className="mt-1 text-base text-[var(--color-text-secondary)]">A simple view of the meaningful changes in your watchlist.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--color-text-muted)]">Last checked</p>
          <button onClick={refresh} className="text-sm font-semibold text-white hover:text-[var(--color-brand)]">
            {latest ? formatTimeShort(latest.detected_at) : '—'}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {PRIORITY_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setPriority(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              priority === f.key
                ? 'bg-[var(--color-brand)] text-[#071011]'
                : 'bg-white/5 text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setTime(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              time === f.key
                ? 'border-[var(--color-brand)]/40 text-[var(--color-brand)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading && !data && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        )}

        {error && !data && <ErrorState message={error.message} onRetry={refresh} offline={error.code === 'NETWORK_ERROR'} />}

        {data && data.changes.length === 0 && (
          <EmptyState
            icon={Activity}
            title="Nothing meaningful changed."
            description="Your watchlist has remained relatively stable for this filter."
          />
        )}

        {data && data.changes.length > 0 && (
          <div className="space-y-3">
            {data.changes.map((change) => (
              <InsightCard key={change.id} change={change} />
            ))}
          </div>
        )}
      </div>

      {data && data.changes.length > 0 && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card-alt)] p-5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
            <Bell size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">That's all for now!</p>
            <p className="text-xs text-[var(--color-text-secondary)]">We'll notify you here when there are new meaningful changes.</p>
          </div>
        </div>
      )}
    </main>
  );
}
