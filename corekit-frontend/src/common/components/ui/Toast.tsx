"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/common/utils/cn";

type ToastVariant = "success" | "error" | "info" | "warning";

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id" | "duration"> & { duration?: number }) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastVariant, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success:
    "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-200",
  error:
    "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-200",
  warning:
    "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200",
  info:
    "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    (t) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      const full: Toast = {
        id,
        title: t.title,
        description: t.description,
        variant: t.variant,
        duration: t.duration ?? 4000,
      };
      setToasts((prev) => [...prev, full]);
      if (full.duration > 0) {
        const tm = setTimeout(() => dismiss(id), full.duration);
        timers.current.set(id, tm);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border shadow-lg backdrop-blur p-4",
                "animate-in slide-in-from-right-4 fade-in duration-200",
                STYLES[t.variant],
              )}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className="text-sm font-semibold">{t.title}</p>
                )}
                {t.description && (
                  <p className="text-sm opacity-90 mt-0.5">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
