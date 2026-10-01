import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchX, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/Button';
import { DataTable, type Column } from '../../components/DataTable';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { EmptyState, ErrorState, PageHeader, RoleBadge } from '../../components/ui';
import { api } from '../../lib/api';
import { ROLE_LABELS } from '../../lib/format';
import type { Page, User } from '../../lib/types';
import { useTableState } from '../../lib/useTableState';
import { roles } from '../../lib/validation';
import { AddUserDialog } from './AddUserDialog';

const SORT_FIELDS = ['name', 'email', 'address', 'role'] as const;
type SortField = (typeof SORT_FIELDS)[number];

const columns: Column<User, SortField>[] = [
  { key: 'name', header: 'Name', sortKey: 'name', render: (u) => <span className="font-medium text-stone-900">{u.name}</span> },
  { key: 'email', header: 'Email', sortKey: 'email', render: (u) => <span className="text-stone-600">{u.email}</span> },
  {
    key: 'address',
    header: 'Address',
    sortKey: 'address',
    render: (u) => <span className="line-clamp-2 max-w-xs text-stone-600">{u.address}</span>,
  },
  { key: 'role', header: 'Role', sortKey: 'role', render: (u) => <RoleBadge role={u.role} /> },
];

export function AdminUsersPage() {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const table = useTableState({ sortFields: SORT_FIELDS, defaultSort: 'name', filters: ['name', 'email', 'address', 'role'] });

  const users = useQuery({
    queryKey: ['users', table.query],
    queryFn: () => api.get<Page<User>>('/users', table.query),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone on the platform. Select a row for details."
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus className="size-4" aria-hidden />
            Add user
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_12rem]">
        <SearchInput label="Filter by name" value={table.filters.name} onChange={(v) => table.setFilter('name', v)} />
        <SearchInput label="Filter by email" value={table.filters.email} onChange={(v) => table.setFilter('email', v)} />
        <SearchInput label="Filter by address" value={table.filters.address} onChange={(v) => table.setFilter('address', v)} />
        <label>
          <span className="sr-only">Filter by role</span>
          <select
            value={table.filters.role}
            onChange={(event) => table.setFilter('role', event.target.value)}
            className="block h-10 w-full rounded-lg border-0 bg-white px-3 text-sm shadow-sm ring-1 ring-stone-300 ring-inset focus:ring-2 focus:ring-brand-600 focus:outline-none"
          >
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {users.isError ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : (
        <>
          <DataTable
            caption="Users"
            columns={columns}
            rows={users.data?.items}
            rowKey={(u) => u.id}
            sortBy={table.sortBy}
            order={table.order}
            onSort={table.toggleSort}
            isLoading={users.isPending}
            isFetching={users.isPlaceholderData}
            onRowClick={(u) => navigate(`/admin/users/${u.id}`)}
            empty={
              table.hasFilters ? (
                <EmptyState icon={SearchX} title="No users match these filters">
                  <button type="button" onClick={table.clearFilters} className="font-medium text-brand-700 hover:text-brand-800">
                    Clear filters
                  </button>
                </EmptyState>
              ) : (
                <EmptyState icon={Users} title="No users yet" />
              )
            }
          />
          {users.data && <Pagination page={table.page} pageSize={table.pageSize} total={users.data.total} onPageChange={table.setPage} />}
        </>
      )}

      <AddUserDialog open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
