import { Check, Eye, EyeOff, X } from 'lucide-react';
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { passwordChecks } from '../lib/validation';

const control =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-brand-600 focus:outline-none aria-[invalid=true]:ring-red-500';

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  counter?: { length: number; max: number };
  children: ReactNode;
}

function FieldShell({ id, label, error, hint, counter, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-stone-800">
          {label}
        </label>
        {counter && (
          <span className={`text-xs tabular ${counter.length > counter.max ? 'text-red-600' : 'text-stone-400'}`}>
            {counter.length}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <div id={`${id}-hint`} className="text-xs text-stone-500">
            {hint}
          </div>
        )
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  /** Show a live "n/max" counter for the current value. */
  counterMax?: number;
  value?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, counterMax, id: idProp, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [length, setLength] = useState(0);
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} counter={counterMax ? { length, max: counterMax } : undefined}>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        className={control}
        {...rest}
        onChange={(event) => {
          setLength(event.target.value.length);
          rest.onChange?.(event);
        }}
      />
    </FieldShell>
  );
});

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  counterMax?: number;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(function TextAreaField(
  { label, error, hint, counterMax, id: idProp, rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [length, setLength] = useState(0);
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} counter={counterMax ? { length, max: counterMax } : undefined}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        className={`${control} resize-y`}
        {...rest}
        onChange={(event) => {
          setLength(event.target.value.length);
          rest.onChange?.(event);
        }}
      />
    </FieldShell>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, hint, id: idProp, children, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <select
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, error, hint)}
        className={`${control} pr-8`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  /** Show the live rule checklist (for new passwords). */
  showChecklist?: boolean;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, error, showChecklist = false, id: idProp, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');
  const checklist = showChecklist ? (
    <ul className="mt-1 grid gap-1 sm:grid-cols-3" aria-label="Password requirements">
      {passwordChecks(value).map((check) => (
        <li key={check.label} className={`flex items-center gap-1 ${check.met ? 'text-brand-700' : 'text-stone-500'}`}>
          {check.met ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
          {check.label}
          <span className="sr-only">{check.met ? '(met)' : '(not met)'}</span>
        </li>
      ))}
    </ul>
  ) : undefined;

  return (
    <FieldShell id={id} label={label} error={error} hint={checklist}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error, checklist)}
          className={`${control} pr-10`}
          {...rest}
          onChange={(event) => {
            setValue(event.target.value);
            rest.onChange?.(event);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-stone-400 hover:text-stone-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {showChecklist && error && <div className="text-xs">{checklist}</div>}
    </FieldShell>
  );
});
