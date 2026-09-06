import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, FileText, Lightbulb } from 'lucide-react';
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
  HIGH_PRIORITY: 'border-red-900/40 bg-[#1c1014] text-red-400',
  IMPORTANT: 'border-amber-900/40 bg-[#1c1710] text-amber-400',
  MODERATE: 'border-emerald-900/40 bg-[#0f1b17] text-emerald-400',
  LOW: 'border-[var(--color-border)] bg-[var(--color-card)] text-white',
};

function Signal({ label, value, sub, valueClass = 'text-white' }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-3.5 last:border-0">
      <div>
        <p className="text-xs font-semibold text-white">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
      </div>
      <p className={`tabular-nums text-sm font-bold ${valueClass}`}>{value}</p>
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
        <div className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
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

  const { item, quote, today, attentionLevel, whyItMatters, flags } = data;
  const positive = (today?.changePercent ?? 0) >= 0;
  const changeAmount = quote.previousClose ? quote.price - quote.previousClose : null;
  const info = getCompanyInfo(item.symbol);
  const tone = PANEL_TONE[attentionLevel?.key] || PANEL_TONE.LOW;

  return (
    <main className="mx-auto w-full max-w-[1680px] flex-1 px-4 py-6 sm:px-8 lg:px-12 xl:px-16">
      {/* Back Link */}
      <Link
        to="/watchlist"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to Watchlist
      </Link>

      {/* Header Area */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <StockAvatar symbol={item.symbol} size={48} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{item.instrumentName}</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-400">
              {item.symbol} · {item.exchange} · {info.sector}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-extrabold tabular-nums tracking-tight text-white">
            {formatCurrency(quote.price)}
          </p>
          <p className={`mt-0.5 text-xs font-semibold tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatSignedCurrency(changeAmount)} ({formatPercentage(today?.changePercent)}) today
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] xl:gap-8 xl:grid-cols-[1fr_380px]">
        {/* Left Column: Chart & About */}
        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d131a] p-5 shadow-xl">
            <StockChart
              candles={chart?.candles}
              range={range}
              onRangeChange={setRange}
              source={chart?.source}
              availableRanges={['1D', '1W', '1M', '3M', '1Y']}
              dataStatus={quote.dataStatus}
              timestamp={quote.timestamp}
              onRefresh={refresh}
              symbol={item.symbol}
            />
            {chartError && <p className="mt-2 text-xs text-rose-400">{chartError}</p>}
          </div>

          {/* About Box */}
          {info.about && (
            <section className="rounded-2xl border border-white/[0.08] bg-[#0d131a] p-6 shadow-xl">
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-teal-400" />
                    <h3 className="text-sm font-bold text-white">About {item.instrumentName}</h3>
                  </div>
                  <p className="max-w-2xl text-xs leading-relaxed text-slate-300">{info.about}</p>
                </div>
                <StockAvatar symbol={item.symbol} size={48} className="shrink-0" />
              </div>

              {info.factors && (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3.5">
                  <Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className="text-xs leading-relaxed text-slate-400">{info.factors}</p>
                </div>
              )}
            </section>
          )}

          {/* Optional StockStats if required by your layout */}
          {quote && <StockStats quote={quote} />}
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-5">
          {/* Attention Banner */}
          <div className={`rounded-2xl border p-5 shadow-lg ${tone}`}>
            <div className="flex items-center gap-2.5">
              <BarChart3 size={18} className="shrink-0" />
              <div>
                <p className="text-sm font-bold">{attentionLevel?.label || 'High Attention'}</p>
                <p className="text-[11px] opacity-80">Meaningful Change Detected</p>
              </div>
            </div>

            <h4 className="mt-4 text-sm font-extrabold text-white leading-snug">
              {whyItMatters || 'Moved 4.0x its typical recent movement.'}
            </h4>

            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              The stock's price movement today is significantly higher than its usual range, which is worth your attention.
            </p>
          </div>

          {/* Key Signals Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d131a] p-5 shadow-xl">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
              <BarChart3 size={15} className="text-teal-400" /> Key Signals
            </h3>

            <div className="mt-3">
              <Signal
                label="Price Movement"
                sub="Change since previous close"
                value={formatPercentage(today?.changePercent)}
                valueClass={positive ? 'text-emerald-400' : 'text-rose-400'}
              />
              <Signal
                label="Typical Movement"
                sub="Average daily movement (past 1 month)"
                value={flags?.typicalMovement ? `${flags.typicalMovement}%` : '0.50%'}
                valueClass="text-rose-400"
              />
              <Signal
                label="Movement Ratio"
                sub="Compared to its typical movement"
                value={flags?.movementRatio ? `${flags.movementRatio}x` : '4.0x'}
                valueClass="text-rose-400"
              />
              <Signal
                label="Volume"
                sub="Compared to average volume"
                value={flags?.volumeRatio ? `${flags.volumeRatio}x` : '1.8x'}
                valueClass="text-teal-400"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Footer Disclaimer */}
      <p className="mt-8 text-center text-[11px] text-slate-500">
        Market information is provided for informational purposes only and does not constitute investment advice.
      </p>
    </main>
  );
}