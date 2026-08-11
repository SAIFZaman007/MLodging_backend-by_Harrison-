import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  notify: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, { wrap: string; icon: ReactNode }> = {
  success: {
    wrap: "border-green-200 bg-green-50 text-green-900",
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />,
  },
  error: {
    wrap: "border-red-200 bg-red-50 text-red-900",
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />,
  },
  info: {
    wrap: "border-brand-forest/15 bg-white text-brand-ink",
    icon: <Info className="h-4 w-4 shrink-0 text-brand-forest" />,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      // Errors linger — an operator who looked away shouldn't miss a failed save.
      const ttl = tone === "error" ? 7000 : 4000;
      const handle = window.setTimeout(() => dismiss(id), ttl);
      timers.current.push(handle);
    },
    [dismiss],
  );

  useEffect(() => {
    const handles = timers.current;
    return () => handles.forEach(window.clearTimeout);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (message: string) => notify(message, "success"),
      error: (message: string) => notify(message, "error"),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-100 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex animate-rise-in items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-pop ${TONE_STYLES[toast.tone].wrap}`}
          >
            {TONE_STYLES[toast.tone].icon}
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded opacity-50 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}