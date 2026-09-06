import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchSettings, updateSettings } from '../api/insightApi';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase();
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:p-7">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-[var(--color-brand)]' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

export function Settings() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await fetchSettings();
    setSettings(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try {
      await updateSettings(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-8 sm:px-8 lg:px-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Preferences</p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">Settings</h1>
          <p className="mt-1 text-base text-[var(--color-text-secondary)]">Manage your MarketPulse preferences.</p>
        </div>
        {saving && <span className="text-xs text-[var(--color-text-muted)]">Saving…</span>}
      </div>

      <Section title="Account">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-base font-bold text-[var(--color-brand)]">
            {initials(user?.name)}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
          </div>
        </div>

        <label className="mt-5 block text-xs font-medium text-[var(--color-text-secondary)]">
          Full name
          <input
            value={user?.name || ''}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-[var(--color-border)] bg-black/20 px-3 py-2.5 text-sm text-white opacity-80"
          />
        </label>
        <label className="mt-4 block text-xs font-medium text-[var(--color-text-secondary)]">
          Email
          <input
            value={user?.email || ''}
            disabled
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-[var(--color-border)] bg-black/20 px-3 py-2.5 text-sm text-white opacity-80"
          />
        </label>
      </Section>

      {!settings ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
      ) : (
        <>
          <Section title="Notifications &amp; Data Refresh">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Auto refresh</p>
                <p className="text-xs text-[var(--color-text-muted)]">Automatically pull fresh market data while you're viewing a page.</p>
              </div>
              <Toggle checked={settings.autoRefresh} onChange={(v) => save({ autoRefresh: v })} />
            </div>
            <div>
              <p className="text-sm text-white">Refresh interval</p>
              <div className="mt-2 flex gap-2">
                {[30, 60].map((secs) => (
                  <button
                    key={secs}
                    onClick={() => save({ refreshIntervalSeconds: secs })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      settings.refreshIntervalSeconds === secs ? 'bg-[var(--color-brand)] text-[#071011]' : 'bg-white/5 text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {secs} seconds
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Change Sensitivity">
            <p className="text-xs text-[var(--color-text-muted)]">
              Affects how easily a move counts as meaningful. Higher sensitivity surfaces smaller moves.
            </p>
            <div className="flex gap-2">
              {['LOW', 'MEDIUM', 'HIGH'].map((level) => (
                <button
                  key={level}
                  onClick={() => save({ changeSensitivity: level })}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition ${
                    settings.changeSensitivity === level ? 'bg-[var(--color-brand)] text-[#071011]' : 'bg-white/5 text-[var(--color-text-secondary)]'
                  }`}
                >
                  {level.toLowerCase()}
                </button>
              ))}
            </div>
          </Section>
        </>
      )}

      <button
        onClick={logout}
        className="w-full rounded-xl border border-[var(--color-negative)]/30 py-3 text-sm font-semibold text-[var(--color-negative)] transition hover:bg-[var(--color-negative-soft)]"
      >
        Log out
      </button>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        Market information is provided for informational purposes only and does not constitute investment advice.
      </p>
    </main>
  );
}
