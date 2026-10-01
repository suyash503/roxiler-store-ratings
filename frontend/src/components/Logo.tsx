import { Star } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'size-10 rounded-xl' : 'size-8 rounded-lg';
  const icon = size === 'lg' ? 'size-5' : 'size-4';
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`grid place-items-center bg-brand-700 shadow-sm ${box}`}>
        <Star className={`fill-star text-star ${icon}`} strokeWidth={1.5} aria-hidden />
      </span>
      <span className={`font-semibold tracking-tight text-stone-900 ${size === 'lg' ? 'text-xl' : 'text-base'}`}>
        StoreRate
      </span>
    </span>
  );
}
