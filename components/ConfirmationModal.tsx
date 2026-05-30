import React from 'react';

interface ConfirmationModalProps {
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'danger' }) => {
    const confirmButtonClass = confirmVariant === 'danger' 
        ? 'bg-highlight text-white hover:bg-opacity-90'
        : ' text-white';
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
        >
            <div 
                className="w-full max-w-md p-6 rounded-2xl shadow-xl border border-white/20  "
                onClick={e => e.stopPropagation()}
            >
                <h2 id="confirmation-title" className="text-h2 text-gray-900 dark:text-white mb-4">{title}</h2>
                <div className="text-gray-700 dark:text-gray-300 mb-4">{message}</div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="py-1.5 px-6 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 rounded-2xl hover:bg-black/10 dark:hover:bg-white/20 font-semibold text-body text-gray-800 dark:text-gray-200">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={`py-1.5 px-6 font-bold rounded-2xl shadow-md text-body ${confirmButtonClass}`}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;