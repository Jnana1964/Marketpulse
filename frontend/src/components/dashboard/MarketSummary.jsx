import { ArrowUpRight, Minus, Activity } from 'lucide-react';

/**
 * MarketPulse deliberately does not show index tickers like NIFTY/SENSEX
 * here — the backend only ever evaluates the stocks a user actually
 * tracks, and the product's hard rule is to never display a number that
 * isn't backed by real, fetched data (see README "Key Engineering
 * Decisions"). These tiles use the same visual language — big number,
 * trend badge, short description — built entirely from the user's own
 * watchlist signal instead of an invented index quote.
 */
function Tile({ eyebrow, value, unit, trendUp, description }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{eyebrow}</p>
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            trendUp
              ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
              : 'bg-white/5 text-[var(--color-text-muted)]'
          }`}
        >
          {trendUp ? <ArrowUpRight size={14} /> : <Minus size={14} />}
          {trendUp ? 'Active' : 'Quiet'}
        </span>
      </div>
      <p className="mt-2 text-4xl font-extrabold tabular-nums text-white">
        {value}
        {unit && <span className="ml-1 text-lg font-semibold text-[var(--color-text-muted)]">{unit}</span>}
      </p>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

function StatusTile({ moved }) {
  const stable = moved === 0;
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Market Status</p>
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            stable ? 'bg-white/5 text-[var(--color-text-muted)]' : 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]'
          }`}
        >
          <Activity size={14} />
          {stable ? 'Calm' : 'Volatile'}
        </span>
      </div>
      <p className="mt-2 text-3xl font-extrabold text-white">{stable ? 'Market Stable' : 'Notable Movement'}</p>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        {stable
          ? 'No major movements require attention.'
          : `${moved} stock${moved === 1 ? '' : 's'} in your watchlist moved beyond its normal range.`}
      </p>
    </div>
  );
}

export function MarketSummary({ since, summary }) {
  const count = since?.meaningfulChangeCount ?? 0;
  const total = summary?.totalStocks ?? 0;
  const moved = summary?.significantMovements ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Tile
        eyebrow="Your Watchlist"
        value={total}
        unit={total === 1 ? 'stock' : 'stocks'}
        trendUp={moved > 0}
        description={
          moved > 0
            ? `${moved} moved more than usual today.`
            : 'Everything is trading within its normal range.'
        }
      />
      <Tile
        eyebrow="Since Last Check"
        value={count}
        unit={count === 1 ? 'change' : 'changes'}
        trendUp={count > 0}
        description={
          since?.isFirstCheck
            ? "This is your first check — here's your watchlist."
            : `Since ${since?.previousCheckAgo || 'your last visit'}.`
        }
      />
      <StatusTile moved={moved} />
    </div>
  );
}
