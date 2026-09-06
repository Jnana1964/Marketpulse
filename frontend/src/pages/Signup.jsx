import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { normalizeError } from '../api/apiClient';

function PasswordField({ label, value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <label className="mt-5 block text-base font-medium text-[var(--color-text-secondary)]">
      {label}
      <div className="relative mt-2">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-[52px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 pr-11 text-base text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard', { replace: true });
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
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-white hover:underline">
              Sign In
            </Link>
          </p>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 pb-10">
          <div className="w-full max-w-[500px]">
            <h1 className="text-3xl font-extrabold text-white">Create your account</h1>
            <p className="mt-2 text-base text-[var(--color-text-secondary)]">
              Start understanding the market with more clarity.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              <label className="block text-base font-medium text-[var(--color-text-secondary)]">
                Full Name
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="mt-2 h-[52px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-base text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
                />
              </label>

              <label className="mt-5 block text-base font-medium text-[var(--color-text-secondary)]">
                Email Address
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="mt-2 h-[52px] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-base text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
                />
              </label>

              <PasswordField
                label="Password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
              <PasswordField
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                autoComplete="new-password"
              />

              {error && <p className="mt-3 text-sm text-[var(--color-negative)]">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 h-[52px] w-full rounded-lg bg-[var(--color-brand)] text-base font-bold text-[#071011] transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>

              <p className="mt-5 text-center text-sm text-[var(--color-text-secondary)]">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-white hover:underline">
                  Sign In
                </Link>
              </p>
              <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
                By continuing you agree this is a market-intelligence tool, not investment advice.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
