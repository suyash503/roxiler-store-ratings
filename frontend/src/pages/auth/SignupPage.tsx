import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { useSignup } from '../../auth/auth';
import { Button } from '../../components/Button';
import { PasswordField, TextAreaField, TextField } from '../../components/Field';
import { FormError } from '../../components/ui';
import { applyServerErrors } from '../../lib/forms';
import { RULES, signupSchema, type SignupInput } from '../../lib/validation';
import { AuthLayout } from './AuthLayout';

export function SignupPage() {
  const signup = useSignup();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema), mode: 'onTouched' });

  const onSubmit = handleSubmit((input) => {
    setFormError([]);
    signup.mutate(input, {
      onSuccess: () => navigate('/stores', { replace: true }),
      onError: (error) =>
        setFormError(
          applyServerErrors(error, setError, { name: /^Name/, email: /email/i, address: /^Address/, password: /^Password/ }),
        ),
    });
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to rate the stores you visit."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormError messages={formError} />
        <TextField
          label="Full name"
          autoComplete="name"
          autoFocus
          counterMax={RULES.name.max}
          hint={`${RULES.name.min}–${RULES.name.max} characters`}
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextAreaField
          label="Address"
          autoComplete="street-address"
          counterMax={RULES.address.max}
          error={errors.address?.message}
          {...register('address')}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          showChecklist
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" loading={signup.isPending}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
