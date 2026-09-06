export function formatPercentage(value, { withSign = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const sign = withSign && n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toFixed(2)}%`;
}

export function changeDirection(value) {
  if (value === null || value === undefined || Number(value) === 0) return 'neutral';
  return Number(value) > 0 ? 'up' : 'down';
}
