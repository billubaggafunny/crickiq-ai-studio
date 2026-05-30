import { useState, useEffect } from 'react';
import { authLifecycleManager } from '../utils/authLifecycleManager';

export const useAuthLifecycle = () => {
    const [isTransitioning, setIsTransitioning] = useState(authLifecycleManager.isTransitioningAccounts());

    useEffect(() => {
        const unsubscribe = authLifecycleManager.subscribeToTransitionState(setIsTransitioning);
        return () => unsubscribe();
    }, []);

    return {
        isTransitioning
    };
};
