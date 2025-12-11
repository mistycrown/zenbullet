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
