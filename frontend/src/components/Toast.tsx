import { CircleAlert, CircleCheck } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { ToastContext, type Tone } from './toast-context';

interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++nextId;
    setToasts((list) => [...list.slice(-2), { id, tone, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-md items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm text-white shadow-lg"
          >
            {toast.tone === 'success' ? (
              <CircleCheck className="size-4 shrink-0 text-brand-200" aria-hidden />
            ) : (
              <CircleAlert className="size-4 shrink-0 text-red-300" aria-hidden />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
