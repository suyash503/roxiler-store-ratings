import { CircleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '../lib/api';
import { ROLE_LABELS } from '../lib/format';
import type { Role } from '../lib/types';
import { Button } from './Button';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200 ${className}`}>{children}</div>;
}

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  USER: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  STORE_OWNER: 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ROLE_STYLES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Icon className="size-8 text-stone-300" aria-hidden />
      <p className="font-medium text-stone-700">{title}</p>
      {children && <div className="text-sm text-stone-500">{children}</div>}
    </div>
  );
}

/** Error box for a failed load, with a retry button. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof ApiError ? error.message : 'Something went wrong.';
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
      <span className="flex items-center gap-2">
        <CircleAlert className="size-4 shrink-0" aria-hidden />
        {message}
      </span>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** Banner for a failed form submit that isn't tied to one field. */
export function FormError({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;
  return (
    <div role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200">
      {messages.length === 1 ? (
        messages[0]
      ) : (
        <ul className="list-inside list-disc space-y-0.5">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
