import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Check } from 'lucide-react';
import { StockAvatar } from '../components/common/StockAvatar';
import { EmptyState } from '../components/dashboard/EmptyState';
import { searchStocks, addWatchlistItem } from '../api/watchlistApi';
import { fetchDashboard } from '../api/insightApi';

export function StockSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchlistId, setWatchlistId] = useState(null);
  const [existingSymbols, setExistingSymbols] = useState([]);
  const [adding, setAdding] = useState(null);
  const [justAdded, setJustAdded] = useState([]);

  useEffect(() => {
    fetchDashboard()
      .then((data) => {
        setWatchlistId(data.watchlist?.id);
        setExistingSymbols((data.watchlistPreview || []).map((r) => r.item.symbol));
      })
      .catch(() => {});
  }, []);

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
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleAdd(instrument) {
    if (!watchlistId) return;
    setAdding(instrument.symbol);
    try {
      await addWatchlistItem(watchlistId, instrument);
      setJustAdded((prev) => [...prev, instrument.symbol]);
    } catch {
      // Silently ignore — the row's Add button simply stays available to retry.
    } finally {
      setAdding(null);
    }
  }

  const added = new Set([...existingSymbols, ...justAdded]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Stock Search</p>
      <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Look up any company.</h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Search MarketPulse's supported NSE stock universe and add what you want to track.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
        <Search size={16} className="text-[var(--color-text-muted)]" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by symbol or company name, e.g. RELIANCE or Infosys"
          className="w-full bg-transparent text-sm text-white placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
      </div>

      <div className="mt-4">
        {loading && <p className="text-sm text-[var(--color-text-muted)]">Searching…</p>}

        {!loading && query && results.length === 0 && (
          <EmptyState
            icon={Search}
            title="No matches."
            description="No results in MarketPulse's supported stock universe."
          />
        )}

        {!loading && !query && (
          <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">
            Start typing a symbol or company name to search.
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2">
            {results.map((instrument) => {
              const isAdded = added.has(instrument.symbol);
              return (
                <div
                  key={instrument.symbol}
                  className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
                >
                  <Link to={`/stocks/${instrument.symbol}`} className="flex min-w-0 items-center gap-3">
                    <StockAvatar symbol={instrument.symbol} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{instrument.symbol}</span>
                      <span className="block truncate text-xs text-[var(--color-text-muted)]">
                        {instrument.name} · {instrument.exchange}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    disabled={isAdded || adding === instrument.symbol || !watchlistId}
                    onClick={() => handleAdd(instrument)}
                    className={`flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                      isAdded
                        ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
                        : 'bg-[var(--color-positive)] text-black hover:opacity-90 disabled:opacity-50'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={13} /> Added
                      </>
                    ) : (
                      <>
                        <Plus size={13} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
