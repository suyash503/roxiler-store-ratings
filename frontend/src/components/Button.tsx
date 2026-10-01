import type { ButtonHTMLAttributes } from 'react';
import { buttonClasses, type Size, type Variant } from './button-styles';
import { Spinner } from './Spinner';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant, size, loading = false, disabled, className = '', children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} disabled={disabled || loading} className={buttonClasses(variant, size, className)} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}
