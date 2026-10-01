import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MapPin, Mail, SearchX, Star, Store, Users } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { Stars } from '../../components/StarRating';
import { Card, EmptyState, ErrorState, PageHeader } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import { formatDate, formatRating, plural } from '../../lib/format';
import type { OwnerDashboard, Page, Rater } from '../../lib/types';
import { useTableState } from '../../lib/useTableState';

const SORT_FIELDS = ['name', 'email', 'value', 'updatedAt'] as const;
type SortField = (typeof SORT_FIELDS)[number];

const columns: Column<Rater, SortField>[] = [
  { key: 'name', header: 'Name', sortKey: 'name', render: (r) => <span className="font-medium text-stone-900">{r.name}</span> },
  { key: 'email', header: 'Email', sortKey: 'email', render: (r) => <span className="text-stone-600">{r.email}</span> },
  {
    key: 'value',
    header: 'Rating',
    sortKey: 'value',
    className: 'whitespace-nowrap',
    render: (r) => (
      <span className="inline-flex items-center gap-2">
        <Stars value={r.value} />
        <span className="text-sm tabular text-stone-700">{r.value}</span>
        <span className="sr-only">out of 5</span>
      </span>
    ),
  },
  {
    key: 'date',
    header: 'Rated on',
    sortKey: 'updatedAt',
    className: 'whitespace-nowrap text-stone-600',
    render: (r) => formatDate(r.updatedAt),
  },
];

function Distribution({ dashboard }: { dashboard: OwnerDashboard }) {
  const max = Math.max(1, ...Object.values(dashboard.distribution));
  return (
    <ul className="space-y-1.5" aria-label="Ratings by star">
      {(['5', '4', '3', '2', '1'] as const).map((star) => {
        const count = dashboard.distribution[star];
        return (
          <li key={star} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-stone-600 tabular">
              {star}
              <Star className="size-3.5 fill-star text-star" aria-hidden />
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-stone-100">
              <span className="block h-full rounded-full bg-star" style={{ width: `${(count / max) * 100}%` }} />
            </span>
            <span className="text-right text-stone-500 tabular">
              {count}
              <span className="sr-only"> ratings of {star} stars</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function OwnerDashboardPage() {
  const table = useTableState({ sortFields: SORT_FIELDS, defaultSort: 'updatedAt', defaultOrder: 'desc', filters: ['q'] });

  const dashboard = useQuery({
    queryKey: ['owner', 'dashboard'],
    queryFn: () => api.get<OwnerDashboard>('/owner/dashboard'),
    retry: (count, error) => !(error instanceof ApiError && error.status === 404) && count < 2,
  });
  const raters = useQuery({
    queryKey: ['owner', 'ratings', table.query],
    queryFn: () => api.get<Page<Rater>>('/owner/ratings', table.query),
    placeholderData: keepPreviousData,
    enabled: dashboard.isSuccess,
  });

  if (dashboard.error instanceof ApiError && dashboard.error.status === 404) {
    return (
      <>
        <PageHeader title="My store" />
        <Card className="py-10">
          <EmptyState icon={Store} title="No store assigned yet">
            An administrator hasn't linked a store to your account. Once they do, its ratings show up here.
          </EmptyState>
        </Card>
      </>
    );
  }
  if (dashboard.isError) return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />;

  const data = dashboard.data;
  return (
    <>
      <PageHeader
        title={data?.store.name ?? 'My store'}
        description={
          data && (
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden /> {data.store.address}
              </span>
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3.5" aria-hidden /> {data.store.email}
              </span>
            </span>
          )
        }
      />

      <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
        <Card>
          <p className="text-sm text-stone-500">Average rating</p>
          {data ? (
            <>
              <p className="mt-1 text-5xl font-semibold tracking-tight tabular text-stone-900">{formatRating(data.averageRating)}</p>
              <div className="mt-2 flex items-center gap-2">
                <Stars value={data.averageRating} size="size-5" />
                <span className="text-sm text-stone-500">
                  {data.ratingCount === 0 ? 'No ratings yet' : `from ${plural(data.ratingCount, 'rating')}`}
                </span>
              </div>
            </>
          ) : (
            <div className="mt-2 h-20 animate-pulse rounded bg-stone-100" />
          )}
        </Card>
        <Card>
          <p className="mb-3 text-sm text-stone-500">Breakdown</p>
          {data ? <Distribution dashboard={data} /> : <div className="h-28 animate-pulse rounded bg-stone-100" />}
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="raters-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="raters-heading" className="flex items-center gap-2 text-lg font-semibold text-stone-900">
            <Users className="size-5 text-stone-400" aria-hidden />
            Who rated your store
          </h2>
          <SearchInput
            label="Search by name or email"
            value={table.filters.q}
            onChange={(v) => table.setFilter('q', v)}
            className="w-full sm:w-72"
          />
        </div>
        {raters.isError ? (
          <ErrorState error={raters.error} onRetry={() => raters.refetch()} />
        ) : (
          <>
            <DataTable
              caption="Users who rated your store"
              columns={columns}
              rows={raters.data?.items}
              rowKey={(r) => r.userId}
              sortBy={table.sortBy}
              order={table.order}
              onSort={table.toggleSort}
              isLoading={!raters.data}
              isFetching={raters.isPlaceholderData}
              empty={
                table.hasFilters ? (
                  <EmptyState icon={SearchX} title="Nobody matches that search" />
                ) : (
                  <EmptyState icon={Star} title="No ratings yet">
                    When customers rate your store, they'll be listed here.
                  </EmptyState>
                )
              }
            />
            {raters.data && <Pagination page={table.page} pageSize={table.pageSize} total={raters.data.total} onPageChange={table.setPage} />}
          </>
        )}
      </section>
    </>
  );
}
