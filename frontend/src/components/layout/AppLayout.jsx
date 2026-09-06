import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * Desktop: fixed sidebar + flexible content, with one persistent topbar
 * (search / notifications / theme / account) shared across every
 * authenticated page. Mobile: sidebar becomes an overlay drawer.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <Outlet />
      </div>
    </div>
  );
}
