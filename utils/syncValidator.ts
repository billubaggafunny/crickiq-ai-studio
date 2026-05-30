import { CURRENT_SCHEMA_VERSION } from '../constants/schema';
import { isValidOwnerId, doesOwnerMatchCurrentSession } from './authValidator';

// Types for sync payload validation
export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncMetadata {
    entityType: 'tournament' | 'team' | 'match' | string;
    entityId: string;
    operation: SyncOperation;
    timestamp?: string | number;
}

export interface SyncEntityEnvelope {
    ownerId: string;
    schemaVersion: number;
    entityVersion?: number;
    createdAt?: string | number;
    updatedAt?: string | number;
}

export const isValidSyncTimestamp = (timestamp: unknown): boolean => {
    if (timestamp === undefined || timestamp === null) return false;
    
    // Support numeric timestamps (milliseconds)
    if (typeof timestamp === 'number') {
        return Number.isFinite(timestamp) && !isNaN(timestamp) && timestamp > 0;
    }
    
    // Support string iso timestamps
    if (typeof timestamp === 'string') {
        const parsed = Date.parse(timestamp);
        return !isNaN(parsed) && Number.isFinite(parsed) && parsed > 0;
    }
    
    return false;
};

export const validateSyncMetadata = (metadata: unknown): metadata is SyncMetadata => {
    if (!metadata || typeof metadata !== 'object') {
        console.warn('[SyncValidation] Malformed sync metadata (not an object).');
        return false;
    }

    const { entityType, entityId, operation } = metadata as SyncMetadata;

    if (typeof entityType !== 'string' || entityType.trim() === '') {
        console.warn('[SyncValidation] Malformed sync metadata (invalid entityType).');
        return false;
    }

    if (typeof entityId !== 'string' || entityId.trim() === '') {
        console.warn('[SyncValidation] Malformed sync metadata (invalid entityId).');
        return false;
    }

    if (operation !== 'create' && operation !== 'update' && operation !== 'delete') {
        console.warn('[SyncValidation] Malformed sync metadata (invalid operation).');
        return false;
    }

    return true;
};

export const validateSyncEnvelope = (envelope: unknown): envelope is SyncEntityEnvelope => {
    if (!envelope || typeof envelope !== 'object') {
        console.warn('[SyncValidation] Malformed sync envelope (not an object).');
        return false;
    }

    const { ownerId, schemaVersion, entityVersion, createdAt, updatedAt } = envelope as SyncEntityEnvelope;

    if (!isValidOwnerId(ownerId) || typeof ownerId !== 'string') {
         console.warn('[SyncValidation] Invalid ownerId rejected in sync envelope.');
         return false;
    }
    
    if (!doesOwnerMatchCurrentSession(ownerId)) {
         console.warn('[SyncValidation] Cross-account sync operation rejected (owner mismatch).');
         return false; // prevent queue poisoning/stale replay
    }

    if (typeof schemaVersion !== 'number' || isNaN(schemaVersion) || !Number.isFinite(schemaVersion)) {
         console.warn('[SyncValidation] Invalid schemaVersion in sync envelope.');
         return false;
    }
    
    if (schemaVersion > CURRENT_SCHEMA_VERSION) {
         console.warn(`[SyncValidation] Unsupported future schema version (${schemaVersion}) rejected.`);
         return false;
    }

    if (entityVersion !== undefined) {
         if (typeof entityVersion !== 'number' || isNaN(entityVersion) || !Number.isFinite(entityVersion)) {
              console.warn('[SyncValidation] Invalid entityVersion skipped.');
              return false;
         }
    }

    if (createdAt !== undefined && !isValidSyncTimestamp(createdAt)) {
         console.warn('[SyncValidation] Invalid createdAt timestamp rejected.');
         return false;
    }

    if (updatedAt !== undefined && !isValidSyncTimestamp(updatedAt)) {
         console.warn('[SyncValidation] Invalid updatedAt timestamp rejected.');
         return false;
    }

    return true;
};

export const validateSyncEntity = (entity: unknown, metadata: SyncMetadata): boolean => {
    // 1. Validate metadata envelope first
    if (!validateSyncMetadata(metadata)) return false;
    
    // 2. Extract and validate envelope properties (acts as the payload guard)
    if (!validateSyncEnvelope(entity)) return false;
    
    // NOTE: Deep inner domain-validation of `match` tree, `teams`, `tournaments`
    // is NOT done here. It is done lazily at hydrate time (HydrationValidator) or runtime,
    // to keep Android sync performance perfectly smooth and O(1) depth.
    
    return true;
};
