import { useNavigate } from 'react-router-dom';
import { StockAvatar } from '../common/StockAvatar';
import { ImportanceBadge } from '../insights/ImportanceBadge';

export function AttentionCard({ result }) {
  const { item, attentionLevel, whyItMatters } = result;
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/stocks/${item.symbol}`)}
      className="animate-entrance flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-left transition hover:border-white/20"
    >
      <StockAvatar symbol={item.symbol} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-white">{item.symbol}</p>
          <ImportanceBadge level={attentionLevel} />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{whyItMatters}</p>
      </div>
    </button>
  );
}
