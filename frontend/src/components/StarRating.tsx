import { Star } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { formatRating } from '../lib/format';

const STARS = [1, 2, 3, 4, 5] as const;

/** Read-only stars with partial fill, e.g. 4.3 → four and a third stars. */
export function Stars({ value, size = 'size-4' }: { value: number | null; size?: string }) {
  return (
    <span className="inline-flex" aria-hidden="true">
      {STARS.map((star) => {
        const fill = value == null ? 0 : Math.min(1, Math.max(0, value - (star - 1)));
        return (
          <span key={star} className="relative">
            <Star className={`${size} fill-star-empty text-star-empty`} strokeWidth={1.5} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${size} fill-star text-star`} strokeWidth={1.5} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Stars plus the number, with an accessible label. */
export function RatingSummary({ value, count }: { value: number | null; count?: number }) {
  const label =
    value == null ? 'No ratings yet' : `Rated ${formatRating(value)} out of 5${count != null ? ` from ${count} ratings` : ''}`;
  return (
    <span className="inline-flex items-center gap-2" title={label}>
      <Stars value={value} />
      {/* Visual shorthand; screen readers get the full sentence below instead. */}
      <span className="text-sm font-medium tabular text-stone-800" aria-hidden="true">
        {formatRating(value)}
      </span>
      {count != null && (
        <span className="text-xs text-stone-500 tabular" aria-hidden="true">
          ({count})
        </span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Names the control for screen readers, e.g. the store's name. */
  label: string;
}

/**
 * Interactive 1–5 stars. A radio group: click a star, or focus it and use
 * the arrow keys, Home/End or 1–5.
 */
export function RatingInput({ value, onChange, disabled = false, label }: RatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = hover ?? value ?? 0;

  const choose = (star: number) => {
    if (!disabled && star !== value) onChange(star);
    refs.current[star - 1]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const current = value ?? 0;
    const keys: Record<string, number> = {
      ArrowRight: Math.min(5, current + 1),
      ArrowUp: Math.min(5, current + 1),
      ArrowLeft: Math.max(1, current - 1),
      ArrowDown: Math.max(1, current - 1),
      Home: 1,
      End: 5,
    };
    const next = keys[event.key] ?? (/^[1-5]$/.test(event.key) ? Number(event.key) : undefined);
    if (next === undefined) return;
    event.preventDefault();
    choose(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled}
      className={`inline-flex ${disabled ? 'opacity-60' : ''}`}
      onMouseLeave={() => setHover(null)}
      onKeyDown={onKeyDown}
    >
      {STARS.map((star) => {
        const checked = value === star;
        // Only one stop in the tab order: the chosen star, or the first one.
        const tabbable = checked || (value == null && star === 1);
        return (
          <button
            key={star}
            ref={(el) => {
              refs.current[star - 1] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            tabIndex={tabbable ? 0 : -1}
            disabled={disabled}
            onMouseEnter={() => setHover(star)}
            onClick={() => choose(star)}
            className="rounded p-0.5 transition-transform hover:scale-110 disabled:hover:scale-100"
          >
            <Star
              className={`size-5 ${star <= shown ? 'fill-star text-star' : 'fill-transparent text-stone-300'}`}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
