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
  /**
   * Phone layout: below the `sm` breakpoint each row becomes this card, with a
   * sort picker in place of the column headers. Without it the table scrolls.
   */
  renderCard?: (row: T) => ReactNode;
}

export function DataTable<T, S extends string>(props: Props<T, S>) {
  if (!props.renderCard) return <Table {...props} />;
  return (
    <>
      <div className="hidden sm:block">
        <Table {...props} />
      </div>
      <div className="sm:hidden">
        <CardList {...props} renderCard={props.renderCard} />
      </div>
    </>
  );
}

function CardList<T, S extends string>({
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
  renderCard,
}: Props<T, S> & { renderCard: (row: T) => ReactNode }) {
  const sortable = columns.filter((column) => column.sortKey !== undefined);
  return (
    <section aria-label={caption}>
      <div className="mb-3 flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => onSort(event.target.value as S)}
            className="block h-10 w-full rounded-lg border-0 bg-white px-3 text-sm shadow-sm ring-1 ring-stone-300 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
          >
            {sortable.map((column) => (
              <option key={column.key} value={column.sortKey}>
                Sort by {column.header.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onSort(sortBy)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white px-3 text-sm font-medium text-stone-700 shadow-sm ring-1 ring-stone-300 ring-inset hover:bg-stone-50"
        >
          {order === 'asc' ? <ArrowUp className="size-4" aria-hidden /> : <ArrowDown className="size-4" aria-hidden />}
          {order === 'asc' ? 'Ascending' : 'Descending'}
        </button>
      </div>
      {isLoading ? (
        <ul className="space-y-3" aria-hidden="true">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="h-28 animate-pulse rounded-xl bg-white ring-1 ring-stone-200" />
          ))}
        </ul>
      ) : rows && rows.length > 0 ? (
        <ul className={`space-y-3 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
          {rows.map((row) => (
            <li key={rowKey(row)} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
              {renderCard(row)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl bg-white px-4 py-10 text-center text-stone-500 ring-1 ring-stone-200">{empty}</div>
      )}
    </section>
  );
}

function Table<T, S extends string>({
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
    // `relative` keeps the sr-only (position: absolute) labels inside the
    // scroll box; otherwise they widen the whole page on phones.
    <div className="relative overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-stone-200">
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
