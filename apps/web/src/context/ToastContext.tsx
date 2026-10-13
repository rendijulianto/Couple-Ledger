import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { CheckCircle2, AlertCircle, Info, X, Clock, HeartHandshake } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning" | "partner";

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const hideToast = useCallback((id: string) => {
    const existingTimeout = timeoutsRef.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "info", duration = 4500 }: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, title, message, type, duration };

      setToasts((prev) => [...prev.slice(-2), newToast]); // Maksimal 3 toast bersamaan

      const timeout = setTimeout(() => {
        hideToast(id);
      }, duration);

      timeoutsRef.current.set(id, timeout);
    },
    [hideToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Floating Modern Toast Stack Container */}
      <div className="fixed top-4 left-0 right-0 z-[9999] pointer-events-none px-4 flex flex-col items-center gap-2 max-w-md mx-auto">
        {toasts.map((toast) => {
          const isPartner = toast.type === "partner";
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto w-full bg-white border rounded-[14px] p-3.5 shadow-float flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                isPartner
                  ? "border-amber-300/80 bg-gradient-to-r from-amber-50/90 to-white"
                  : isSuccess
                    ? "border-emerald-200 bg-gradient-to-r from-emerald-50/90 to-white"
                    : isError
                      ? "border-rose-200 bg-gradient-to-r from-rose-50/90 to-white"
                      : isWarning
                        ? "border-amber-200 bg-white"
                        : "border-hairline bg-white"
              }`}
            >
              {/* Icon Container */}
              <div className="flex-shrink-0 mt-0.5">
                {isPartner && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4 text-amber-700 animate-pulse" />
                  </div>
                )}
                {isSuccess && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {isError && (
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {isWarning && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                )}
                {toast.type === "info" && (
                  <div className="w-8 h-8 rounded-full bg-surface-strong text-ink flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Text Body */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-ink leading-tight">
                    {toast.title}
                  </h4>
                  {isPartner && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-amber-200/70 text-amber-900">
                      Persetujuan
                    </span>
                  )}
                </div>
                {toast.message && (
                  <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                    {toast.message}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => hideToast(toast.id)}
                className="flex-shrink-0 p-1 text-ink-muted hover:text-ink rounded-full hover:bg-surface-strong active:scale-95 transition-all"
                aria-label="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

