import { useCallback, useState } from 'react';
import { Star, Plus, Layers, Bell, TrendingUp } from 'lucide-react';
import { ErrorState } from '../components/common/ErrorState';
import { DashboardSkeleton } from '../components/common/Loader';
import { EmptyState } from '../components/dashboard/EmptyState';
import { WatchlistTable } from '../components/dashboard/WatchlistTable';
import { StockSearch } from '../components/stocks/StockSearch';
import { useMarketData } from '../hooks/useMarketData';
import { fetchDashboard } from '../api/insightApi';
import { addWatchlistItem, removeWatchlistItem } from '../api/watchlistApi';
import { formatTimeShort } from '../utils/formatTime';

function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--color-positive-soft)] text-[var(--color-positive)]">
        <Icon size={18} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-white">{value}</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

export function Watchlist() {
  const [showSearch, setShowSearch] = useState(false);
  const [actionError, setActionError] = useState(null);

  const load = useCallback(() => fetchDashboard(), []);
  const { data, loading, error, refresh } = useMarketData(load, { intervalMs: 30000 });

  const watchlistId = data?.watchlist?.id;
  const rows = data?.watchlistPreview || [];
  const existingSymbols = rows.map((r) => r.item.symbol);
  const needAttention = rows.filter((r) => r.attentionLevel && r.attentionLevel.key !== 'LOW').length;
  const lastUpdated = rows[0]?.quote?.timestamp;

  async function handleAdd(instrument) {
    setActionError(null);
    try {
      await addWatchlistItem(watchlistId, instrument);
      await refresh();
    } catch (err) {
      setActionError(err.message || 'Unable to add that stock right now.');
    }
  }

  async function handleRemove(itemId) {
    setActionError(null);
    try {
      await removeWatchlistItem(watchlistId, itemId);
      await refresh();
    } catch (err) {
      setActionError(err.message || 'Unable to remove that stock right now.');
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Your Watchlist</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">The stocks you care about.</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">We keep track of meaningful changes, so you don't have to.</p>
        </div>
        <button
          onClick={() => setShowSearch(true)}
          disabled={!watchlistId}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--color-positive)] px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} /> Add to Watchlist
        </button>
      </div>

      {loading && !data && (
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      )}
      {error && !data && (
        <div className="mt-6">
          <ErrorState message={error.message} onRetry={refresh} offline={error.code === 'NETWORK_ERROR'} />
        </div>
      )}

      {actionError && (
        <p className="mt-4 rounded-lg border border-[var(--color-negative)]/30 bg-[var(--color-negative-soft)] px-4 py-2 text-xs text-[var(--color-negative)]">
          {actionError}
        </p>
      )}

      {data && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Star}
            title="Your market story starts here."
            description="You haven't added any stocks yet."
            action={
              <button
                onClick={() => setShowSearch(true)}
                className="mt-2 rounded-lg bg-[var(--color-positive)] px-4 py-2 text-xs font-semibold text-black hover:opacity-90"
              >
                Add your first stock
              </button>
            }
          />
        </div>
      )}

      {data && rows.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={Layers} value={rows.length} label={`Stock${rows.length === 1 ? '' : 's'} in watchlist`} />
            <StatCard icon={Bell} value={needAttention} label="Need attention" />
            <StatCard icon={TrendingUp} value={lastUpdated ? formatTimeShort(lastUpdated) : '—'} label="Last updated" />
          </div>

          <div className="mt-6">
            <WatchlistTable rows={rows} onRemove={handleRemove} />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-positive-soft)] bg-[var(--color-card-alt)] p-5">
            <div>
              <p className="text-sm font-semibold text-white">Add more stocks to your watchlist</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Track the companies you care about and get notified when something meaningful happens.</p>
            </div>
            <button
              onClick={() => setShowSearch(true)}
              className="flex flex-none items-center gap-1.5 rounded-lg bg-[var(--color-positive)] px-4 py-2.5 text-xs font-semibold text-black transition hover:opacity-90"
            >
              <Plus size={14} /> Add Stock
            </button>
          </div>
        </>
      )}

      {showSearch && (
        <StockSearch existingSymbols={existingSymbols} onAdd={handleAdd} onClose={() => setShowSearch(false)} />
      )}
    </main>
  );
}
