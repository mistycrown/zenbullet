import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
}) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
        } else {
            setTimeout(() => setVisible(false), 300); // Wait for animation
        }
    }, [isOpen]);

    if (!visible && !isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Dialog */}
            <div className={`
        relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all duration-200
        ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
      `}>
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        {isDestructive && (
                            <div className="p-2 bg-red-50 text-red-500 rounded-full shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-ink mb-2">{title}</h3>
                            <div className="text-sm text-stone-500 leading-relaxed">
                                {message}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-stone-50 px-6 py-4 flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 hover:bg-stone-200 rounded-lg transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`
                    px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all active:scale-95
                    ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-ink hover:bg-stone-700'}
                `}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
