export function timeAgo(input) {
  if (!input) return null;
  const then = new Date(input).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec} second${diffSec === 1 ? '' : 's'} ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? '' : 's'} ago`;
}

export function formatClockTime(input) {
  if (!input) return '—';
  return new Date(input).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatTimeShort(input) {
  if (!input) return '—';
  const date = new Date(input);
  const isToday = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return isToday ? `Today, ${time}` : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${time}`;
}

export function formatDateTime(input) {
  if (!input) return '—';
  return new Date(input).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
