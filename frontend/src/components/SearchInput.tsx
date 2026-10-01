import { Search, X } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Wait this long after typing stops before searching. */
  debounceMs?: number;
  className?: string;
}

/** Text filter that types instantly but only reports after a pause. */
export function SearchInput({ label, value, onChange, placeholder, debounceMs = 300, className = '' }: Props) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Follow outside changes (e.g. "Clear filters", back button), but don't
  // clobber what's being typed: "abc " must not lose its space when "abc" lands.
  if (value !== lastValue) {
    setLastValue(value);
    if (draft.trim() !== value) setDraft(value);
  }

  const report = useEffectEvent((next: string) => onChange(next));
  useEffect(() => {
    if (draft.trim() === value) return;
    const timer = setTimeout(() => report(draft.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [draft, value, debounceMs]);

  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder ?? label}
        className="block h-10 w-full rounded-lg border-0 bg-white pr-9 pl-9 text-sm shadow-sm ring-1 ring-stone-300 ring-inset placeholder:text-stone-400 focus:ring-2 focus:ring-brand-600 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onChange('');
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-stone-400 hover:text-stone-700"
          aria-label={`Clear ${label.toLowerCase()}`}
        >
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}
