const STYLES = {
  HIGH_PRIORITY: 'bg-[var(--color-negative-soft)] text-[var(--color-negative)]',
  IMPORTANT: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  MODERATE: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
  LOW: 'bg-white/5 text-[var(--color-text-muted)]',
};

/** Deliberately calm language — no "BUY NOW" / "URGENT" (spec section 17). */
export function ImportanceBadge({ level, score, showScore = false }) {
  if (!level) return null;
  const className = STYLES[level.key] || STYLES.LOW;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold ${className}`}>
      {level.label}
      {showScore && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

