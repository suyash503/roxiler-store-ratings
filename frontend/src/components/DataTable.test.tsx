import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from './DataTable';

interface Row {
  id: number;
  name: string;
  city: string;
}

const rows: Row[] = [
  { id: 1, name: 'Alpha Store', city: 'Pune' },
  { id: 2, name: 'Beta Store', city: 'Delhi' },
];

const columns: Column<Row, 'name' | 'city'>[] = [
  { key: 'name', header: 'Name', sortKey: 'name', render: (r) => r.name },
  { key: 'city', header: 'City', sortKey: 'city', render: (r) => r.city },
  { key: 'actions', header: 'Actions', render: () => 'Edit' },
];

function renderTable(props: Partial<Parameters<typeof DataTable<Row, 'name' | 'city'>>[0]> = {}) {
  const onSort = vi.fn();
  render(
    <DataTable
      caption="Stores"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      sortBy="name"
      order="asc"
      onSort={onSort}
      empty="Nothing here"
      {...props}
    />,
  );
  return { onSort };
}

describe('DataTable', () => {
  it('marks the sorted column for assistive tech', () => {
    renderTable({ order: 'desc' });
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: /City/ })).not.toHaveAttribute('aria-sort');
  });

  it('asks for a sort when a sortable header is clicked', async () => {
    const { onSort } = renderTable();
    await userEvent.click(screen.getByRole('button', { name: /City/ }));
    expect(onSort).toHaveBeenCalledWith('city');
  });

  it('leaves non-sortable columns as plain headers', () => {
    renderTable();
    expect(within(screen.getByRole('columnheader', { name: 'Actions' })).queryByRole('button')).toBeNull();
  });

  it('shows the empty state when there are no rows', () => {
    renderTable({ rows: [] });
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('offers a sort picker in card mode', async () => {
    const { onSort } = renderTable({ renderCard: (r) => <p>{r.name} card</p> });
    expect(screen.getByText('Alpha Store card')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'city');
    expect(onSort).toHaveBeenCalledWith('city');
    await userEvent.click(screen.getByRole('button', { name: /Ascending/ }));
    expect(onSort).toHaveBeenLastCalledWith('name');
  });
});
