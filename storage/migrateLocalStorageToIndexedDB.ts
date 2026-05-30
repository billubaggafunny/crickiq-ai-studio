import { db } from './indexedDb';
import { deserializeState } from '../utils/stateSerializer';
import { STORAGE_KEY } from '../constants/schema';
import { localStorageAdapter } from './localStorageAdapter';

export const migrateLocalStorageToIndexedDB = async (): Promise<boolean> => {
    const rawData = localStorageAdapter.load(STORAGE_KEY) as string | null;
    if (!rawData) {
        console.log('[Migration] No localStorage data found. Skipping migration.');
        return false;
    }

    const envelope = deserializeState(rawData);
    if (!envelope || !envelope.data) {
        console.log('[Migration] Failed to parse localStorage data. Skipping.');
        return false;
    }

    console.log('[Migration] Creating safe rollback backup in localStorage...');
    // Create highly visible rollback backup
    localStorageAdapter.save(STORAGE_KEY + '_MIGRATION_BACKUP', rawData);

    try {
        console.log('[Migration] Starting IndexedDB write...');
        await db.transaction('rw', db.matches, db.teams, db.tournaments, db.metadata, async () => {
             // Clear just in case
             await db.matches.clear();
             await db.teams.clear();
             await db.tournaments.clear();

             if (envelope.data!.matches.length) await db.matches.bulkPut(envelope.data!.matches);
             if (envelope.data!.teams.length) await db.teams.bulkPut(envelope.data!.teams);
             if (envelope.data!.tournaments.length) await db.tournaments.bulkPut(envelope.data!.tournaments);
             
             await db.metadata.put({ key: 'lastMigratedSchema', value: envelope.schemaVersion });
        });
        
        // Verification step
        const matchCount = await db.matches.count();
        const teamCount = await db.teams.count();
        const tournamentCount = await db.tournaments.count();
        
        console.log('[Migration] MIGRATION_SUCCESS');
        console.log(`[Migration] Migrated ${tournamentCount} tournaments, ${teamCount} teams, ${matchCount} matches.`);
        return true;
    } catch (err) {
        console.error('[Migration] MIGRATION_FAILED', err);
        return false;
    }
};
