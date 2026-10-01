import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ME_KEY } from '../auth/auth';
import { Button } from '../components/Button';
import { PasswordField } from '../components/Field';
import { useToast } from '../components/toast-context';
import { Card, FormError, PageHeader } from '../components/ui';
import { api } from '../lib/api';
import { applyServerErrors } from '../lib/forms';
import type { User } from '../lib/types';
import { changePasswordSchema, type ChangePasswordInput } from '../lib/validation';

export function ChangePasswordPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema), mode: 'onTouched' });

  const change = useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordInput) =>
      api.patch<User>('/auth/password', { currentPassword, newPassword }),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
      reset();
      toast('Password updated. Other devices have been signed out.');
    },
    onError: (error) =>
      setFormError(
        applyServerErrors(error, setError, { currentPassword: /^Current password/, newPassword: /password/i }),
      ),
  });

  return (
    <>
      <PageHeader title="Change password" description="Updating your password signs you out everywhere else." />
      <Card className="max-w-lg">
        <form
          onSubmit={handleSubmit((input) => {
            setFormError([]);
            change.mutate(input);
          })}
          noValidate
          className="space-y-5"
        >
          <FormError messages={formError} />
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <PasswordField
            label="New password"
            autoComplete="new-password"
            showChecklist
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={change.isPending}>
            Update password
          </Button>
        </form>
      </Card>
    </>
  );
}
