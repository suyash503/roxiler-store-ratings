import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { useLogin } from '../../auth/auth';
import { Button } from '../../components/Button';
import { PasswordField, TextField } from '../../components/Field';
import { FormError } from '../../components/ui';
import { ApiError } from '../../lib/api';
import { HOME_PATH, ROLE_LABELS } from '../../lib/format';
import type { Role } from '../../lib/types';
import { loginSchema, type LoginInput } from '../../lib/validation';
import { AuthLayout } from './AuthLayout';

/** Seeded accounts (backend/prisma/seed.ts), shown so reviewers can try each role in one click. */
const DEMO_ACCOUNTS: { role: Role; email: string; password: string }[] = [
  { role: 'ADMIN', email: 'admin@example.com', password: 'Admin@1234' },
  { role: 'STORE_OWNER', email: 'rajeshwari@example.com', password: 'Owner@1234' },
  { role: 'USER', email: 'user@example.com', password: 'User@1234' },
];
const showDemoAccounts = import.meta.env.VITE_HIDE_DEMO_ACCOUNTS !== 'true';

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((input) => {
    setFormError([]);
    login.mutate(input, {
      onSuccess: (user) => {
        // Go back to the page that sent us here, unless it belongs to another role.
        const from = (location.state as { from?: string } | null)?.from;
        const home = HOME_PATH[user.role];
        const allowed = from && (from.startsWith(home) || from.startsWith('/account'));
        navigate(allowed ? from : home, { replace: true });
      },
      onError: (error) => setFormError(error instanceof ApiError ? error.messages : ['Something went wrong.']),
    });
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to rate stores or manage your dashboard."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-brand-700 hover:text-brand-800">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormError messages={formError} />
        <TextField label="Email" type="email" autoComplete="email" autoFocus error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" loading={login.isPending}>
          Log in
        </Button>
      </form>

      {showDemoAccounts && (
        <div className="mt-6 border-t border-stone-100 pt-5">
          <p className="mb-2 text-xs font-medium tracking-wide text-stone-500 uppercase">Demo accounts</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => {
                  setValue('email', account.email, { shouldValidate: true });
                  setValue('password', account.password, { shouldValidate: true });
                }}
                className="rounded-lg px-2 py-2 text-xs font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 hover:ring-stone-300"
              >
                {ROLE_LABELS[account.role]}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
