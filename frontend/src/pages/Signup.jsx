import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { normalizeError } from '../api/apiClient';

function PasswordField({ label, value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <label className="mt-4 block text-xs font-medium text-[var(--color-text-secondary)]">
      {label}
      <div className="relative mt-1">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[var(--color-border)] bg-black/20 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-positive)]/50 focus:outline-none"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
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
    <div className="min-h-screen bg-[var(--color-bg)] text-white">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-6">
        <Link to="/" className="flex flex-none items-center gap-2">
          <Activity size={20} strokeWidth={2.5} className="text-[var(--color-positive)]" />
          <span className="text-lg font-bold tracking-tight">
            Market<span className="text-[var(--color-positive)]">Pulse</span>
          </span>
        </Link>
        <p className="flex-none text-xs text-[var(--color-text-secondary)] sm:text-sm">
          <span className="hidden sm:inline">Already registered? </span>
          <Link to="/login" className="font-semibold text-white hover:underline">
            Sign In
          </Link>
        </p>
      </header>

      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7">
          <h1 className="text-center text-xl font-extrabold text-white">Create your account</h1>
          <p className="mt-1 text-center text-sm text-[var(--color-text-secondary)]">
            Set up your watchlist and start seeing what deserves your attention.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
              Full name
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-positive)]/50 focus:outline-none"
              />
            </label>

            <label className="mt-4 block text-xs font-medium text-[var(--color-text-secondary)]">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-positive)]/50 focus:outline-none"
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
              label="Confirm password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              autoComplete="new-password"
            />

            {error && <p className="mt-3 text-xs text-[var(--color-negative)]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-full bg-[var(--color-positive)] py-2.5 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-white hover:underline">
                Sign In
              </Link>
            </p>
            <p className="mt-3 text-center text-[11px] text-[var(--color-text-muted)]">
              By continuing you agree this is a market-intelligence tool, not investment advice.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
