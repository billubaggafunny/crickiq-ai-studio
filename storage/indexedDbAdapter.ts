import { StorageAdapter } from './storageAdapter';
import { db } from './indexedDb';
import { deserializeState, serializeState, AppState } from '../utils/stateSerializer';
import type { Match, Team, Tournament } from '../types';
import { SNAPSHOT_KEY, STORAGE_KEY } from '../constants/schema';
import { isEntityOwnedByCurrent } from '../utils/persistenceContext';

export const indexedDbAdapter: StorageAdapter = {
    load: async (key: string): Promise<string | null> => {
        try {
            if (key === STORAGE_KEY) {
                // Load ALL entities from DB. Filtering is done at the hydration layer
                // so we don't change how adapter returns data.
                const matches = await db.matches.toArray();
                const teams = await db.teams.toArray();
                const tournaments = await db.tournaments.toArray();
                
                if (matches.length === 0 && teams.length === 0 && tournaments.length === 0) {
                   return null; // Signals empty, allows fallback
                }
                
                return serializeState({
                    matches,
                    teams,
                    tournaments
                });
            } else if (key === SNAPSHOT_KEY) {
                const snaps = await db.snapshots.orderBy('timestamp').reverse().toArray();
                return JSON.stringify(snaps.map(s => s.data));
            }
            return null;
        } catch (e) {
            console.error('[indexedDbAdapter] load error:', e);
            throw e;
        }
    },
    
    save: async (key: string, data: string): Promise<void> => {
        try {
            if (key === STORAGE_KEY) {
                const envelope = deserializeState(data);
                if (!envelope || !envelope.data) return;
                
                const appData = envelope.data;
                // Only rewrite what is needed to avoid full re-writes
                await db.transaction('rw', db.matches, db.teams, db.tournaments, db.metadata, async () => {
                    // Match sync: Only touch matches belonging to the current owner context
                    const existingMatches = await db.matches.toArray();
                    const currentOwnerExistingMatchIds = existingMatches
                        .filter(m => isEntityOwnedByCurrent(m.ownerId))
                        .map(m => m.id);
                        
                    const newMatchIds = new Set(appData.matches.map((m: Match) => m.id));
                    const toDeleteMatches = currentOwnerExistingMatchIds.filter(id => !newMatchIds.has(id));
                    if (toDeleteMatches.length) await db.matches.bulkDelete(toDeleteMatches);
                    if (appData.matches.length) await db.matches.bulkPut(appData.matches);

                    // Team sync: Only touch teams belonging to the current owner context
                    const existingTeams = await db.teams.toArray();
                    const currentOwnerExistingTeamIds = existingTeams
                        .filter(t => isEntityOwnedByCurrent(t.ownerId))
                        .map(t => t.id);
                        
                    const newTeamIds = new Set(appData.teams.map((t: Team) => t.id));
                    const toDeleteTeams = currentOwnerExistingTeamIds.filter(id => !newTeamIds.has(id));
                    if (toDeleteTeams.length) await db.teams.bulkDelete(toDeleteTeams);
                    if (appData.teams.length) await db.teams.bulkPut(appData.teams);

                    // Tournament sync: Only touch tournaments belonging to the current owner context
                    const existingTournaments = await db.tournaments.toArray();
                    const currentOwnerExistingTournamentIds = existingTournaments
                        .filter(t => isEntityOwnedByCurrent(t.ownerId))
                        .map(t => t.id);
                        
                    const newTournamentIds = new Set(appData.tournaments.map((t: Tournament) => t.id));
                    const toDeleteTournaments = currentOwnerExistingTournamentIds.filter(id => !newTournamentIds.has(id));
                    if (toDeleteTournaments.length) await db.tournaments.bulkDelete(toDeleteTournaments);
                    if (appData.tournaments.length) await db.tournaments.bulkPut(appData.tournaments);

                    await db.metadata.put({ key: 'schemaVersion', value: envelope.schemaVersion });
                    await db.metadata.put({ key: 'updatedAt', value: envelope.updatedAt });
                });
            } else if (key === SNAPSHOT_KEY) {
                let snaps: Record<string, unknown>[];
                try {
                    snaps = JSON.parse(data) as Record<string, unknown>[];
                    if (!Array.isArray(snaps)) {
                        console.warn('[PersistenceValidation] Snapshots backup rejected (not an array).');
                        return;
                    }
                } catch (parseErr) {
                    console.warn('[PersistenceValidation] Invalid snapshot backup JSON rejected.', parseErr);
                    return;
                }
                
                await db.transaction('rw', db.snapshots, async () => {
                    const allExistingSnaps = await db.snapshots.toArray();
                    const toDeleteSnapIds = allExistingSnaps
                        .filter(s => isEntityOwnedByCurrent(s.ownerId))
                        .map(s => s.id)
                        .filter((id): id is number => id !== undefined);
                    
                    if (toDeleteSnapIds.length) await db.snapshots.bulkDelete(toDeleteSnapIds);
                    
                    const items = snaps.map((s: Record<string, unknown>) => ({
                        ownerId: s.ownerId as string | undefined,
                        timestamp: (s.timestamp as string) || new Date().toISOString(),
                        data: s as unknown as AppState // type match AppState internally for snapshots
                    }));
                    await db.snapshots.bulkAdd(items);
                });
            }
        } catch (e) {
            console.error('[indexedDbAdapter] save error:', e);
            throw e;
        }
    },
    
    clear: async (): Promise<void> => {
        // Clear should ONLY clear current owner's data, not everything!
        try {
            await db.transaction('rw', [db.matches, db.teams, db.tournaments, db.snapshots, db.metadata], async () => {
                const matches = await db.matches.toArray();
                const toDelMatches = matches.filter(m => isEntityOwnedByCurrent(m.ownerId)).map(m => m.id);
                if (toDelMatches.length) await db.matches.bulkDelete(toDelMatches);
                
                const teams = await db.teams.toArray();
                const toDelTeams = teams.filter(t => isEntityOwnedByCurrent(t.ownerId)).map(t => t.id);
                if (toDelTeams.length) await db.teams.bulkDelete(toDelTeams);
                
                const tournaments = await db.tournaments.toArray();
                const toDelTourns = tournaments.filter(t => isEntityOwnedByCurrent(t.ownerId)).map(t => t.id);
                if (toDelTourns.length) await db.tournaments.bulkDelete(toDelTourns);
                
                const snaps = await db.snapshots.toArray();
                const toDelSnaps = snaps.filter(s => isEntityOwnedByCurrent(s.ownerId)).map(s => s.id).filter((id): id is number => id !== undefined);
                if (toDelSnaps.length) await db.snapshots.bulkDelete(toDelSnaps);
                
                // Do we clear syncQueue? Probably not yet since we aren't migrating that fully yet.
            });
        } catch (e) {
             console.error('[indexedDbAdapter] clear error:', e);
             throw e;
        }
    }
};
