import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { PasswordField, SelectField, TextAreaField, TextField } from '../../components/Field';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/toast-context';
import { FormError } from '../../components/ui';
import { api } from '../../lib/api';
import { applyServerErrors } from '../../lib/forms';
import { ROLE_LABELS } from '../../lib/format';
import type { Role, User } from '../../lib/types';
import { createUserSchema, roles, RULES, type CreateUserInput } from '../../lib/validation';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultRole?: Role;
}

export function AddUserDialog({ open, onClose, defaultRole = 'USER' }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({ resolver: zodResolver(createUserSchema), mode: 'onTouched', defaultValues: { role: defaultRole } });

  useEffect(() => {
    if (open) reset({ role: defaultRole });
  }, [open, defaultRole, reset]);

  const close = () => {
    reset();
    setFormError([]);
    onClose();
  };

  const create = useMutation({
    mutationFn: (input: CreateUserInput) => api.post<User>('/users', input),
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      void queryClient.invalidateQueries({ queryKey: ['owners-available'] });
      toast(`Added ${user.name} as ${ROLE_LABELS[user.role].toLowerCase()}`);
      close();
    },
    onError: (error) =>
      setFormError(
        applyServerErrors(error, setError, {
          name: /^Name/,
          email: /email/i,
          address: /^Address/,
          password: /^Password/,
          role: /^Role/,
        }),
      ),
  });

  return (
    <Modal open={open} onClose={close} title="Add user" description="Create a normal user, an admin, or a store owner.">
      <form
        onSubmit={handleSubmit((input) => {
          setFormError([]);
          create.mutate(input);
        })}
        noValidate
        className="space-y-4"
      >
        <FormError messages={formError} />
        <SelectField label="Role" error={errors.role?.message} {...register('role')}>
          {roles.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Full name"
          counterMax={RULES.name.max}
          hint={`${RULES.name.min}–${RULES.name.max} characters`}
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField label="Email" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
        <TextAreaField label="Address" rows={2} counterMax={RULES.address.max} error={errors.address?.message} {...register('address')} />
        <PasswordField label="Password" autoComplete="new-password" showChecklist error={errors.password?.message} {...register('password')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Add user
          </Button>
        </div>
      </form>
    </Modal>
  );
}
