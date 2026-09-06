const LABELS = {
  MARKET_OPEN: { label: 'Market open', className: 'text-[var(--color-positive)] bg-[var(--color-positive-soft)]' },
  MARKET_CLOSED: { label: 'Market closed', className: 'text-[var(--color-text-muted)] bg-white/5' },
  PRE_MARKET: { label: 'Pre-market', className: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)]' },
  POST_MARKET: { label: 'Post-market', className: 'text-[var(--color-warning)] bg-[var(--color-warning-soft)]' },
  UNKNOWN: { label: 'Market status unknown', className: 'text-[var(--color-text-muted)] bg-white/5' },
};

export function MarketStatus({ status }) {
  const meta = LABELS[status] || LABELS.UNKNOWN;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>{meta.label}</span>
  );
}
