import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--color-bg)] text-center text-white">
      <p className="text-6xl font-extrabold">404</p>
      <p className="text-lg font-semibold text-white">Page not found</p>
      <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-[#071011] transition hover:bg-[var(--color-brand-hover)]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
