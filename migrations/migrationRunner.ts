import { Tournament, Team, Match } from '../types';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEY } from '../constants/schema';
import { migrateLegacyToV1 } from './migrateLegacyToV1';
import { migrateV1ToV2 } from './migrateV1ToV2';
import { localStorageAdapter } from '../storage/localStorageAdapter';
import { indexedDbAdapter } from '../storage/indexedDbAdapter';
import { migrateLocalStorageToIndexedDB } from '../storage/migrateLocalStorageToIndexedDB';

export interface EnvelopedData {
    version: number;
    schemaVersion: number;
    createdAt: string;
    updatedAt: string;
    data: {
        tournaments: Tournament[];
        teams: Team[];
        matches: Match[];
    };
    _migrationHistory?: Array<{
        from: number;
        to: number;
        appliedAt: string;
    }>;
}

/**
 * The Migration Runner is responsible for bootstrapping the app state.
 * It handles legacy data conversion and sequential schema upgrades.
 */
export const runMigrations = (rawData: Record<string, unknown>): EnvelopedData => {
    let currentData = structuredClone(rawData) as unknown as EnvelopedData;

    try {
        if (!currentData || typeof currentData !== 'object') {
             throw new Error('Invalid root data');
        }

        // 1. Detect Legacy Data (Version 0 / No Envelope)
        // A legacy structure has 'tournaments' but no 'schemaVersion'
        if (!('schemaVersion' in currentData)) {
            if ('tournaments' in currentData) {
                console.log('Migration detected: Legacy -> V1');
                currentData = migrateLegacyToV1(currentData as unknown as Record<string, unknown>) as unknown as EnvelopedData;
            } else {
                console.warn('[PersistenceValidation] Missing schemaVersion and not legacy format.');
                throw new Error('Missing schemaVersion');
            }
        }
        
        if (typeof currentData.schemaVersion !== 'number') {
            console.warn('[PersistenceValidation] Invalid schemaVersion type.');
            throw new Error('Invalid schemaVersion type');
        }
        
        if (currentData.schemaVersion > CURRENT_SCHEMA_VERSION) {
            console.warn(`[PersistenceValidation] Unsupported schema version: ${currentData.schemaVersion}`);
            throw new Error('Unsupported schema version');
        }

        // 2. Run Sequential Migrations
        while (currentData.schemaVersion < CURRENT_SCHEMA_VERSION) {
            const fromVersion = currentData.schemaVersion;
            const toVersion = fromVersion + 1;
            console.log(`Migration detected: V${fromVersion} -> V${toVersion}`);

            switch (toVersion) {
                case 2:
                    currentData = migrateV1ToV2(currentData);
                    break;
                default:
                    console.warn(`No migration found for version ${toVersion}. Stopping.`);
                    currentData.schemaVersion = CURRENT_SCHEMA_VERSION; // Prevent infinite loop
                    break;
            }
        }

        // Update the 'updatedAt' timestamp if we migrated
        if (currentData.schemaVersion !== (rawData?.schemaVersion as number)) {
            currentData.updatedAt = new Date().toISOString();
        }

        return currentData as EnvelopedData;
    } catch (error) {
        console.error('CRITICAL: Migration failed!', error);
        throw error;
    }
};

/**
 * Loads and migrates data asynchronously from IndexedDB.
 */
export const loadAndMigrateDataAsync = async (): Promise<EnvelopedData> => {
    try {
        let rawString = await indexedDbAdapter.load(STORAGE_KEY) as string | null;
        
        if (!rawString) {
             console.log('[Migration] No IndexedDB data. Attempting auto-migration from localStorage.');
             const migrated = await migrateLocalStorageToIndexedDB();
             if (migrated) {
                  rawString = await indexedDbAdapter.load(STORAGE_KEY) as string | null;
             }
        }
        
        if (!rawString) {
             // Fresh start
             return {
                version: 1,
                schemaVersion: CURRENT_SCHEMA_VERSION,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: { tournaments: [], teams: [], matches: [] }
            };
        }

        let rawData;
        try {
            rawData = JSON.parse(rawString);
            if (!rawData || typeof rawData !== 'object') {
                console.warn('[PersistenceValidation] Invalid persistence data structure');
                throw new Error('Invalid structure');
            }
        } catch (pe) {
            console.warn('[PersistenceValidation] Malformed IndexedDB JSON: ', pe);
            throw pe;
        }
        const migratedData = runMigrations(rawData);
        
        // Save back the migrated version to avoid re-running migrations next time
        await indexedDbAdapter.save(STORAGE_KEY, JSON.stringify(migratedData));
        
        return migratedData;
    } catch (error) {
        console.error('Failed to load/parse data async:', error);
        // Let it fall back to localStorage adapter if IDB completely fails
        console.warn('Falling back to synchronous localStorageAdapter load due to IDB failure.');
        return loadAndMigrateData();
    }
};

/**
 * Loads and migrates data from localStorage.
 */
export const loadAndMigrateData = (): EnvelopedData => {
    try {
        const rawString = localStorageAdapter.load(STORAGE_KEY);
        if (!rawString) {
             // Fresh start
             return {
                version: 1,
                schemaVersion: CURRENT_SCHEMA_VERSION,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: { tournaments: [], teams: [], matches: [] }
            };
        }

        let rawData;
        try {
            rawData = JSON.parse(rawString);
            if (!rawData || typeof rawData !== 'object') {
                console.warn('[PersistenceValidation] Invalid persistence data structure');
                throw new Error('Invalid structure');
            }
        } catch (pe) {
            console.warn('[PersistenceValidation] Malformed LS JSON: ', pe);
            throw pe;
        }
        const migratedData = runMigrations(rawData);
        
        // Save back the migrated version to avoid re-running migrations next time
        localStorageAdapter.save(STORAGE_KEY, JSON.stringify(migratedData));
        
        return migratedData;
    } catch (error) {
        console.warn('[PersistenceValidation] Failed to load/parse LS data, throwing to prevent wipe', error);
        throw error;
    }
};
