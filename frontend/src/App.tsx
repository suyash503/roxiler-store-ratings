import { Route, Routes } from 'react-router';
import { GuestOnly, HomeRedirect, RequireAuth } from './auth/guards';
import { AppShell } from './components/AppShell';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminStoresPage } from './pages/admin/AdminStoresPage';
import { AdminUserDetailPage } from './pages/admin/AdminUserDetailPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { StoresPage } from './pages/user/StoresPage';

export function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<AppShell />}>
          <Route path="/account/password" element={<ChangePasswordPage />} />

          <Route element={<RequireAuth roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/stores" element={<AdminStoresPage />} />
          </Route>

          <Route element={<RequireAuth roles={['USER']} />}>
            <Route path="/stores" element={<StoresPage />} />
          </Route>

          <Route element={<RequireAuth roles={['STORE_OWNER']} />}>
            <Route path="/owner" element={<OwnerDashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
