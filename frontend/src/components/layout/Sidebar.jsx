import { NavLink } from 'react-router-dom';
import { LayoutGrid, Star, Activity, Search, Clock, Settings, X, Leaf } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/watchlist', label: 'Smart Watchlist', icon: Star },
  { to: '/changes', label: "What's Changed", icon: Activity },
  { to: '/search', label: 'Stock Search', icon: Search },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({ to, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive
            ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
            : 'text-[var(--color-text-secondary)] hover:bg-white/[0.04] hover:text-white'
        }`
      }
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <Activity size={20} strokeWidth={2.5} className="text-[var(--color-positive)]" />
            <span className="text-[17px] font-bold tracking-tight text-white">
              Market<span className="text-[var(--color-positive)]">Pulse</span>
            </span>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onClose} />
          ))}
        </nav>

        <div className="px-3 pb-5">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <Leaf size={16} className="text-[var(--color-positive)]" />
            <p className="mt-3 text-xs font-medium leading-relaxed text-[var(--color-text-secondary)]">
              Markets move.
              <br />
              Insights stay.
            </p>
            <div className="mt-3 h-px w-6 bg-[var(--color-positive)]/40" />
          </div>
        </div>
      </aside>
    </>
  );
}
