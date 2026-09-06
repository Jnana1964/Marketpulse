const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return inr.format(Number(value));
}

export function formatSignedCurrency(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${inr.format(Math.abs(n))}`;
}
