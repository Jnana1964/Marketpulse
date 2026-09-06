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

function Candles({ candles, symbol, range }) {
  const wrapperRef = useRef(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: 'transparent' },
        textColor: '#64748b',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.2, bottom: 0.2 }, // Prevents candles from filling top-to-bottom
        textColor: '#64748b',
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 12, // Keeps candles slim and properly spaced
        minBarSpacing: 4,
        rightOffset: 6,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(255, 255, 255, 0.15)', style: 2, labelBackgroundColor: '#121a24' },
        horzLine: { color: 'rgba(255, 255, 255, 0.15)', style: 2, labelBackgroundColor: '#121a24' },
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#00f5c4',
      downColor: '#ff4d6d',
      borderVisible: false,
      wickVisible: true,
      wickUpColor: '#00f5c4',
      wickDownColor: '#ff4d6d',
      priceLineVisible: true,
      priceLineColor: '#ff4d6d',
      priceLineStyle: 2,
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
      if (entry) {
        chart.applyOptions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
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
    if (!seriesRef.current || !candles) return;

    const data = candles
      .map((c) => ({
        time: Math.floor(new Date(c.timestamp).getTime() / 1000),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
      }))
      .filter((c) => !isNaN(c.time) && !isNaN(c.open) && !isNaN(c.high) && !isNaN(c.low) && !isNaN(c.close))
      .filter((c, i, arr) => i === 0 || c.time > arr[i - 1].time);

    seriesRef.current.setData(data);

    // Maintain sleek bar width instead of stretching a small dataset to full width
    if (data.length > 0 && chartRef.current) {
      chartRef.current.timeScale().fitContent();
      if (data.length < 40) {
        chartRef.current.timeScale().applyOptions({ barSpacing: 10 });
      }
    }
  }, [candles]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      {hoverInfo && (
        <div
          className="pointer-events-none absolute z-20 rounded-xl border border-white/10 bg-[#121a24] px-3.5 py-2 text-xs shadow-2xl backdrop-blur-md"
          style={{
            left: Math.min(hoverInfo.x + 12, (chartContainerRef.current?.clientWidth || 0) - 170),
            top: Math.max(hoverInfo.y - 70, 8),
          }}
        >
          <p className="font-bold text-[#00f5c4]">
            {symbol} · {range}
          </p>
          <p className="mt-1 tabular-nums text-slate-300">
            O {formatCurrency(hoverInfo.o)} H {formatCurrency(hoverInfo.h)}
          </p>
          <p className="tabular-nums text-slate-300">
            L {formatCurrency(hoverInfo.l)} C {formatCurrency(hoverInfo.c)}
          </p>
        </div>
      )}
      <div ref={chartContainerRef} className="h-full w-full" />
    </div>
  );
}

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
}) {
  const hasData = (candles || []).length > 1;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#090e15] p-5 sm:p-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Timeframe Pill Selector */}
        <div className="inline-flex items-center gap-1 rounded-full bg-[#101822] p-1 border border-white/10">
          {RANGES.map((r) => {
            const active = range === r;
            const disabled = !availableRanges.includes(r);
            return (
              <button
                key={r}
                disabled={disabled}
                onClick={() => onRangeChange(r)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                  active
                    ? 'bg-[#00f5c4] text-[#080e15] shadow-md shadow-[#00f5c4]/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <span className="font-medium">
            Last updated: {timestamp ? formatTimeShort(timestamp) : '3:30 PM'}
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                dataStatus === 'LIVE' ? 'bg-[#00f5c4] animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className={`font-bold ${dataStatus === 'LIVE' ? 'text-[#00f5c4]' : 'text-slate-400'}`}>
              {FRESHNESS_LABEL[dataStatus] || FRESHNESS_LABEL.LIVE}
            </span>
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              aria-label="Refresh chart"
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          )}

          {source === 'demo' && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
              DEMO
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-[400px] xl:h-[450px] w-full">
        {hasData ? (
          <Candles candles={candles} symbol={symbol} range={range} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
            No historical data available for this range.
          </div>
        )}
      </div>
    </section>
  );
}