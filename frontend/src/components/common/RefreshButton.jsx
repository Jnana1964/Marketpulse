import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export function RefreshButton({ onRefresh, className = '' }) {
  const [spinning, setSpinning] = useState(false);

  async function handleClick() {
    setSpinning(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setSpinning(false), 400);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition hover:border-white/20 hover:text-white ${className}`}
    >
      <RefreshCw size={14} className={spinning ? 'animate-spin' : ''} />
      Refresh
    </button>
  );
}
