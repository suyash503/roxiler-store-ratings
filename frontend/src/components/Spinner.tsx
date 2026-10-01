import { LoaderCircle } from 'lucide-react';

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return <LoaderCircle className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center text-stone-400" role="status">
      <Spinner className="size-6" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
