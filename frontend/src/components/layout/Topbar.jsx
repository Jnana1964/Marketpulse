import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { searchStocks } from '../../api/watchlistApi';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase();
}

function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return undefined;
    }
    const timeout = setTimeout(async () => {
      try {
        const data = await searchStocks(query);
        setResults(data.slice(0, 6));
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function goTo(symbol) {
    setQuery('');
    setResults([]);
    setOpen(false);
    navigate(`/stocks/${symbol}`);
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-[520px]">
      <div className="flex h-12 items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-4">
        <Search size={17} className="flex-none text-[var(--color-text-muted)]" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) goTo(results[0].symbol);
          }}
          placeholder="Search a stock or company…"
          className="w-full bg-transparent text-base text-white placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
          {results.map((r) => (
            <button
              key={r.symbol}
              onClick={() => goTo(r.symbol)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-white hover:bg-white/5"
            >
              <span className="font-semibold">{r.symbol}</span>
              <span className="truncate pl-3 text-xs text-[var(--color-text-muted)]">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-4 backdrop-blur sm:px-8">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-white/5 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden flex-1 sm:flex">
        <GlobalSearch />
      </div>
      <div className="flex flex-1 sm:hidden" />

      <div className="flex flex-none items-center gap-1.5 sm:gap-3">
        <button
          onClick={() => navigate('/changes')}
          aria-label="What's changed"
          title="What's changed"
          className="rounded-lg p-2 text-[var(--color-text-secondary)] transition hover:bg-white/5 hover:text-white"
        >
          <Bell size={20} />
        </button>

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 transition hover:bg-white/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-xs font-bold text-[var(--color-brand)]">
              {initials(user?.name)}
            </span>
            <span className="hidden text-base font-medium text-white sm:inline">{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={15} className="hidden text-[var(--color-text-muted)] sm:inline" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-2xl">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-white hover:bg-white/5"
              >
                <SettingsIcon size={15} /> Settings
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-[var(--color-negative)] hover:bg-white/5"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
