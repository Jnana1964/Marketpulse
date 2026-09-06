import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg)] text-center text-white">
      <p className="text-5xl font-extrabold">404</p>
      <p className="text-sm text-[var(--color-text-secondary)]">This page doesn't exist.</p>
      <Link to="/dashboard" className="mt-2 rounded-lg bg-[var(--color-positive)] px-4 py-2 text-xs font-semibold text-black hover:opacity-90">
        Back to Dashboard
      </Link>
    </div>
  );
}
