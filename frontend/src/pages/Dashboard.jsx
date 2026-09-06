import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Activity, Search as SearchIcon, ChevronRight, Leaf, RefreshCw } from 'lucide-react';
import { DashboardSkeleton } from '../components/common/Loader';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/dashboard/EmptyState';
import { MarketSummary } from '../components/dashboard/MarketSummary';
import { AttentionCard } from '../components/dashboard/AttentionCard';
import { StockAvatar } from '../components/common/StockAvatar';
import { ImportanceBadge } from '../components/insights/ImportanceBadge';
import { StockChart } from '../components/stocks/StockChart';
import { useMarketData } from '../hooks/useMarketData';
import { fetchDashboard } from '../api/insightApi';
import { fetchHistory } from '../api/marketApi';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatCurrency';
import { formatPercentage } from '../utils/formatPercentage';

const EXPLORE_LINKS = [
  { to: '/watchlist', icon: Star, title: 'Smart Watchlist', subtitle: 'Track and manage your stocks' },
  { to: '/changes', icon: Activity, title: "What's Changed", subtitle: 'See the latest meaningful changes' },
  { to: '/search', icon: SearchIcon, title: 'Stock Search', subtitle: 'Look up any company' },
];

export function Dashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [range, setRange] = useState('1D');
  const [chart, setChart] = useState(null);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(() => fetchDashboard(), []);
  const { data, loading, error, refresh } = useMarketData(load, { intervalMs: 30000 });

  const rows = data?.watchlistPreview || [];

  // The dashboard's hero chart shows real OHLC candles for whichever
  // tracked stock most deserves attention right now — never an invented
  // "market index," since the backend has no index feed to draw one from.
  const featured = data?.attention?.[0]?.item || rows[0]?.item || null;

  useEffect(() => {
    if (!featured?.symbol) return undefined;
    let cancelled = false;
    fetchHistory(featured.symbol, range)
      .then((result) => !cancelled && setChart(result))
      .catch((err) => !cancelled && setChartError(err.message));
    return () => {
      cancelled = true;
    };
  }, [featured?.symbol, range]);

  const snapshot = useMemo(() => {
    if (rows.length === 0) return null;
    const withChange = rows
      .map((r) => ({ row: r, change: r.sinceLastChecked?.hasPrevious ? r.sinceLastChecked.changePercent : r.today?.changePercent }))
      .filter((r) => r.change !== null && r.change !== undefined);
    if (withChange.length === 0) return { mostActive: null, topGainer: null, topLoser: null };
    const mostActive = withChange.reduce((a, b) => (Math.abs(b.change) > Math.abs(a.change) ? b : a));
    const topGainer = withChange.filter((r) => r.change > 0).sort((a, b) => b.change - a.change)[0] || null;
    const topLoser = withChange.filter((r) => r.change < 0).sort((a, b) => a.change - b.change)[0] || null;
    return { mostActive, topGainer, topLoser };
  }, [rows]);

  const dateLabel = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeLabel = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Market Overview</p>
          <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
            {data ? `${data.greeting}` : 'Welcome back'}, {user?.name?.split(' ')[0] || ''} <span aria-hidden>👋</span>
          </p>
          <h1 className="mt-1 text-4xl font-extrabold text-white sm:text-5xl">Here's what changed in your market.</h1>
          <p className="mt-2 text-base text-[var(--color-text-secondary)]">A clear view of what matters, since your last visit.</p>
        </div>
        <div className="text-right">
          <p className="text-base text-[var(--color-text-secondary)]">{dateLabel}</p>
          <div className="mt-0.5 flex items-center justify-end gap-2">
            <p className="text-base font-semibold text-white">{timeLabel}</p>
            <button
              onClick={refresh}
              aria-label="Refresh"
              title="Refresh"
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-white"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
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

      {data && data.isEmpty && (
        <div className="mt-6">
          <EmptyState
            icon={Star}
            title="Your market story starts here."
            description="You haven't added any stocks yet."
            action={
              <Link to="/watchlist" className="mt-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-[#071011] hover:bg-[var(--color-brand-hover)]">
                Add your first stock
              </Link>
            }
          />
        </div>
      )}

      {data && !data.isEmpty && (
        <div className="mt-6 space-y-6">
          <MarketSummary since={data.since} summary={data.summary} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px] xl:gap-8">
            {featured ? (
              <StockChart
                candles={chart?.candles}
                range={range}
                onRangeChange={setRange}
                source={chart?.source}
                availableRanges={['1D', '1W', '1M', '3M']}
                dataStatus={rows.find((r) => r.item.symbol === featured.symbol)?.quote?.dataStatus}
                timestamp={rows.find((r) => r.item.symbol === featured.symbol)?.quote?.timestamp}
                onRefresh={refresh}
                symbol={featured.symbol}
                title="Market Overview"
                subtitle={`${featured.instrumentName} · Live price movement`}
                heightClassName="h-[440px] xl:h-[500px]"
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                Add a stock to your watchlist to see a live candlestick chart here.
              </div>
            )}
            {chartError && <p className="-mt-4 text-xs text-[var(--color-negative)] xl:col-span-2">{chartError}</p>}

            <aside className="space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <h3 className="text-sm font-semibold text-white">Market Snapshot</h3>
                {snapshot ? (
                  <div className="mt-3 space-y-3">
                    {snapshot.mostActive && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-muted)]">Most active</span>
                        <Link to={`/stocks/${snapshot.mostActive.row.item.symbol}`} className="text-sm font-semibold text-white hover:text-[var(--color-brand)]">
                          {snapshot.mostActive.row.item.symbol}
                        </Link>
                      </div>
                    )}
                    {snapshot.topGainer && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-muted)]">Top gainer</span>
                        <span className="text-sm font-semibold tabular-nums text-[var(--color-positive)]">
                          {snapshot.topGainer.row.item.symbol} {formatPercentage(snapshot.topGainer.change)}
                        </span>
                      </div>
                    )}
                    {snapshot.topLoser && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-muted)]">Top loser</span>
                        <span className="text-sm font-semibold tabular-nums text-[var(--color-negative)]">
                          {snapshot.topLoser.row.item.symbol} {formatPercentage(snapshot.topLoser.change)}
                        </span>
                      </div>
                    )}
                    {!snapshot.mostActive && (
                      <p className="text-sm text-[var(--color-text-secondary)]">Everything is trading quietly right now.</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">No watchlist data yet.</p>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <p className="text-sm font-semibold text-white">Quick Actions</p>
                <div className="mt-3 space-y-1">
                  {EXPLORE_LINKS.map(({ to, icon: Icon, title, subtitle }) => (
                    <Link key={to} to={to} className="flex items-center justify-between rounded-xl px-2.5 py-2.5 transition hover:bg-white/5">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                          <Icon size={16} />
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-white">{title}</span>
                          <span className="block text-xs text-[var(--color-text-muted)]">{subtitle}</span>
                        </span>
                      </span>
                      <ChevronRight size={16} className="flex-none text-[var(--color-text-muted)]" />
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <span aria-hidden>🔔</span> Stocks that need your attention
              </h2>
              <Link to="/changes" className="flex items-center gap-0.5 text-sm font-semibold text-[var(--color-brand)] hover:opacity-80">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            {data.attention.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.attention.map((r) => (
                  <AttentionCard key={r.item.id} result={r} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-base text-[var(--color-text-secondary)]">
                Nothing meaningful changed — your watchlist has stayed relatively stable.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                <Star size={18} className="text-[var(--color-brand)]" /> Your Smart Watchlist
              </h2>
              <Link to="/watchlist" className="flex items-center gap-0.5 text-sm font-semibold text-[var(--color-brand)] hover:opacity-80">
                View watchlist <ChevronRight size={16} />
              </Link>
            </div>
            <p className="px-6 pt-4 text-sm text-[var(--color-text-secondary)]">A quick view of your tracked stocks.</p>
            <DashboardWatchlistPreview rows={rows} />
          </section>

          <p className="flex items-center justify-center gap-2 text-center text-sm italic text-[var(--color-text-muted)]">
            <Leaf size={14} className="text-[var(--color-brand)]" /> "Better information. A calmer you."
          </p>
        </div>
      )}
    </main>
  );
}

function DashboardWatchlistPreview({ rows }) {
  if (!rows || rows.length === 0) {
    return <p className="px-6 py-6 text-base text-[var(--color-text-muted)]">No stocks tracked yet.</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[640px] text-base">
        <thead>
          <tr className="text-left text-sm uppercase tracking-wide text-[var(--color-text-muted)]">
            <th className="px-6 py-3 font-medium">#</th>
            <th className="px-6 py-3 font-medium">Stock</th>
            <th className="px-6 py-3 font-medium">Price (₹)</th>
            <th className="px-6 py-3 font-medium">Change</th>
            <th className="px-6 py-3 font-medium">Attention</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 6).map((row, i) => {
            const change = row.sinceLastChecked?.hasPrevious ? row.sinceLastChecked.changePercent : row.today?.changePercent;
            const positive = (change ?? 0) >= 0;
            return (
              <tr key={row.item.id} className="border-t border-[var(--color-border)]">
                <td className="px-6 py-4 text-[var(--color-text-muted)]">{i + 1}</td>
                <td className="px-6 py-4">
                  <Link to={`/stocks/${row.item.symbol}`} className="flex items-center gap-3">
                    <StockAvatar symbol={row.item.symbol} size={34} />
                    <span>
                      <span className="block font-semibold text-white">{row.item.symbol}</span>
                      <span className="block text-sm text-[var(--color-text-muted)]">{row.item.instrumentName}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-4 tabular-nums text-white">{formatCurrency(row.quote?.price)}</td>
                <td className={`px-6 py-4 tabular-nums font-medium ${positive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                  {change === null || change === undefined ? '—' : formatPercentage(change)}
                </td>
                <td className="px-6 py-4">
                  <ImportanceBadge level={row.attentionLevel} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
