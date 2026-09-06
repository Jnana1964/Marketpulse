import { useCallback, useEffect, useRef, useState } from 'react';
import { usePageVisibility } from './usePageVisibility';

/**
 * Generic polling hook for market-dependent data (dashboard, stock detail).
 *
 * - Refetches on an interval, but only while the tab is visible — no
 *   pointless polling in a background tab (spec section 40/41).
 * - Refetches immediately the moment the tab becomes visible again.
 * - Exposes a manual `refresh()` for the explicit refresh button.
 *
 * `fetchFn` is called with no arguments; wrap it (e.g. via useCallback at
 * the call site) if it needs to close over changing params.
 */
export function useMarketData(fetchFn, { intervalMs = 30000, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const isVisible = usePageVisibility();
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchFnRef.current();
      setData(result);
      setError(null);
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + reload whenever `enabled` flips on.
  useEffect(() => {
    if (enabled) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Interval polling, paused while the tab is hidden.
  useEffect(() => {
    if (!enabled || !isVisible || !intervalMs) return undefined;
    const id = setInterval(() => load({ silent: true }), intervalMs);
    return () => clearInterval(id);
  }, [enabled, isVisible, intervalMs, load]);

  // Refresh immediately when the tab becomes visible again.
  const wasVisible = useRef(isVisible);
  useEffect(() => {
    if (enabled && isVisible && !wasVisible.current) {
      load({ silent: true });
    }
    wasVisible.current = isVisible;
  }, [isVisible, enabled, load]);

  return { data, loading, error, lastUpdatedAt, refresh: () => load({ silent: true }) };
}
