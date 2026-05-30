import Dexie, { type Table } from 'dexie';
import type { Match, Team, Tournament } from '../types';
import type { AppState } from '../utils/stateSerializer';

export interface SyncQueueItem {
    id?: number;
    entityType: 'match' | 'team' | 'tournament';
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    timestamp: string;
    status: 'pending' | 'syncing' | 'failed' | 'completed';
}

export interface SnapshotItem {
    id?: number;
    ownerId?: string;
    timestamp: string;
    data: AppState;
}

export interface MetadataItem {
    key: string;
    value: unknown;
}

export class CrickIQDatabase extends Dexie {
    matches!: Table<Match, string>;
    teams!: Table<Team, string>;
    tournaments!: Table<Tournament, string>;
    syncQueue!: Table<SyncQueueItem, number>;
    snapshots!: Table<SnapshotItem, number>;
    metadata!: Table<MetadataItem, string>;

    constructor() {
        super('CrickIQDatabase');
        
        // Define schemas
        this.version(1).stores({
            matches: 'id, tournamentId, status',
            teams: 'id, tournamentId',
            tournaments: 'id',
            syncQueue: '++id, entityType, entityId, status',
            snapshots: '++id, timestamp',
            metadata: 'key'
        });
    }
}

export const db = new CrickIQDatabase();
