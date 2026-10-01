import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/Button';
import { SelectField, TextAreaField, TextField } from '../../components/Field';
import { Modal } from '../../components/Modal';
import { useToast } from '../../components/toast-context';
import { FormError } from '../../components/ui';
import { api } from '../../lib/api';
import { applyServerErrors } from '../../lib/forms';
import type { Page, User } from '../../lib/types';
import { createStoreSchema, RULES, type CreateStoreInput } from '../../lib/validation';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Opens the "add user" dialog when there's no free store owner to pick. */
  onAddOwner: () => void;
}

export function AddStoreDialog({ open, onClose, onAddOwner }: Props) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formError, setFormError] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateStoreInput>({ resolver: zodResolver(createStoreSchema), mode: 'onTouched', defaultValues: { ownerId: '' } });

  // Store owners who don't have a store yet.
  const owners = useQuery({
    queryKey: ['owners-available'],
    queryFn: () => api.get<Page<User>>('/users', { withoutStore: true, sortBy: 'name', pageSize: 100 }),
    enabled: open,
  });

  const close = () => {
    reset();
    setFormError([]);
    onClose();
  };

  const create = useMutation({
    mutationFn: (input: CreateStoreInput) => api.post('/stores', { ...input, ownerId: Number(input.ownerId) }),
    onSuccess: (_store, input) => {
      void queryClient.invalidateQueries({ queryKey: ['stores'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      void queryClient.invalidateQueries({ queryKey: ['owners-available'] });
      void queryClient.invalidateQueries({ queryKey: ['user'] });
      toast(`Added ${input.name}`);
      close();
    },
    onError: (error) =>
      setFormError(
        applyServerErrors(error, setError, { name: /^Name/, email: /email/i, address: /^Address/, ownerId: /owner/i }),
      ),
  });

  const noOwners = owners.data?.items.length === 0;

  return (
    <Modal open={open} onClose={close} title="Add store" description="Each store belongs to one store owner.">
      <form
        onSubmit={handleSubmit((input) => {
          setFormError([]);
          create.mutate(input);
        })}
        noValidate
        className="space-y-4"
      >
        <FormError messages={formError} />
        <TextField
          label="Store name"
          counterMax={RULES.name.max}
          hint={`${RULES.name.min}–${RULES.name.max} characters`}
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField label="Store email" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
        <TextAreaField label="Address" rows={2} counterMax={RULES.address.max} error={errors.address?.message} {...register('address')} />
        <SelectField
          label="Owner"
          disabled={owners.isPending || noOwners}
          error={errors.ownerId?.message}
          hint={
            noOwners ? (
              <>
                Every store owner already has a store.{' '}
                <button type="button" onClick={onAddOwner} className="font-medium text-brand-700 underline hover:text-brand-800">
                  Add a store owner
                </button>{' '}
                first.
              </>
            ) : (
              'Only store owners without a store are listed.'
            )
          }
          {...register('ownerId')}
        >
          <option value="">{owners.isPending ? 'Loading owners…' : 'Choose a store owner'}</option>
          {owners.data?.items.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name} ({owner.email})
            </option>
          ))}
        </SelectField>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending} disabled={noOwners}>
            Add store
          </Button>
        </div>
      </form>
    </Modal>
  );
}
