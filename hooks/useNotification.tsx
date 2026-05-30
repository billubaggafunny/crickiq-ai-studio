/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useCallback, useRef, useMemo } from 'react';

export type NotificationType = 'info' | 'success' | 'wicket' | 'boundary' | 'error' | 'delete';

export interface NotificationState {
    isOpen: boolean;
    message: React.ReactNode;
    type: NotificationType;
}

interface NotificationContextValue {
    notification: NotificationState;
    showNotification: (message: React.ReactNode, type?: NotificationType, duration?: number) => void;
    hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notification, setNotification] = useState<NotificationState>({ isOpen: false, message: '', type: 'info' });
    const timeoutRef = useRef<number | null>(null);
    
    const hideNotification = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setNotification(prev => ({ ...prev, isOpen: false }));
    }, []);

    const showNotification = useCallback((message: React.ReactNode, type: NotificationType = 'info', duration: number = 3000) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        setNotification({ isOpen: true, message, type });

        timeoutRef.current = window.setTimeout(() => {
            setNotification(prev => ({ ...prev, isOpen: false }));
            timeoutRef.current = null;
        }, duration);
    }, []);

    const contextValue = useMemo(() => ({
        notification,
        showNotification,
        hideNotification
    }), [notification, showNotification, hideNotification]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
