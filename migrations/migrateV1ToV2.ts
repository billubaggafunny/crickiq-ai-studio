import { EnvelopedData } from './migrationRunner';
import { Tournament } from '../types';

/**
 * Example migration: V1 to V2.
 * In a real scenario, this might rename fields, add defaults, or restructure entities.
 */
export const migrateV1ToV2 = (v1Data: EnvelopedData): EnvelopedData => {
    // We use structuredClone to ensure immutability
    const v2Data = structuredClone(v1Data);

    // Update version
    v2Data.schemaVersion = 2;
    v2Data.updatedAt = new Date().toISOString();

    // Example transformation: Ensure all tournaments have a format property
    // (This matches the current app behavior but ensures it's enforced on old data)
    if (v2Data.data && Array.isArray(v2Data.data.tournaments)) {
        v2Data.data.tournaments = v2Data.data.tournaments.map((t: Tournament) => ({
            ...t,
            format: t.format || 'Round Robin'
        }));
    }

    // Add a marker for debugging/audit
    const history = v2Data._migrationHistory || [];
    history.push({
        from: 1,
        to: 2,
        appliedAt: new Date().toISOString()
    });
    v2Data._migrationHistory = history;

    return v2Data;
};
