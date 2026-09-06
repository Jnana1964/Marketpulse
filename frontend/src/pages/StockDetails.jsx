import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Lightbulb } from 'lucide-react';
import { ErrorState } from '../components/common/ErrorState';
import { StockAvatar } from '../components/common/StockAvatar';
import { StockChart } from '../components/stocks/StockChart';
import { StockStats } from '../components/stocks/StockStats';
import { useMarketData } from '../hooks/useMarketData';
import { fetchStockInsight } from '../api/insightApi';
import { fetchHistory } from '../api/marketApi';
import { formatCurrency, formatSignedCurrency } from '../utils/formatCurrency';
import { formatPercentage } from '../utils/formatPercentage';
import { formatTimeShort } from '../utils/formatTime';
import { getCompanyInfo } from '../utils/companyInfo';

const PANEL_TONE = {
  HIGH_PRIORITY: 'border-[var(--color-negative)]/40 bg-[var(--color-negative-soft)]',
  IMPORTANT: 'border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)]',
  MODERATE: 'border-[var(--color-positive)]/40 bg-[var(--color-positive-soft)]',
  LOW: 'border-[var(--color-border)] bg-[var(--color-card)]',
};

function Signal({ label, value, sub }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3 last:border-0">
      <div>
        <p className="text-sm text-white">{label}</p>
        {sub && <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>}
      </div>
      <p className="tabular-nums text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export function StockDetails() {
  const { symbol } = useParams();
  const [range, setRange] = useState('1D');
  const [chart, setChart] = useState(null);
  const [chartError, setChartError] = useState(null);

  const load = useCallback(() => fetchStockInsight(symbol), [symbol]);
  const { data, loading, error, refresh } = useMarketData(load, { intervalMs: 20000 });

  useEffect(() => {
    let cancelled = false;
    fetchHistory(symbol, range)
      .then((result) => !cancelled && setChart(result))
      .catch((err) => !cancelled && setChartError(err.message));
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  if (loading && !data) {
    return (
      <main className="mx-auto w-full max-w-[1680px] flex-1 space-y-4 px-4 py-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
        <div className="h-[480px] animate-pulse rounded-2xl bg-white/[0.04]" />
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-8 lg:px-12 xl:px-16">
        <ErrorState message={error.message} onRetry={refresh} offline={error.code === 'NETWORK_ERROR'} />
      </main>
    );
  }

  if (!data) return null;

  const { item, quote, sinceLastChecked, today, importanceScore, attentionLevel, whyItMatters, flags } = data;
  const positive = (today?.changePercent ?? 0) >= 0;
  const changeAmount = quote.previousClose ? quote.price - quote.previousClose : null;
  const info = getCompanyInfo(item.symbol);
  const tone = PANEL_TONE[attentionLevel?.key] || PANEL_TONE.LOW;
  const isCalm = !attentionLevel || attentionLevel.key === 'LOW';

  const intradayRangePct = quote.high !== null && quote.low !== null && quote.previousClose
    ? ((quote.high - quote.low) / quote.previousClose) * 100
    : null;

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-8 lg:px-12 xl:px-16">
      <Link to="/watchlist" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-white">
        <ArrowLeft size={14} /> Back to Watchlist
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <StockAvatar symbol={item.symbol} size={52} />
          <div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">{item.instrumentName}</h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              {item.symbol} · {item.exchange} · {info.sector}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold tabular-nums text-white sm:text-3xl">{formatCurrency(quote.price)}</p>
          <p className={`text-sm font-semibold tabular-nums ${positive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
            {formatSignedCurrency(changeAmount)} ({formatPercentage(today?.changePercent)}) today
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] xl:gap-8 2xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <StockChart
            candles={chart?.candles}
            range={range}
            onRangeChange={setRange}
            source={chart?.source}
            availableRanges={['1D', '1W', '1M', '3M']}
            dataStatus={quote.dataStatus}
            timestamp={quote.timestamp}
            onRefresh={refresh}
            symbol={item.symbol}
            heightClassName="h-[460px] xl:h-[520px]"
          />
          {chartError && <p className="text-xs text-[var(--color-negative)]">{chartError}</p>}

          {info.about && (
            <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">About {item.instrumentName}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{info.about}</p>
                </div>
                <StockAvatar symbol={item.symbol} size={44} />
              </div>
              {info.factors && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/[0.03] p-3">
                  <Lightbulb size={15} className="mt-0.5 flex-none text-[var(--color-warning)]" />
                  <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{info.factors}</p>
                </div>
              )}
            </section>
          )}

          <StockStats quote={quote} />

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-white">Since you last checked</h3>
            {sinceLastChecked?.hasPrevious ? (
              <div className="mt-3 flex items-center gap-3 text-sm">
                <span className="tabular-nums text-[var(--color-text-secondary)]">{formatCurrency(sinceLastChecked.previousPrice)}</span>
                <span className="text-[var(--color-text-muted)]">→</span>
                <span className="tabular-nums font-semibold text-white">{formatCurrency(quote.price)}</span>
                <span className={`font-semibold ${sinceLastChecked.changePercent >= 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
                  {formatPercentage(sinceLastChecked.changePercent)}
                </span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                First time tracking {item.symbol} — no prior check to compare against yet.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className={`rounded-2xl border p-5 ${tone}`}>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className={isCalm ? 'text-[var(--color-text-secondary)]' : 'text-white'} />
              <p className="text-sm font-bold text-white">{attentionLevel?.label || 'Stable'}</p>
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {isCalm ? 'Nothing meaningful to flag right now.' : 'Meaningful Change Detected'}
            </p>
            {whyItMatters && <p className="mt-3 text-sm font-semibold leading-snug text-white">{whyItMatters}</p>}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart3 size={15} className="text-[var(--color-brand)]" /> Key Signals
            </h3>
            <div className="mt-2">
              <Signal
                label="Price Movement"
                sub={sinceLastChecked?.hasPrevious ? 'Since your last check' : "Change since previous close"}
                value={formatPercentage(sinceLastChecked?.hasPrevious ? sinceLastChecked.changePercent : today?.changePercent)}
              />
              <Signal
                label="Intraday Range"
                sub="Today's high-to-low spread"
                value={intradayRangePct === null ? '—' : `${intradayRangePct.toFixed(2)}%`}
              />
              <Signal
                label="Gap From Open"
                sub="Vs. today's opening price"
                value={flags?.gapFromOpenPct === null || flags?.gapFromOpenPct === undefined ? '—' : formatPercentage(flags.gapFromOpenPct)}
              />
              <Signal label="Volume" sub="Shares traded today" value={quote.volume ? Number(quote.volume).toLocaleString('en-IN') : '—'} />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-xs text-[var(--color-text-muted)]">
            Importance score <span className="font-semibold text-white">{importanceScore}</span>/100 · updated {formatTimeShort(quote.timestamp)}
          </div>
        </aside>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
        Market information is provided for informational purposes only and does not constitute investment advice.
      </p>
    </main>
  );
}
