import { useCallback, useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/dashboard/EmptyState';
import { StockAvatar } from '../components/common/StockAvatar';
import { useMarketData } from '../hooks/useMarketData';
import { fetchHistoryChecks, fetchHistoryDetail } from '../api/insightApi';
import { formatDateTime } from '../utils/formatTime';
import { formatPercentage } from '../utils/formatPercentage';
import { formatCurrency } from '../utils/formatCurrency';

export function History() {
  const load = useCallback(() => fetchHistoryChecks(), []);
  const { data: checks, loading, error, refresh } = useMarketData(load, { intervalMs: 0 });

  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!selected) return;
    fetchHistoryDetail(selected).then(setDetail).catch(() => setDetail(null));
  }, [selected]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Your Market History</p>
      <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">A record of every time you've checked in.</h1>

      <div className="mt-6 gap-6 lg:grid lg:grid-cols-[280px_1fr]">
        <section>
          {loading && !checks && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          )}
          {error && !checks && <ErrorState message={error.message} onRetry={refresh} />}
          {checks && checks.length === 0 && (
            <EmptyState icon={Clock} title="No history yet." description="Check your dashboard a few times and your history will appear here." />
          )}
          {checks && checks.length > 0 && (
            <ul className="space-y-2">
              {checks.map((check) => (
                <li key={check.snapshotTime}>
                  <button
                    onClick={() => setSelected(check.snapshotTime)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      selected === check.snapshotTime
                        ? 'border-[var(--color-positive)]/40 bg-[var(--color-positive-soft)]'
                        : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-white/20'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{formatDateTime(check.snapshotTime)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {check.stockCount} stock{check.stockCount === 1 ? '' : 's'} checked · {check.ago}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6 lg:mt-0">
          {!detail && (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] py-14 text-center text-sm text-[var(--color-text-muted)]">
              Select a check on the left to see what your watchlist looked like then.
            </div>
          )}
          {detail && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-white">{formatDateTime(detail.snapshotTime)}</h3>
              <div className="mt-4 space-y-3">
                {detail.stocks.map((stock) => (
                  <div key={stock.symbol} className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <StockAvatar symbol={stock.symbol} size={30} />
                      <div>
                        <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{stock.instrumentName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums text-sm font-semibold text-white">{formatCurrency(stock.price)}</p>
                      {stock.changePercent !== null && (
                        <p className={`text-xs font-medium ${stock.changePercent >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                          {formatPercentage(stock.changePercent)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
