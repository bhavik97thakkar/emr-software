import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((message: string) => addToast('success', message), [addToast]);
    const error = useCallback((message: string) => addToast('error', message), [addToast]);
    const info = useCallback((message: string) => addToast('info', message), [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center space-y-3 pointer-events-none w-full max-w-sm px-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              pointer-events-auto flex items-center justify-between w-full p-4 rounded-2xl shadow-xl border
              transform transition-all duration-300 animate-in slide-in-from-top-4 fade-in
              ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : ''}
              ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
            `}
                    >
                        <div className="flex items-center space-x-3">
                            {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-500" />}
                            {toast.type === 'error' && <AlertCircle size={20} className="text-rose-500" />}
                            {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
                            <p className="text-sm font-bold">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors ml-4"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
