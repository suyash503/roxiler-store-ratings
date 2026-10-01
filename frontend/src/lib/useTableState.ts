import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import type { SortOrder } from './types';

interface Options<S extends string, F extends string> {
  sortFields: readonly S[];
  defaultSort: S;
  defaultOrder?: SortOrder;
  filters: readonly F[];
  pageSize?: number;
}

/**
 * Sort, page and filters for a table, kept in the URL so a filtered view
 * survives a refresh, can be shared, and works with the back button.
 */
export function useTableState<S extends string, F extends string>({
  sortFields,
  defaultSort,
  defaultOrder = 'asc',
  filters: filterKeys,
  pageSize = 10,
}: Options<S, F>) {
  const [params, setParams] = useSearchParams();

  const rawSort = params.get('sortBy') as S | null;
  const sortBy = rawSort && sortFields.includes(rawSort) ? rawSort : defaultSort;
  const rawOrder = params.get('order');
  const order: SortOrder = rawOrder === 'asc' || rawOrder === 'desc' ? rawOrder : defaultOrder;
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);

  const filterValues = filterKeys.map((key) => params.get(key) ?? '');
  const filters = Object.fromEntries(filterKeys.map((key, i) => [key, filterValues[i]])) as Record<F, string>;

  const update = useCallback(
    (patch: Record<string, string | number | undefined>, resetPage = true) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          }
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  return {
    sortBy,
    order,
    page,
    pageSize,
    filters,
    /** Same column flips direction; a new column starts ascending. */
    toggleSort: (field: S) => update({ sortBy: field, order: field === sortBy && order === 'asc' ? 'desc' : 'asc' }),
    setFilter: (key: F, value: string) => update({ [key]: value }),
    setPage: (next: number) => update({ page: next > 1 ? next : undefined }, false),
    clearFilters: () => update(Object.fromEntries(filterKeys.map((key) => [key, undefined]))),
    hasFilters: filterValues.some(Boolean),
    query: { sortBy, order, page, pageSize, ...filters },
  };
}
