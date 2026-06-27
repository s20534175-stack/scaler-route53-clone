'use client';
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import clsx from 'clsx';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; type: ToastType; message: string; }

interface ToastCtx { toast: (message: string, type?: ToastType) => void; }
const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const icons = { success: CheckCircle, error: XCircle, info: AlertCircle };
  const colors = {
    success: 'border-l-aws-green bg-aws-green-light text-aws-green',
    error: 'border-l-aws-red bg-aws-red-light text-aws-red',
    info: 'border-l-aws-blue bg-aws-blue-light text-aws-blue-dark',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={clsx('flex items-center gap-3 px-4 py-3 border-l-4 rounded shadow-lg min-w-[280px] toast-enter', colors[t.type])}>
              <Icon size={18} className="shrink-0" />
              <span className="text-sm font-medium flex-1">{t.message}</span>
              <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}>
                <X size={14} />
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
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
