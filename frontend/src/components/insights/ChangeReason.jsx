import { Info } from 'lucide-react';

/** The deterministic "why this matters" explanation — every insight must have a reason (spec section 18). */
export function ChangeReason({ text }) {
  if (!text) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
      <Info size={13} className="mt-0.5 flex-none text-[var(--color-text-muted)]" />
      <span>{text}</span>
    </p>
  );
}
