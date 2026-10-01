import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SearchX, Store as StoreIcon } from 'lucide-react';
import { DataTable, type Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { RatingInput, RatingSummary } from '../../components/StarRating';
import { useToast } from '../../components/toast-context';
import { EmptyState, ErrorState, PageHeader } from '../../components/ui';
import { api, ApiError } from '../../lib/api';
import type { Page, RatingResult, Store } from '../../lib/types';
import { useTableState } from '../../lib/useTableState';

const SORT_FIELDS = ['name', 'address', 'averageRating', 'myRating'] as const;
type SortField = (typeof SORT_FIELDS)[number];

export function StoresPage() {
  const table = useTableState({ sortFields: SORT_FIELDS, defaultSort: 'name', filters: ['q'] });
  const queryKey = ['stores', table.query];
  const queryClient = useQueryClient();
  const toast = useToast();

  const stores = useQuery({
    queryKey,
    queryFn: () => api.get<Page<Store>>('/stores', table.query),
    placeholderData: keepPreviousData,
  });

  const patchRow = (storeId: number, patch: Partial<Store>) =>
    queryClient.setQueryData<Page<Store>>(queryKey, (page) =>
      page && { ...page, items: page.items.map((s) => (s.id === storeId ? { ...s, ...patch } : s)) },
    );

  const rate = useMutation({
    mutationFn: ({ store, value }: { store: Store; value: number }) =>
      api.put<RatingResult>(`/stores/${store.id}/rating`, { value }),
    // Show the new stars immediately; roll back if the server says no.
    onMutate: ({ store, value }) => {
      patchRow(store.id, { myRating: value });
      return { previous: store.myRating ?? null };
    },
    onError: (error, { store }, context) => {
      patchRow(store.id, { myRating: context?.previous ?? null });
      toast(error instanceof ApiError ? error.message : 'Could not save your rating.', 'error');
    },
    onSuccess: (result, { store }) => {
      patchRow(store.id, {
        myRating: result.myRating,
        averageRating: result.averageRating,
        ratingCount: result.ratingCount,
      });
      toast(
        store.myRating == null
          ? `You rated ${store.name} ${result.myRating}/5`
          : `Your rating for ${store.name} is now ${result.myRating}/5`,
      );
      // Other pages/sorts are now stale; refetch them when next viewed, not now
      // (refetching this page would reshuffle rows under the cursor).
      void queryClient.invalidateQueries({ queryKey: ['stores'], refetchType: 'none' });
    },
  });

  const columns: Column<Store, SortField>[] = [
    {
      key: 'name',
      header: 'Store',
      sortKey: 'name',
      render: (store) => <span className="font-medium text-stone-900">{store.name}</span>,
    },
    {
      key: 'address',
      header: 'Address',
      sortKey: 'address',
      render: (store) => <span className="line-clamp-2 max-w-xs text-stone-600">{store.address}</span>,
    },
    {
      key: 'overall',
      header: 'Overall rating',
      sortKey: 'averageRating',
      className: 'whitespace-nowrap',
      render: (store) => <RatingSummary value={store.averageRating} count={store.ratingCount} />,
    },
    {
      key: 'mine',
      header: 'Your rating',
      sortKey: 'myRating',
      className: 'whitespace-nowrap',
      render: (store) => (
        <div className="flex flex-col items-start gap-0.5">
          <RatingInput
            value={store.myRating ?? null}
            label={`Your rating for ${store.name}`}
            disabled={rate.isPending && rate.variables?.store.id === store.id}
            onChange={(value) => rate.mutate({ store, value })}
          />
          <span className="text-xs text-stone-500">
            {store.myRating == null ? 'Not rated yet. Pick a star' : 'Click a star to change'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Stores" description="Find a store and rate it from 1 to 5 stars. You can change your rating any time." />
      <SearchInput
        label="Search by name or address"
        value={table.filters.q}
        onChange={(value) => table.setFilter('q', value)}
        className="mb-4 max-w-md"
      />
      {stores.isError ? (
        <ErrorState error={stores.error} onRetry={() => stores.refetch()} />
      ) : (
        <>
          <DataTable
            caption="Registered stores"
            columns={columns}
            rows={stores.data?.items}
            rowKey={(store) => store.id}
            sortBy={table.sortBy}
            order={table.order}
            onSort={table.toggleSort}
            isLoading={stores.isPending}
            isFetching={stores.isPlaceholderData}
            empty={
              table.hasFilters ? (
                <EmptyState icon={SearchX} title="No stores match your search">
                  Try a different name or address.
                </EmptyState>
              ) : (
                <EmptyState icon={StoreIcon} title="No stores yet">
                  Stores appear here once an administrator adds them.
                </EmptyState>
              )
            }
          />
          {stores.data && (
            <Pagination page={table.page} pageSize={table.pageSize} total={stores.data.total} onPageChange={table.setPage} />
          )}
        </>
      )}
    </>
  );
}
