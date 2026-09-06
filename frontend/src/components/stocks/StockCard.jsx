import { Plus } from 'lucide-react';
import { StockAvatar } from '../common/StockAvatar';

/** A single search-result row inside the "Add Stock" modal (spec section 28). */
export function StockCard({ instrument, onAdd, disabled }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-white/5">
      <div className="flex min-w-0 items-center gap-2.5">
        <StockAvatar symbol={instrument.symbol} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{instrument.symbol}</p>
          <p className="truncate text-xs text-[var(--color-text-muted)]">
            {instrument.name} · {instrument.exchange}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAdd(instrument)}
        className="flex flex-none items-center gap-1 rounded-lg bg-[var(--color-positive)] px-3 py-1.5 text-xs font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
      >
        <Plus size={13} /> Add
      </button>
    </div>
  );
}
