import { formatCurrency } from '../../utils/formatCurrency';

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

export function StockStats({ quote }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-white">Key data</h3>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Open" value={formatCurrency(quote?.open)} />
        <Stat label="High" value={formatCurrency(quote?.high)} />
        <Stat label="Low" value={formatCurrency(quote?.low)} />
        <Stat label="Previous Close" value={formatCurrency(quote?.previousClose)} />
      </div>
    </section>
  );
}
