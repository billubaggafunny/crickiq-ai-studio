import type { Match, Team, Tournament, Innings } from '../types';

export type SyncStatus = 'local' | 'pending' | 'synced' | 'failed' | 'conflict';

/**
 * Generates a stable UUID using crypto.randomUUID.
 * This is the standard for generating all new entity IDs.
 */
export const generateEntityId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID (very rare in modern browsers/Node)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Creates an ISO 8601 timestamp string for entity creation/updates.
 */
export const createTimestamp = (): string => {
    return new Date().toISOString();
};

/**
 * Creates the initial sync metadata for a new entity.
 */
export const createSyncMetadata = (): { syncStatus: SyncStatus } => {
    return { syncStatus: 'local' };
};

/**
 * Safely migrates existing entities by detecting missing IDs and metadata,
 * generating them once, and mutating the passed objects to persist permanently.
 */
export const migrateEntityMetadata = (data: { tournaments: Tournament[]; teams: Team[]; matches: Match[] }): boolean => {
    let changed = false;

    // Migrate tournaments
    data.tournaments.forEach(t => {
        if (!t.createdAt) { t.createdAt = createTimestamp(); changed = true; }
        if (!t.updatedAt) { t.updatedAt = t.createdAt; changed = true; }
        if (!t.syncStatus) { t.syncStatus = 'local'; changed = true; }
    });

    // Migrate teams
    data.teams.forEach(t => {
        if (!t.createdAt) { t.createdAt = createTimestamp(); changed = true; }
        if (!t.updatedAt) { t.updatedAt = t.createdAt; changed = true; }
        if (!t.syncStatus) { t.syncStatus = 'local'; changed = true; }
    });

    // Migrate matches and balls
    data.matches.forEach(m => {
        if (!m.matchId) { m.matchId = generateEntityId(); changed = true; }
        if (!m.createdAt) { m.createdAt = createTimestamp(); changed = true; }
        if (!m.updatedAt) { m.updatedAt = m.createdAt; changed = true; }
        if (!m.syncStatus) { m.syncStatus = 'local'; changed = true; }

        const migrateInnings = (innings?: Innings) => {
            if (innings?.balls) {
                innings.balls.forEach(b => {
                    if (!b.ballId) { b.ballId = generateEntityId(); changed = true; }
                    if (!b.timestamp) { b.timestamp = createTimestamp(); changed = true; }
                    if (!b.syncStatus) { b.syncStatus = 'local'; changed = true; }
                });
            }
        };

        if (m.innings1) migrateInnings(m.innings1);
        if (m.innings2) migrateInnings(m.innings2);
    });

    return changed;
};
