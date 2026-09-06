import { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';
import { searchStocks } from '../../api/watchlistApi';
import { StockCard } from './StockCard';

/**
 * Premium "Add Stock" modal. Search results come from the backend's
 * configured instrument universe, not a live Groww search endpoint — see
 * README "Limitations" for why (Groww doesn't publish one).
 */
export function StockSearch({ onAdd, onClose, existingSymbols = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return undefined;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const data = await searchStocks(query);
        setResults(data);
        setError(null);
      } catch {
        setError('Search is unavailable right now.');
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleAdd(instrument) {
    setAdding(instrument.symbol);
    try {
      await onAdd(instrument);
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <Search size={16} className="text-[var(--color-text-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NSE stocks..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
          <button onClick={onClose} aria-label="Close" className="text-[var(--color-text-muted)] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading && <p className="px-3 py-4 text-xs text-[var(--color-text-muted)]">Searching…</p>}
          {!loading && error && <p className="px-3 py-4 text-xs text-[var(--color-negative)]">{error}</p>}
          {!loading && !error && query && results.length === 0 && (
            <p className="px-3 py-4 text-xs text-[var(--color-text-muted)]">
              No matches in MarketPulse's supported stock universe.
            </p>
          )}
          {!loading &&
            results.map((instrument) => (
              <StockCard
                key={instrument.symbol}
                instrument={instrument}
                disabled={existingSymbols.includes(instrument.symbol) || adding === instrument.symbol}
                onAdd={handleAdd}
              />
            ))}
          {!query && (
            <p className="px-3 py-4 text-xs text-[var(--color-text-muted)]">
              Start typing a symbol or company name, e.g. "RELIANCE" or "Infosys".
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
