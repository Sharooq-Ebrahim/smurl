import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";
import { useToastStore, type Toast as ToastType } from "@/store/toastStore";
import { cn } from "@/lib/utils";

const ICONS = {
  success: (
    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
  ),
  error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-600 dark:text-blue-500" />,
  warning: (
    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
  ),
};

function Toast({ toast }: { toast: ToastType }) {
  const { dismissToast, removeToast } = useToastStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast.closing) {
      // Allow exit animation to play before fully unmounting
      const timer = setTimeout(() => removeToast(toast.id), 150);
      return () => clearTimeout(timer);
    }

    if (toast.duration !== Infinity) {
      timerRef.current = setTimeout(
        () => dismissToast(toast.id),
        toast.duration || 4000,
      );
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.closing, toast.id, toast.duration, dismissToast, removeToast]);

  return (
    <div
      role="alert"
      className={cn(
        "relative overflow-hidden flex w-full sm:w-[380px] items-start gap-3 rounded-xl border bg-surface p-4 shadow-lg ring-1 ring-black/5 dark:ring-white/5 pointer-events-auto",
        toast.closing ? "animate-toast-out" : "animate-toast-in",
        {
          "border-green-200 dark:border-green-900/50 shadow-green-900/10":
            toast.type === "success",
          "border-red-200 dark:border-red-900/50 shadow-red-900/10":
            toast.type === "error",
          "border-blue-200 dark:border-blue-900/50 shadow-blue-900/10":
            toast.type === "info",
          "border-amber-200 dark:border-amber-900/50 shadow-amber-900/10":
            toast.type === "warning",
          "border-border": !toast.type, // Fallback
        },
      )}
    >
      {/* Progress Bar */}
      {toast.duration !== Infinity && !toast.closing && (
        <div
          className={cn(
            "absolute bottom-0 left-0 h-1 bg-current opacity-20 animate-toast-progress",
            {
              "text-green-600 dark:text-green-500": toast.type === "success",
              "text-red-600 dark:text-red-500": toast.type === "error",
              "text-blue-600 dark:text-blue-500": toast.type === "info",
              "text-amber-600 dark:text-amber-500": toast.type === "warning",
              "text-text-primary": !toast.type,
            },
          )}
          style={{ animationDuration: `${toast.duration}ms` }}
        />
      )}
      <div className="shrink-0 pt-0.5">{ICONS[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm text-text-muted">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 rounded-md p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500 "
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 sm:top-4 right-0 sm:right-4 z-[100] flex max-h-screen w-full flex-col p-4 sm:w-auto gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
