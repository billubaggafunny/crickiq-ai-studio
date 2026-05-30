import { useState, useCallback } from 'react';

export type SyncTask = {
    entityId: string;
    entityType: 'tournament' | 'team' | 'match' | 'ball';
    action: 'create' | 'update' | 'delete';
    timestamp: string;
};

export const useSyncQueue = () => {
    const [pendingEvents, setPendingEvents] = useState<SyncTask[]>([]);

    const enqueueEvent = useCallback((event: Omit<SyncTask, 'timestamp'>) => {
        setPendingEvents(prev => [...prev, { ...event, timestamp: new Date().toISOString() }]);
        // TODO: Implement actual IndexedDB/Firebase queue logic later
    }, []);

    const clearQueue = useCallback(() => {
        setPendingEvents([]);
    }, []);

    return {
        pendingEvents,
        enqueueEvent,
        clearQueue
    };
};
