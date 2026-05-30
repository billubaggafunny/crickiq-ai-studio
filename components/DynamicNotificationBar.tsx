import React from 'react';
import { useNotification } from '../hooks/useNotification';

const SuccessIcon: React.FC = () => (
    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const ErrorIcon: React.FC = () => (
    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const InfoIcon: React.FC = () => (
    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const CricketIcon: React.FC = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
    </svg>
);


const DynamicNotificationBar: React.FC = () => {
    const { notification, hideNotification } = useNotification();
    const { isOpen, message, type } = notification;

    const ICONS: Record<string, React.ReactNode> = {
        info: <InfoIcon />,
        success: <SuccessIcon />,
        error: <ErrorIcon />,
        delete: <TrashIcon />,
        wicket: <CricketIcon />,
        boundary: <CricketIcon />,
    };
    
    const icon = ICONS[type] || null;

    return (
        <div
            onClick={hideNotification}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`
                fixed left-1/2 -translate-x-1/2 z-[100] safe-top-position
                flex items-center justify-center
                transition-all duration-500 ease-[cubic-bezier(0.3,1.3,0.3,1)]
                bg-black/80 text-white backdrop-blur-md shadow-2xl overflow-hidden cursor-pointer
                ${isOpen
                    ? 'h-10 rounded-2xl opacity-100 scale-100 px-4' // Open state with dynamic width
                    : 'w-10 h-10 rounded-full opacity-0 scale-50 pointer-events-none' // Closed state as a circle
                }
            `}
        >
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${isOpen ? 'opacity-100 delay-200' : 'opacity-0'}`}>
                {icon}
                <div className="font-semibold text-body leading-tight text-center whitespace-nowrap">{message}</div>
            </div>
        </div>
    );
};

export default DynamicNotificationBar;