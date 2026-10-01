export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white shadow-sm hover:bg-brand-800 disabled:bg-brand-700/60',
  secondary: 'bg-white text-stone-800 ring-1 ring-stone-300 ring-inset shadow-sm hover:bg-stone-50',
  ghost: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export function buttonClasses(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}
