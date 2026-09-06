import { formatClockTime } from '../../utils/formatTime';

export function ChangeTimeline({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-white">Recent changes</h3>
      <ol className="mt-4 space-y-4 border-l border-[var(--color-border)] pl-4">
        {items.map((entry, index) => (
          <li key={index} className="relative">
            <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-white/25" />
            <p className="text-xs font-semibold text-[var(--color-text-muted)] tabular-nums">
              {formatClockTime(entry.time)}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">{entry.label}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
