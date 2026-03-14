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
    confirm: (options: { title?: string; message: string; onConfirm: () => void; onCancel?: () => void; danger?: boolean }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmOptions, setConfirmOptions] = useState<{
        title?: string;
        message: string;
        onConfirm: () => void;
        onCancel?: () => void;
        danger?: boolean;
    } | null>(null);

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

    const confirm = useCallback((options: { title?: string; message: string; onConfirm: () => void; onCancel?: () => void; danger?: boolean }) => {
        setConfirmOptions(options);
    }, []);

    const handleConfirm = () => {
        if (confirmOptions) {
            confirmOptions.onConfirm();
            setConfirmOptions(null);
        }
    };

    const handleCancel = () => {
        if (confirmOptions) {
            confirmOptions.onCancel?.();
            setConfirmOptions(null);
        }
    };

    return (
        <ToastContext.Provider value={{ success, error, info, confirm }}>
            {children}

            {/* Toasts */}
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

            {/* Confirmation Modal */}
            {confirmOptions && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center space-y-4">
                            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${confirmOptions.danger ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                <AlertCircle size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                    {confirmOptions.title || 'Are you sure?'}
                                </h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                                    {confirmOptions.message}
                                </p>
                            </div>
                        </div>
                        <div className="flex border-t border-slate-100 h-16">
                            <button
                                onClick={handleCancel}
                                className="flex-1 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 text-[11px] font-black uppercase tracking-widest text-white transition-colors ${confirmOptions.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
