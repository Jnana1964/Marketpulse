import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Trash2 } from 'lucide-react';
import { StockAvatar } from '../common/StockAvatar';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatPercentage } from '../../utils/formatPercentage';
import { ImportanceBadge } from '../insights/ImportanceBadge';

function ChangeCell({ value }) {
  if (value === null || value === undefined) return <span className="text-[var(--color-text-muted)]">—</span>;
  const positive = value >= 0;
  return (
    <span className={`tabular-nums font-medium ${positive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
      {formatPercentage(value)}
    </span>
  );
}

function RowMenu({ onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Row actions"
        className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition hover:bg-white/5 hover:text-white"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-2xl">
          <button
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--color-negative)] hover:bg-white/5"
          >
            <Trash2 size={13} /> Remove from list
          </button>
        </div>
      )}
    </div>
  );
}

export function WatchlistTable({ rows, onRemove }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">Stock</th>
              <th className="px-5 py-3 font-medium">Current Price (₹)</th>
              <th className="px-5 py-3 font-medium">Change</th>
              <th className="px-5 py-3 font-medium">Attention</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const change = row.sinceLastChecked?.hasPrevious ? row.sinceLastChecked.changePercent : row.today?.changePercent;
              return (
                <tr key={row.item.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5 text-[var(--color-text-muted)]">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <Link to={`/stocks/${row.item.symbol}`} className="flex items-center gap-2.5">
                      <StockAvatar symbol={row.item.symbol} />
                      <span>
                        <span className="block font-semibold text-white">{row.item.symbol}</span>
                        <span className="block text-xs text-[var(--color-text-muted)]">{row.item.instrumentName}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-white">{formatCurrency(row.quote?.price)}</td>
                  <td className="px-5 py-3.5">
                    <ChangeCell value={change} />
                  </td>
                  <td className="px-5 py-3.5">
                    <ImportanceBadge level={row.attentionLevel} />
                  </td>
                  <td className="px-5 py-3.5 text-right">{onRemove && <RowMenu onRemove={() => onRemove(row.item.id)} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-[var(--color-border)] sm:hidden">
        {rows.map((row) => {
          const change = row.sinceLastChecked?.hasPrevious ? row.sinceLastChecked.changePercent : row.today?.changePercent;
          return (
            <div key={row.item.id} className="flex items-center justify-between px-4 py-3">
              <Link to={`/stocks/${row.item.symbol}`} className="flex min-w-0 items-center gap-2.5">
                <StockAvatar symbol={row.item.symbol} />
                <span className="min-w-0">
                  <span className="block font-semibold text-white">{row.item.symbol}</span>
                  <span className="block tabular-nums text-sm text-[var(--color-text-secondary)]">{formatCurrency(row.quote?.price)}</span>
                  <span className="mt-0.5 block text-xs">
                    <ChangeCell value={change} />
                  </span>
                </span>
              </Link>
              <div className="flex flex-none flex-col items-end gap-2">
                <ImportanceBadge level={row.attentionLevel} />
                {onRemove && <RowMenu onRemove={() => onRemove(row.item.id)} />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
