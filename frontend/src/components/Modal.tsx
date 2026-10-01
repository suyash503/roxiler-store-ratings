import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Native <dialog>: focus trap, Esc to close and inert background come for free. */
export function Modal({ open, onClose, title, description, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white p-0 shadow-xl backdrop:bg-stone-900/40 backdrop:backdrop-blur-[2px]"
    >
      {open && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-stone-900">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-stone-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-m-1 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
