import { useCallback } from 'react';
import { loadAndMigrateDataAsync } from '../migrations/migrationRunner';
import { STORAGE_KEY, SNAPSHOT_KEY, MAX_SNAPSHOTS } from '../constants/schema';
import { migrateEntityMetadata } from '../utils/idGenerator';
import { initialTournaments, initialTeams, initialMatches } from '../utils/initialData';
import { AppState, serializeState } from '../utils/stateSerializer';
import { validateHydrationState } from '../utils/hydrationValidator';
import { migrateState } from '../utils/migrations';
import { enforceSessionOwner } from '../utils/authValidator';
import { indexedDbAdapter } from '../storage/indexedDbAdapter';
import { db } from '../storage/indexedDb';
import { isEntityOwnedByCurrent } from '../utils/persistenceContext';
import { authLifecycleManager } from '../utils/authLifecycleManager';

export const usePersistence = () => {

    const loadAppState = useCallback(async (): Promise<AppState> => {
        try {
            console.log('[PersistenceService] HYDRATION_STARTED');
            const bootstrap = await loadAndMigrateDataAsync();
            
            if (!bootstrap || !bootstrap.data || !Array.isArray(bootstrap.data.tournaments) || !Array.isArray(bootstrap.data.teams) || !Array.isArray(bootstrap.data.matches)) {
                console.warn('[PersistenceValidation] Hydration rejected due to malformed payload (missing arrays).');
                throw new Error('Malformed payload');
            }
            
            migrateEntityMetadata(bootstrap.data);
            console.log('[PersistenceService] HYDRATION_COMPLETE');
            
            // Isolate persistence by only loading entities owned by current context.
            // Legacy entities (undefined owner) remain safely visible based on rules.
            const filterValidOwner = (item: any) => {
                 if (item && item.ownerId !== undefined) {
                      if (typeof item.ownerId !== 'string' || (item.ownerId as string).trim() === '') {
                           console.warn('[AuthValidation] Invalid ownerId rejected.');
                           return false;
                      }
                 }
                 const isOwned = isEntityOwnedByCurrent(item?.ownerId as string | undefined);
                 if (!isOwned) {
                      console.warn('[AuthValidation] Cross-account hydration blocked.');
                 }
                 return isOwned;
            };

            const filteredTournaments = bootstrap.data.tournaments.filter(filterValidOwner);
            const filteredTeams = bootstrap.data.teams.filter(filterValidOwner);
            const filteredMatches = bootstrap.data.matches.filter(filterValidOwner);
            
            const rawHydratedState = {
                tournaments: filteredTournaments.length > 0 ? filteredTournaments : initialTournaments,
                teams: filteredTeams.length > 0 ? filteredTeams : initialTeams,
                matches: filteredMatches.length > 0 ? filteredMatches : initialMatches
            };
            
            const safeState = validateHydrationState(rawHydratedState);
            const fullyMigratedState = migrateState(safeState);
            return fullyMigratedState;
        } catch (e) {
            console.error('[PersistenceValidation] Fatal hydration error, pausing persistence to protect data.', e);
            authLifecycleManager.pausePersistenceObservers();
            return {
                tournaments: initialTournaments,
                teams: initialTeams,
                matches: initialMatches
            };
        }
    }, []);

    const saveAppState = useCallback(async (state: AppState): Promise<void> => {
        if (authLifecycleManager.isPersistencePaused()) {
            console.warn('[PersistenceService] Save aborted - persistence is paused during account transition');
            return;
        }

        try {
            const authSafeState: AppState = {
                tournaments: state.tournaments.map(t => enforceSessionOwner(t)),
                teams: state.teams.map(t => enforceSessionOwner(t)),
                matches: state.matches.map(m => enforceSessionOwner(m)),
            };

            const envelope = serializeState(authSafeState);
            await indexedDbAdapter.save(STORAGE_KEY, envelope);
            console.log('[PersistenceService] STATE_PERSISTED');
        } catch (error) {
            console.error('[PersistenceService] SAVE_FAILED:', error);
            try {
                // Fallback to localStorage directly if IndexedDB fails
                // Lightweight fallback: only active matches to prevent QuotaExceededError and Android WebView freezes
                const lightweightState: AppState = {
                    ...state,
                    matches: state.matches.filter(m => m.status === 'live'),
                };
                const envelope = serializeState(lightweightState);
                localStorage.setItem(STORAGE_KEY, envelope);
                console.log('[PersistenceService] STATE_PERSISTED_FALLBACK_TO_LOCALSTORAGE');
            } catch (fallbackError) {
                console.error('[PersistenceService] FALLBACK_SAVE_FAILED:', fallbackError);
            }
            throw error; // Let observer catch it
        }
    }, []);

    const createSnapshot = useCallback(async (state: AppState, ownerId?: string) => {
        if (authLifecycleManager.isPersistencePaused()) return;
        try {
            const currentState = { ...state, timestamp: new Date().toISOString(), ownerId };
            const existingSnapshotsStr = await indexedDbAdapter.load(SNAPSHOT_KEY);
            let snapshots: Record<string, unknown>[] = [];
            if (existingSnapshotsStr) {
                try {
                    const parsed = JSON.parse(existingSnapshotsStr);
                    snapshots = Array.isArray(parsed) ? parsed : [];
                } catch (pe) {
                    console.warn('[PersistenceValidation] Invalid snapshot array format.', pe);
                }
            }
            
            snapshots.unshift(currentState);
            
            if (snapshots.length > MAX_SNAPSHOTS) {
                snapshots = snapshots.slice(0, MAX_SNAPSHOTS);
            }
            
            await indexedDbAdapter.save(SNAPSHOT_KEY, JSON.stringify(snapshots));
            console.log('[PersistenceService] BACKUP_CREATED');
        } catch (e) {
            console.error('[PersistenceService] Failed to create snapshot:', e);
            try {
                // Fallback to localStorage if IndexedDB fails
                // Lightweight fallback to avoid QuotaExceededError
                const lightweightState: AppState = {
                    ...state,
                    matches: state.matches.filter(m => m.status === 'live'),
                };
                const currentState = { ...lightweightState, timestamp: new Date().toISOString(), ownerId };
                const existingStr = localStorage.getItem(SNAPSHOT_KEY);
                let snapshots: Record<string, unknown>[] = [];
                if (existingStr) {
                    try {
                        const parsed = JSON.parse(existingStr);
                        snapshots = Array.isArray(parsed) ? parsed : [];
                    } catch (pe) {
                         console.warn('[PersistenceValidation] Invalid fallback snapshot array format.', pe);
                    }
                }
                snapshots.unshift(currentState);
                // Lower max snapshots for localStorage to save memory
                const MAX_FALLBACK_SNAPSHOTS = 2;
                if (snapshots.length > MAX_FALLBACK_SNAPSHOTS) snapshots = snapshots.slice(0, MAX_FALLBACK_SNAPSHOTS);
                localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
            } catch (fallbackErr) {
                console.error('[PersistenceService] FALLBACK_SNAPSHOT_FAILED:', fallbackErr);
            }
        }
    }, []);

    const restoreBackup = useCallback(async (newData: AppState) => {
        const validatedData = validateHydrationState(newData);
        const migratedData = migrateState(validatedData);
        
        const filterValidOwner = (item: any) => {
             if (item && item.ownerId !== undefined) {
                  if (typeof item.ownerId !== 'string' || (item.ownerId as string).trim() === '') {
                       console.warn('[AuthValidation] Invalid ownerId rejected in restore.');
                       return false;
                  }
             }
             const isOwned = isEntityOwnedByCurrent(item?.ownerId as string | undefined);
             if (!isOwned) {
                  console.warn('[AuthValidation] Cross-account restore blocked.');
             }
             return isOwned;
        };

        const safeImport: AppState = {
             tournaments: migratedData.tournaments.filter(t => filterValidOwner(t)),
             teams: migratedData.teams.filter(t => filterValidOwner(t)),
             matches: migratedData.matches.filter(m => filterValidOwner(m))
        };
        
        const clonedData = structuredClone(safeImport);
        await saveAppState(clonedData);
    }, [saveAppState]);

    const emergencySaveActiveMatch = useCallback((state: AppState) => {
        if (authLifecycleManager.isPersistencePaused()) return;
        try {
            const activeMatches = state.matches.filter(m => m.status === 'live').map(m => enforceSessionOwner(m));
            if (activeMatches.length > 0) {
                // By-pass the adapter and directly hit IDB for maximum speed
                // Fire and forget, we do not await it
                db.matches.bulkPut(activeMatches).catch(e => {
                    console.error('[PersistenceService] EMERGENCY IDB Save Fail:', e);
                });
            }
        } catch (error) {
            console.error('[PersistenceService] EMERGENCY_SAVE_FAILED:', error);
        }
    }, []);

    return {
        loadAppState,
        saveAppState,
        createSnapshot,
        restoreBackup,
        emergencySaveActiveMatch
    };
};

