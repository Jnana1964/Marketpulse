/**
 * Deterministic per-symbol avatar styling. We deliberately do NOT try to
 * reproduce real company logos/brand marks here — a plain initials badge
 * avoids any trademark concerns while still giving each row a distinct,
 * stable visual identity (same symbol always gets the same color).
 */
const PALETTE = [
  { bg: 'rgba(45, 212, 191, 0.16)', text: '#2dd4bf' },
  { bg: 'rgba(96, 165, 250, 0.16)', text: '#60a5fa' },
  { bg: 'rgba(244, 114, 182, 0.16)', text: '#f472b6' },
  { bg: 'rgba(250, 204, 21, 0.16)', text: '#facc15' },
  { bg: 'rgba(167, 139, 250, 0.16)', text: '#a78bfa' },
  { bg: 'rgba(251, 146, 60, 0.16)', text: '#fb923c' },
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function stockInitials(symbol = '') {
  return symbol.slice(0, 2).toUpperCase();
}

export function stockColors(symbol = '') {
  return PALETTE[hash(symbol) % PALETTE.length];
}
