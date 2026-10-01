import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageSpinner } from '../components/Spinner';
import { HOME_PATH } from '../lib/format';
import type { Role } from '../lib/types';
import { useMe } from './auth';

/** Renders child routes only for a logged-in user with one of `roles` (any role if omitted). */
export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { data: user, isPending } = useMe();
  const location = useLocation();

  if (isPending) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME_PATH[user.role]} replace />;
  return <Outlet />;
}

/** Login and signup: a logged-in user goes straight to their home page. */
export function GuestOnly() {
  const { data: user, isPending } = useMe();
  if (isPending) return <FullPageSpinner />;
  if (user) return <Navigate to={HOME_PATH[user.role]} replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { data: user } = useMe();
  return <Navigate to={user ? HOME_PATH[user.role] : '/login'} replace />;
}
