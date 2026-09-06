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
    <div className="flex min-h-screen bg-[var(--color-bg)] text-white">
      {/* Left: brand atmosphere — ~45% */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] p-10 lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-brand-glow" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <Link to="/" className="relative flex items-center gap-2">
          <Activity size={22} strokeWidth={2.5} className="text-[var(--color-brand)]" />
          <span className="text-xl font-bold tracking-tight">
            Market<span className="text-[var(--color-brand)]">Pulse</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            Understand the market.
            <br />
            Focus on what matters.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-text-secondary)]">
            Track meaningful market movements and understand why they happen.
          </p>
        </div>

        <p className="relative text-xs text-[var(--color-text-muted)]">
          Market information is provided for informational purposes only and does not constitute investment advice.
        </p>
      </div>

      {/* Right: form — ~55% */}
      <div className="flex w-full flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 px-6 py-6 lg:justify-end lg:px-10">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Activity size={20} strokeWidth={2.5} className="text-[var(--color-brand)]" />
            <span className="text-lg font-bold tracking-tight">
              Market<span className="text-[var(--color-brand)]">Pulse</span>
            </span>
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Need an account?{' '}
            <Link to="/signup" className="font-semibold text-white hover:underline">
              Sign Up
            </Link>
          </p>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-[500px]">
            <h1 className="text-3xl font-extrabold text-white">Welcome back</h1>
            <p className="mt-2 text-base text-[var(--color-text-secondary)]">Sign in to continue to MarketPulse.</p>

            <form onSubmit={handleSubmit} className="mt-8">
              <label className="block text-base font-medium text-[var(--color-text-secondary)]">
                Email Address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="mt-2 h-[52px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-base text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
                  autoComplete="email"
                />
              </label>

              <label className="mt-5 block text-base font-medium text-[var(--color-text-secondary)]">
                Password
                <div className="relative mt-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-[52px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 pr-11 text-base text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <div className="mt-2 text-right">
                <button type="button" className="text-sm font-medium text-[var(--color-brand)] hover:underline">
                  Forgot password?
                </button>
              </div>

              {error && <p className="mt-3 text-sm text-[var(--color-negative)]">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 h-[52px] w-full rounded-lg bg-[var(--color-brand)] text-base font-bold text-[#071011] transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="mt-5 text-center text-sm text-[var(--color-text-secondary)]">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-white hover:underline">
                  Create an account
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
