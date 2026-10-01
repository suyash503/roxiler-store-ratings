import type { Role } from './types';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  USER: 'Normal user',
  STORE_OWNER: 'Store owner',
};

/** Where each role lands after logging in. */
export const HOME_PATH: Record<Role, string> = {
  ADMIN: '/admin',
  USER: '/stores',
  STORE_OWNER: '/owner',
};

export function formatRating(value: number | null | undefined): string {
  return value == null ? '—' : value.toFixed(1);
}

const dateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

export function plural(count: number, word: string): string {
  return `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`;
}
