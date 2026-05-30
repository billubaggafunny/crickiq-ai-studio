import { Tournament, Team, Match } from '../types';
import { CURRENT_SCHEMA_VERSION } from '../constants/schema';

export interface AppState {
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
}

export interface StorageEnvelope {
  version: number;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  data?: AppState;
}

export const serializeState = (state: AppState): string => {
  try {
    const envelope: StorageEnvelope = {
      version: 1,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: state,
    };
    return JSON.stringify(envelope);
  } catch (err) {
    console.error('[stateSerializer] Serialization failed', err);
    throw err;
  }
};

export const deserializeState = (raw: string | null): StorageEnvelope | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    
    if (!parsed || typeof parsed !== 'object') {
        console.warn('[PersistenceValidation] Invalid backup rejected (not an object).');
        return null;
    }
    
    if (parsed.schemaVersion === undefined) {
        console.warn('[PersistenceValidation] Invalid schemaVersion.');
        return null;
    }
    
    // In actual use, we might support older schemas with migrations, but we need schemaVersion to exist
    // If you have a specific list of supported schemas, you can check here.
    
    if (parsed.data) {
        const { tournaments, teams, matches } = parsed.data;

        const cleanEntity = (arr: unknown, entityName: string): boolean => {
             if (!Array.isArray(arr)) {
                 console.warn(`[PersistenceValidation] Malformed backup rejected: ${entityName} is not an array.`);
                 return false;
             }
             // Filter out malformed ownerId
             parsed.data[entityName] = arr.filter((item: Record<string, unknown>) => {
                 if (item && item.ownerId !== undefined) {
                     if (typeof item.ownerId !== 'string' || (item.ownerId as string).trim() === '') {
                         console.warn(`[PersistenceValidation] Dropping malformed ${entityName} entity (invalid ownerId).`);
                         return false;
                     }
                 }
                 return true;
             });
             return true;
        };

        if (tournaments !== undefined && !cleanEntity(tournaments, 'tournaments')) return null;
        if (teams !== undefined && !cleanEntity(teams, 'teams')) return null;
        if (matches !== undefined && !cleanEntity(matches, 'matches')) return null;
    }
    
    return parsed as StorageEnvelope;
  } catch (err) {
    console.error('[stateSerializer] Deserialization failed', err);
    return null;
  }
};
