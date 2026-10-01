import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <nav className="flex items-center justify-between gap-4 pt-3 text-sm text-stone-600" aria-label="Pagination">
      <p className="tabular">
        {from > total ? 'No results on this page' : `${from}–${to} of ${total.toLocaleString()}`}
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </Button>
          <span className="tabular" aria-current="page">
            Page {page} of {pages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
            Next
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
    </nav>
  );
}
