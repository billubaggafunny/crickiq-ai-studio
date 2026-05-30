let _isPersistencePaused = false;
let _isTransitioningAccounts = false;
let _executeLock = false;
let _hydrationGeneration = 0;

export const getHydrationGeneration = () => _hydrationGeneration;

export const incrementHydrationGeneration = () => {
    _hydrationGeneration++;
    return _hydrationGeneration;
};

type TransitionListener = (isTransitioning: boolean) => void;
const transitionListeners: TransitionListener[] = [];

export const subscribeToTransitionState = (listener: TransitionListener) => {
    transitionListeners.push(listener);
    return () => {
        const index = transitionListeners.indexOf(listener);
        if (index > -1) {
            transitionListeners.splice(index, 1);
        }
    };
};

const notifyTransitionListeners = () => {
    transitionListeners.forEach(listener => listener(_isTransitioningAccounts));
};

type FlushCallback = () => Promise<void>;
const flushCallbacks: FlushCallback[] = [];

export const registerPersistenceFlush = (callback: FlushCallback) => {
    flushCallbacks.push(callback);
    return () => {
        const index = flushCallbacks.indexOf(callback);
        if (index > -1) {
            flushCallbacks.splice(index, 1);
        }
    };
};

export const flushPendingPersistence = async (): Promise<void> => {
    console.log('[authLifecycleManager] Flushing pending persistence saves before transition...');
    // Await all registered saves to complete so they hit IndexedDB safely
    for (const callback of flushCallbacks) {
        try {
            await callback();
        } catch (error) {
            console.error('[authLifecycleManager] Error flushing persistence:', error);
        }
    }
};

export const pausePersistenceObservers = () => {
    _isPersistencePaused = true;
};

type ResumeCallback = () => void;
const resumeCallbacks: ResumeCallback[] = [];

export const registerPersistenceResume = (callback: ResumeCallback) => {
    resumeCallbacks.push(callback);
    return () => {
        const index = resumeCallbacks.indexOf(callback);
        if (index > -1) {
            resumeCallbacks.splice(index, 1);
        }
    };
};

export const resumePersistenceObservers = () => {
    _isPersistencePaused = false;
    resumeCallbacks.forEach(callback => callback());
};

export const isPersistencePaused = () => {
    return _isPersistencePaused;
};

export const beginAccountTransition = () => {
    _isTransitioningAccounts = true;
    incrementHydrationGeneration(); // Invalidate old hydrations automatically
    notifyTransitionListeners();
    pausePersistenceObservers(); // Safe lifecycle guard
};

export const endAccountTransition = () => {
    _isTransitioningAccounts = false;
    notifyTransitionListeners();
    resumePersistenceObservers();
};

export const isTransitioningAccounts = () => {
    return _isTransitioningAccounts;
};

const MAX_TRANSITION_TIMEOUT_MS = 30000; // 30 seconds safety net

export const executeAccountTransition = async <T>(transitionFn: () => Promise<T> | T): Promise<T> => {
    // 1. SYNCHRONOUS RE-ENTRY GUARD
    if (_executeLock) {
        console.warn('[authLifecycleManager] executeAccountTransition blocked: overlapping transition safely ignored.');
        return Promise.resolve(undefined as unknown as T);
    }
    
    _executeLock = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // GUARANTEED FINAL SAVE BEFORE PAUSE
    try {
        let flushTimeoutId: NodeJS.Timeout;
        const flushPromise = flushPendingPersistence();
        const timeoutPromise = new Promise<void>((_, reject) => {
            flushTimeoutId = setTimeout(() => reject(new Error('Flush timeout')), 5000);
        });
        await Promise.race([flushPromise, timeoutPromise]);
        clearTimeout(flushTimeoutId!); // clean up timer if flushPromise wins
    } catch (error) {
        console.error('[authLifecycleManager] Save flush failed or timed out before transition, proceeding anyway:', error);
    }
    
    try {
        beginAccountTransition();
        
        // Safety mechanism: force resume if transition hangs indefinitely 
        // (e.g. Android WebView suspended async task or dropped network)
        timeoutId = setTimeout(() => {
            console.error('[authLifecycleManager] executeAccountTransition timed out. Forcing endAccountTransition to prevent deadlock.');
            _executeLock = false; // Ensure execution lock is released on timeout
            if (_isTransitioningAccounts) {
                endAccountTransition();
            }
        }, MAX_TRANSITION_TIMEOUT_MS);

        return await transitionFn();
    } finally {
        _executeLock = false; // Clear re-entry guard
        if (timeoutId) clearTimeout(timeoutId);
        // Only run endAccountTransition if not already recovered by timeout
        if (_isTransitioningAccounts) {
            endAccountTransition();
        }
    }
};

export const authLifecycleManager = {
    pausePersistenceObservers,
    resumePersistenceObservers,
    isPersistencePaused,
    beginAccountTransition,
    endAccountTransition,
    isTransitioningAccounts,
    subscribeToTransitionState,
    executeAccountTransition,
    registerPersistenceFlush,
    registerPersistenceResume,
    flushPendingPersistence,
    getHydrationGeneration,
    incrementHydrationGeneration
};
