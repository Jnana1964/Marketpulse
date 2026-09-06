import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';
import { ImportanceBadge } from './ImportanceBadge';
import { StockAvatar } from '../common/StockAvatar';
import { formatPercentage } from '../../utils/formatPercentage';
import { formatCurrency } from '../../utils/formatCurrency';

export function InsightCard({ change }) {
  const {
    symbol,
    instrument_name: instrumentName,
    current_value: currentValue,
    change_percentage: changePercentage,
    attentionLevel,
    message,
  } = change;

  const pct = changePercentage === null || changePercentage === undefined ? null : Number(changePercentage);
  const positive = (pct ?? 0) >= 0;

  return (
    <Link
      to={`/stocks/${symbol}`}
      className="animate-entrance flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:border-white/20 sm:p-5"
    >
      <StockAvatar symbol={symbol} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{symbol}</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">{instrumentName || symbol}</p>
      </div>

      <div className="flex-none text-right">
        <p className={`tabular-nums text-sm font-semibold ${positive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
          {pct === null ? '—' : formatPercentage(pct)}
        </p>
        <p className="tabular-nums text-xs text-[var(--color-text-muted)]">{formatCurrency(currentValue)}</p>
      </div>

      <span className={`flex-none ${positive ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'}`}>
        {positive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
      </span>

      <p className="hidden min-w-0 max-w-[220px] flex-1 truncate text-sm text-[var(--color-text-secondary)] md:block">
        {message}
      </p>

      <ImportanceBadge level={attentionLevel} />
      <ChevronRight size={16} className="flex-none text-[var(--color-text-muted)]" />
    </Link>
  );
}
