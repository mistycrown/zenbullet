import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface ToastData {
    id: number;
    message: string;
    action?: { label: string; onClick: () => void };
}

interface ToastContextType {
    toast: ToastData | null;
    showToast: (message: string, action?: { label: string; onClick: () => void }) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastData | null>(null);
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, action?: { label: string, onClick: () => void }) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        const id = Date.now();
        setToast({ id, message, action });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(prev => prev && prev.id === id ? null : prev);
        }, 5000);
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    }, []);

    return (
        <ToastContext.Provider value={{ toast, showToast, hideToast }}>
            {children}
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

import { X } from 'lucide-react';

export const ToastDisplay = () => {
    const { toast, hideToast } = useToast();
    if (!toast) return null;

    return (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-ink text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <span className="text-sm font-medium">{toast.message}</span>
            {toast.action && (
                <button
                    onClick={toast.action.onClick}
                    className="text-sm font-bold text-blue-300 hover:text-blue-200 transition-colors"
                >
                    {toast.action.label}
                </button>
            )}
            <button onClick={hideToast} className="text-stone-400 hover:text-white transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};
