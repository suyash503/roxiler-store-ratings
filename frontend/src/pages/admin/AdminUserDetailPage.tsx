import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Store } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { RatingSummary } from '../../components/StarRating';
import { Card, ErrorState, RoleBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import type { UserDetail } from '../../lib/types';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-stone-500">{label}</dt>
      <dd className="text-sm break-words text-stone-900">{children}</dd>
    </div>
  );
}

export function AdminUserDetailPage() {
  const { id } = useParams();
  const user = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get<UserDetail>(`/users/${id}`),
  });

  return (
    <>
      <Link to="/admin/users" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900">
        <ArrowLeft className="size-4" aria-hidden />
        Users
      </Link>

      {user.isError ? (
        <ErrorState error={user.error} onRetry={() => user.refetch()} />
      ) : !user.data ? (
        <Card className="h-64 animate-pulse">{null}</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold text-stone-900">{user.data.name}</h1>
              <RoleBadge role={user.data.role} />
            </div>
            <dl className="divide-y divide-stone-100">
              <Detail label="Email">{user.data.email}</Detail>
              <Detail label="Address">{user.data.address}</Detail>
              {user.data.createdAt && <Detail label="Joined">{formatDate(user.data.createdAt)}</Detail>}
            </dl>
          </Card>

          {user.data.role === 'STORE_OWNER' && (
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-stone-900">
                <Store className="size-4 text-stone-400" aria-hidden />
                Store
              </h2>
              {user.data.store ? (
                <>
                  <p className="font-medium text-stone-800">{user.data.store.name}</p>
                  <p className="mt-4 text-sm text-stone-500">Rating</p>
                  <p className="mt-1 text-3xl font-semibold tabular text-stone-900">
                    {user.data.store.averageRating?.toFixed(1) ?? '—'}
                  </p>
                  <div className="mt-1">
                    <RatingSummary value={user.data.store.averageRating} count={user.data.store.ratingCount} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-stone-500">No store assigned yet. Add one from the Stores page.</p>
              )}
            </Card>
          )}
        </div>
      )}
    </>
  );
}
