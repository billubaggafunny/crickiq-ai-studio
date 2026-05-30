import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from '../utils/stateSerializer';
import { usePersistence } from './usePersistence';
import { authLifecycleManager } from '../utils/authLifecycleManager';

export const usePersistenceObserver = (state: AppState, isHydrating: boolean) => {
    const { saveAppState, emergencySaveActiveMatch } = usePersistence();
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    
    // We use a ref to hold the latest state to avoid stale closures in the timer
    const stateRef = useRef<AppState>(state);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasInitialHydrated = useRef(false);
    const hasPendingDirtyState = useRef(false);

    // Keep the ref updated
    useEffect(() => {
        if (!isHydrating) {
            stateRef.current = state;
        }
    }, [state, isHydrating]);

    const performSave = useCallback(async () => {
        if (isHydrating || authLifecycleManager.isPersistencePaused()) {
            hasPendingDirtyState.current = true;
            return;
        }
        
        hasPendingDirtyState.current = false;
        
        setIsSaving(true);
        setSaveError(null);
        try {
            await saveAppState(stateRef.current);
            setLastSavedAt(new Date().toISOString());
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to save state';
            setSaveError(message);
            console.error('[PersistenceObserver] Save caught error:', err);
        } finally {
            setIsSaving(false);
        }
    }, [saveAppState, isHydrating]);

    const performEmergencySave = useCallback(() => {
        if (isHydrating || authLifecycleManager.isPersistencePaused()) {
            hasPendingDirtyState.current = true;
            return;
        }
        
        hasPendingDirtyState.current = false;
        
        // When visibility behaves like an emergency suspend:
        // By-pass normal React and Redux architectures - fire the indexedDB directly
        emergencySaveActiveMatch(stateRef.current);
    }, [emergencySaveActiveMatch, isHydrating]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                performEmergencySave();
            }
        };

        const handlePageHide = () => {
             performEmergencySave();
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handlePageHide);
        
        // beforeunload is sometimes deprecated on mobile but good as a safety net
        window.addEventListener('beforeunload', performEmergencySave);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handlePageHide);
            window.removeEventListener('beforeunload', performEmergencySave);
        };
    }, [performEmergencySave]);

    useEffect(() => {
        const flushPending = async () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            await performSave();
        };

        const unsubscribeFlush = authLifecycleManager.registerPersistenceFlush(flushPending);
        
        const handleResume = () => {
             if (hasPendingDirtyState.current && !isHydrating) {
                 if (saveTimeoutRef.current) {
                     clearTimeout(saveTimeoutRef.current);
                 }
                 saveTimeoutRef.current = setTimeout(() => {
                     performSave();
                 }, 500);
             }
        };
        const unsubscribeResume = authLifecycleManager.registerPersistenceResume(handleResume);

        return () => {
            unsubscribeFlush();
            unsubscribeResume();
        };
    }, [performSave, isHydrating]);

    useEffect(() => {
        if (isHydrating) return;
        
        // Skip the very first trigger immediately after hydration completes
        if (!hasInitialHydrated.current) {
            hasInitialHydrated.current = true;
            if (!hasPendingDirtyState.current) return;
        }

        // Clear any existing timer
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set a new timer
        // We debounce multiple state updates within 500ms
        saveTimeoutRef.current = setTimeout(() => {
            performSave();
        }, 500);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [state, performSave, isHydrating]); // Depend on state to trigger the effect

    return {
        isSaving,
        lastSavedAt,
        saveError
    };
};
