import { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatTimeShort } from '../../utils/formatTime';

const RANGES = ['1D', '1W', '1M', '3M', '1Y'];

const FRESHNESS_LABEL = {
  LIVE: 'Live data',
  DELAYED: 'Delayed data',
  STALE: 'Stale data',
  DEMO: 'Demo data',
};

/**
 * Real OHLC candlesticks (lightweight-charts) — the backend already
 * returns genuine open/high/low/close per interval in both live and demo
 * mode, so this never fabricates data. Positive candles are market green,
 * negative candles are market red — the brand teal is reserved for UI
 * chrome, never used to represent price direction.
 */
function Candles({ candles, symbol, range }) {
  const wrapperRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) return undefined;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#7f8b8e',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: 12,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 10,
        rightOffset: 6,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(255,255,255,0.25)', labelBackgroundColor: '#182122' },
        horzLine: { color: 'rgba(255,255,255,0.25)', labelBackgroundColor: '#182122' },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || !param.seriesData?.size) {
        setHoverInfo(null);
        return;
      }
      const bar = param.seriesData.get(series);
      if (!bar) {
        setHoverInfo(null);
        return;
      }
      setHoverInfo({ x: param.point.x, y: param.point.y, o: bar.open, h: bar.high, l: bar.low, c: bar.close });
    });

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) chart.applyOptions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    const data = (candles || [])
      .map((c) => ({
        time: Math.floor(new Date(c.timestamp).getTime() / 1000),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }))
      .filter((c) => !Number.isNaN(c.time) && !Number.isNaN(c.open) && !Number.isNaN(c.high) && !Number.isNaN(c.low) && !Number.isNaN(c.close))
      .filter((c, i, arr) => i === 0 || c.time > arr[i - 1].time);
    seriesRef.current.setData(data);
    if (data.length > 0) {
      chartRef.current?.timeScale().fitContent();
      if (data.length < 40) chartRef.current?.timeScale().applyOptions({ barSpacing: 14 });
    }
  }, [candles]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      {hoverInfo && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-hover)] px-3 py-2 text-xs shadow-xl"
          style={{
            left: Math.min(hoverInfo.x + 12, (chartContainerRef.current?.clientWidth || 0) - 160),
            top: Math.max(hoverInfo.y - 70, 4),
          }}
        >
          <p className="font-semibold text-[var(--color-brand)]">
            {symbol} · {range}
          </p>
          <p className="mt-1 tabular-nums text-[var(--color-text-secondary)]">
            O {formatCurrency(hoverInfo.o)} H {formatCurrency(hoverInfo.h)}
          </p>
          <p className="tabular-nums text-[var(--color-text-secondary)]">
            L {formatCurrency(hoverInfo.l)} C {formatCurrency(hoverInfo.c)}
          </p>
        </div>
      )}
      <div ref={chartContainerRef} className="h-full w-full" />
    </div>
  );
}

/** Only ever renders ranges the backend actually returned data for — never fabricates unavailable history. */
export function StockChart({
  candles,
  range,
  onRangeChange,
  source,
  availableRanges = RANGES,
  dataStatus,
  timestamp,
  onRefresh,
  symbol,
  title,
  subtitle,
  heightClassName = 'h-[420px] xl:h-[480px]',
}) {
  const hasData = (candles || []).length > 1;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title ? (
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-[var(--color-text-secondary)]">{subtitle}</p>}
          </div>
        ) : (
          <div />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-white/5 p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                disabled={!availableRanges.includes(r)}
                onClick={() => onRangeChange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${
                  range === r ? 'bg-[var(--color-brand)] text-[#071011]' : 'text-[var(--color-text-secondary)] hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span>Last updated: {timestamp ? formatTimeShort(timestamp) : '—'}</span>
            <span className="flex items-center gap-1">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  dataStatus === 'LIVE' ? 'bg-[var(--color-positive)] animate-pulse-dot' : 'bg-[var(--color-text-muted)]'
                }`}
              />
              <span className={dataStatus === 'LIVE' ? 'font-medium text-[var(--color-positive)]' : ''}>
                {FRESHNESS_LABEL[dataStatus] || 'Unknown'}
              </span>
            </span>
            {onRefresh && (
              <button onClick={onRefresh} aria-label="Refresh chart" className="rounded-lg p-1 hover:bg-white/5 hover:text-white">
                <RefreshCw size={13} />
              </button>
            )}
            {source === 'demo' && (
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--color-text-muted)]">
                DEMO DATA
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`mt-4 ${heightClassName}`}>
        {hasData ? (
          <Candles candles={candles} symbol={symbol} range={range} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            No historical data available for this range.
          </div>
        )}
      </div>
    </section>
  );
}
