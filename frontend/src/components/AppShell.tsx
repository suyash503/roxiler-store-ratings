import { KeyRound, LogOut } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useCurrentUser, useLogout } from '../auth/auth';
import { HOME_PATH } from '../lib/format';
import type { Role } from '../lib/types';
import { Logo } from './Logo';
import { RoleBadge } from './ui';

const NAV: Record<Role, { to: string; label: string; end?: boolean }[]> = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/stores', label: 'Stores' },
  ],
  USER: [{ to: '/stores', label: 'Stores' }],
  STORE_OWNER: [{ to: '/owner', label: 'My store' }],
};

export function AppShell() {
  const user = useCurrentUser();
  const logout = useLogout();
  const navigate = useNavigate();

  const links = NAV[user.role].map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
          isActive ? 'bg-stone-100 text-stone-900' : 'text-stone-600 hover:text-stone-900'
        }`
      }
    >
      {item.label}
    </NavLink>
  ));

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link to={HOME_PATH[user.role]} className="shrink-0 rounded-lg" aria-label="StoreRate home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {links}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <div className="hidden text-right leading-tight md:block">
              <p className="max-w-56 truncate text-sm font-medium text-stone-800">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
            <Link
              to="/account/password"
              className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              title="Change password"
            >
              <KeyRound className="size-4" aria-hidden />
              <span className="sr-only">Change password</span>
            </Link>
            <button
              type="button"
              onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Log out</span>
              <span className="sr-only sm:hidden">Log out</span>
            </button>
          </div>
        </div>
        {NAV[user.role].length > 1 && (
          <nav className="flex gap-1 overflow-x-auto border-t border-stone-100 px-4 py-2 sm:hidden" aria-label="Main">
            {links}
          </nav>
        )}
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
