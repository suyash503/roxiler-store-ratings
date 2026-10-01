import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SortOrder } from '../lib/types';

export interface Column<T, S extends string> {
  key: string;
  header: string;
  /** Present on sortable columns: the API's sortBy value. */
  sortKey?: S;
  render: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

interface Props<T, S extends string> {
  caption: string;
  columns: Column<T, S>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  sortBy: S;
  order: SortOrder;
  onSort: (field: S) => void;
  isLoading?: boolean;
  /** Dims the rows while a new page or sort loads in the background. */
  isFetching?: boolean;
  empty: ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T, S extends string>({
  caption,
  columns,
  rows,
  rowKey,
  sortBy,
  order,
  onSort,
  isLoading = false,
  isFetching = false,
  empty,
  onRowClick,
}: Props<T, S>) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-stone-200 bg-stone-50/80 text-xs font-medium tracking-wide text-stone-500 uppercase">
          <tr>
            {columns.map((column) => {
              const active = column.sortKey !== undefined && column.sortKey === sortBy;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={`px-4 py-3 whitespace-nowrap ${column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.sortKey ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.sortKey!)}
                      className={`-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase hover:text-stone-900 ${active ? 'text-stone-900' : ''}`}
                    >
                      {column.header}
                      {active ? (
                        order === 'asc' ? (
                          <ArrowUp className="size-3.5" aria-hidden />
                        ) : (
                          <ArrowDown className="size-3.5" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3.5 text-stone-300" aria-hidden />
                      )}
                      <span className="sr-only">
                        {active ? `, sorted ${order === 'asc' ? 'ascending' : 'descending'}` : ', sortable'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={`divide-y divide-stone-100 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
          {isLoading ? (
            Array.from({ length: 5 }, (_, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3.5">
                    <div className="h-4 w-full max-w-40 animate-pulse rounded bg-stone-100" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows && rows.length > 0 ? (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-stone-50' : 'hover:bg-stone-50/50'}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-middle ${column.align === 'right' ? 'text-right' : ''} ${column.className ?? ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-stone-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
