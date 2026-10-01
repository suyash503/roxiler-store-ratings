import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchX, Store as StoreIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/Button';
import { DataTable, type Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { RatingSummary } from '../../components/StarRating';
import { EmptyState, ErrorState, PageHeader } from '../../components/ui';
import { api } from '../../lib/api';
import type { Page, Store } from '../../lib/types';
import { useTableState } from '../../lib/useTableState';
import { AddStoreDialog } from './AddStoreDialog';
import { AddUserDialog } from './AddUserDialog';

const SORT_FIELDS = ['name', 'email', 'address', 'averageRating'] as const;
type SortField = (typeof SORT_FIELDS)[number];

const columns: Column<Store, SortField>[] = [
  { key: 'name', header: 'Name', sortKey: 'name', render: (s) => <span className="font-medium text-stone-900">{s.name}</span> },
  { key: 'email', header: 'Email', sortKey: 'email', render: (s) => <span className="text-stone-600">{s.email}</span> },
  {
    key: 'address',
    header: 'Address',
    sortKey: 'address',
    render: (s) => <span className="line-clamp-2 max-w-xs text-stone-600">{s.address}</span>,
  },
  {
    key: 'rating',
    header: 'Rating',
    sortKey: 'averageRating',
    className: 'whitespace-nowrap',
    render: (s) => <RatingSummary value={s.averageRating} count={s.ratingCount} />,
  },
  {
    key: 'owner',
    header: 'Owner',
    render: (s) =>
      s.owner && (
        <Link to={`/admin/users/${s.owner.id}`} className="text-stone-700 hover:text-brand-700 hover:underline">
          {s.owner.name}
        </Link>
      ),
  },
];

export function AdminStoresPage() {
  const [dialog, setDialog] = useState<'store' | 'owner' | null>(null);
  const table = useTableState({ sortFields: SORT_FIELDS, defaultSort: 'name', filters: ['name', 'email', 'address'] });

  const stores = useQuery({
    queryKey: ['stores', table.query],
    queryFn: () => api.get<Page<Store>>('/stores', table.query),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Stores"
        description="Every registered store with its average rating."
        actions={
          <Button onClick={() => setDialog('store')}>
            <StoreIcon className="size-4" aria-hidden />
            Add store
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <SearchInput label="Filter by name" value={table.filters.name} onChange={(v) => table.setFilter('name', v)} />
        <SearchInput label="Filter by email" value={table.filters.email} onChange={(v) => table.setFilter('email', v)} />
        <SearchInput label="Filter by address" value={table.filters.address} onChange={(v) => table.setFilter('address', v)} />
      </div>

      {stores.isError ? (
        <ErrorState error={stores.error} onRetry={() => stores.refetch()} />
      ) : (
        <>
          <DataTable
            caption="Stores"
            columns={columns}
            rows={stores.data?.items}
            rowKey={(s) => s.id}
            sortBy={table.sortBy}
            order={table.order}
            onSort={table.toggleSort}
            isLoading={stores.isPending}
            isFetching={stores.isPlaceholderData}
            empty={
              table.hasFilters ? (
                <EmptyState icon={SearchX} title="No stores match these filters">
                  <button type="button" onClick={table.clearFilters} className="font-medium text-brand-700 hover:text-brand-800">
                    Clear filters
                  </button>
                </EmptyState>
              ) : (
                <EmptyState icon={StoreIcon} title="No stores yet">
                  Add the first one with “Add store”.
                </EmptyState>
              )
            }
          />
          {stores.data && <Pagination page={table.page} pageSize={table.pageSize} total={stores.data.total} onPageChange={table.setPage} />}
        </>
      )}

      <AddStoreDialog open={dialog === 'store'} onClose={() => setDialog(null)} onAddOwner={() => setDialog('owner')} />
      <AddUserDialog open={dialog === 'owner'} onClose={() => setDialog('store')} defaultRole="STORE_OWNER" />
    </>
  );
}
