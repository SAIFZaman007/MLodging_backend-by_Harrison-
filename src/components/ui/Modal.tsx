import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape to close + scroll lock. Without the lock the page behind scrolls
  // under the dialog on trackpads, which feels broken.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    // Move focus into the dialog so keyboard users aren't stranded behind it.
    const focusTarget = panelRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button",
    );
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-90 flex animate-fade-in items-end justify-center bg-brand-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92dvh] w-full animate-rise-in flex-col rounded-t-2xl bg-white shadow-pop sm:rounded-2xl ${SIZES[size]}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-brand-forest/8 px-6 py-5">
          <div className="min-w-0">
            <h2 className="font-display text-lg text-brand-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-brand-ink/50">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 rounded-lg p-1.5 text-brand-ink/40 transition-colors hover:bg-brand-cream hover:text-brand-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="scroll-slim flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-brand-forest/8 bg-brand-cream/40 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}