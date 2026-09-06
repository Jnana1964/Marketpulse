import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { normalizeError } from '../api/apiClient';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(normalizeError(err).message || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-white">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-6">
        <Link to="/" className="flex flex-none items-center gap-2">
          <Activity size={20} strokeWidth={2.5} className="text-[var(--color-positive)]" />
          <span className="text-lg font-bold tracking-tight">
            Market<span className="text-[var(--color-positive)]">Pulse</span>
          </span>
        </Link>
        <p className="flex-none text-xs text-[var(--color-text-secondary)] sm:text-sm">
          <span className="hidden sm:inline">Need an account? </span>
          <Link to="/signup" className="font-semibold text-white hover:underline">
            Sign Up
          </Link>
        </p>
      </header>

      <div className="flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7">
          <h1 className="text-center text-xl font-extrabold text-white">Welcome back</h1>
          <p className="mt-1 text-center text-sm text-[var(--color-text-secondary)]">
            Sign in to see what changed on your watchlist.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-positive)]/50 focus:outline-none"
                autoComplete="email"
              />
            </label>

            <label className="mt-4 block text-xs font-medium text-[var(--color-text-secondary)]">
              Password
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-black/20 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-positive)]/50 focus:outline-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="mt-2 text-right">
              <button type="button" className="text-xs font-medium text-[var(--color-positive)] hover:underline">
                Forgot password?
              </button>
            </div>

            {error && <p className="mt-3 text-xs text-[var(--color-negative)]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-full bg-[var(--color-positive)] py-2.5 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-white hover:underline">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
