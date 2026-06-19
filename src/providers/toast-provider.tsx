import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Toast from '@/components/primitives/Toast';

type ToastOptions = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

type ToastState = ToastOptions & { visible: boolean };

type ToastContextType = {
  show: (options: ToastOptions) => void;
  hide: () => void;
  toast: ToastState;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions & { visible: boolean }>({
    visible: false,
    message: '',
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setToast({ ...options, visible: true });
    },
    [],
  );

  const handleDismiss = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ show, hide, toast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        actionLabel={toast.actionLabel}
        onAction={() => {
          toast.onAction?.();
          hide();
        }}
        onDismiss={handleDismiss}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
