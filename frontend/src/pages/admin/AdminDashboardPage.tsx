import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Star, Store, UserPlus, Users, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/Button';
import { RatingSummary } from '../../components/StarRating';
import { Card, ErrorState, PageHeader } from '../../components/ui';
import { api } from '../../lib/api';
import type { Page, Stats, Store as StoreRow } from '../../lib/types';
import { AddStoreDialog } from './AddStoreDialog';
import { AddUserDialog } from './AddUserDialog';

function StatCard({ label, value, icon: Icon, to }: { label: string; value?: number; icon: LucideIcon; to?: string }) {
  const body = (
    <Card className={`flex items-center gap-4 ${to ? 'transition-shadow hover:shadow-md hover:ring-stone-300' : ''}`}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="size-5" aria-hidden />
      </span>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-2xl font-semibold tabular text-stone-900">
          {value === undefined ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-stone-100" /> : value.toLocaleString()}
        </p>
      </div>
    </Card>
  );
  return to ? (
    <Link to={to} className="rounded-xl">
      {body}
    </Link>
  ) : (
    body
  );
}

export function AdminDashboardPage() {
  const [dialog, setDialog] = useState<'user' | 'store' | 'owner' | null>(null);
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.get<Stats>('/stats') });
  const topStores = useQuery({
    queryKey: ['stores', { sortBy: 'averageRating', order: 'desc', pageSize: 5 }],
    queryFn: () => api.get<Page<StoreRow>>('/stores', { sortBy: 'averageRating', order: 'desc', pageSize: 5 }),
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform activity at a glance."
        actions={
          <>
            <Button variant="secondary" onClick={() => setDialog('store')}>
              <Store className="size-4" aria-hidden />
              Add store
            </Button>
            <Button onClick={() => setDialog('user')}>
              <UserPlus className="size-4" aria-hidden />
              Add user
            </Button>
          </>
        }
      />

      {stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total users" value={stats.data?.totalUsers} icon={Users} to="/admin/users" />
          <StatCard label="Total stores" value={stats.data?.totalStores} icon={Store} to="/admin/stores" />
          <StatCard label="Ratings submitted" value={stats.data?.totalRatings} icon={Star} />
        </div>
      )}

      <Card className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">Top-rated stores</h2>
          <Link to="/admin/stores?sortBy=averageRating&order=desc" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
            All stores <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        {topStores.isError ? (
          <ErrorState error={topStores.error} onRetry={() => topStores.refetch()} />
        ) : topStores.data?.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">No stores yet.</p>
        ) : (
          <ol className="divide-y divide-stone-100">
            {(topStores.data?.items ?? []).map((store, i) => (
              <li key={store.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="w-5 text-sm text-stone-400 tabular">{i + 1}</span>
                  <span className="truncate font-medium text-stone-800">{store.name}</span>
                </span>
                <RatingSummary value={store.averageRating} count={store.ratingCount} />
              </li>
            ))}
          </ol>
        )}
      </Card>

      <AddUserDialog open={dialog === 'user' || dialog === 'owner'} onClose={() => setDialog(dialog === 'owner' ? 'store' : null)} defaultRole={dialog === 'owner' ? 'STORE_OWNER' : 'USER'} />
      <AddStoreDialog open={dialog === 'store'} onClose={() => setDialog(null)} onAddOwner={() => setDialog('owner')} />
    </>
  );
}
