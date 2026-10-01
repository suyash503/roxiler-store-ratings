import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';

/**
 * Puts each server validation message on the field it's about (matched by
 * keyword, e.g. "An account with this email already exists" → email) and
 * returns the rest for a form-level banner.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Partial<Record<Path<T>, RegExp>>,
): string[] {
  if (!(error instanceof ApiError)) return ['Something went wrong. Please try again.'];

  const unmatched: string[] = [];
  const claimed = new Set<string>();
  for (const message of error.messages) {
    const field = (Object.entries(fields) as [Path<T>, RegExp][]).find(([, pattern]) => pattern.test(message))?.[0];
    if (field && !claimed.has(field)) {
      claimed.add(field);
      setError(field, { type: 'server', message });
    } else if (!field) {
      unmatched.push(message);
    }
  }
  return unmatched;
}
