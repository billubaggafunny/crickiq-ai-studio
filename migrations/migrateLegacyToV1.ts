import { EnvelopedData } from './migrationRunner';
import { Match, Team, Tournament } from '../types';

/**
 * Migrates data from the ancient "un-enveloped" format to Version 1.
 */
export const migrateLegacyToV1 = (oldData: Record<string, unknown>): EnvelopedData => {
    const freshData = {
        tournaments: Array.isArray(oldData?.tournaments) ? (oldData.tournaments as Tournament[]) : [],
        teams: Array.isArray(oldData?.teams) ? (oldData.teams as Team[]) : [],
        matches: Array.isArray(oldData?.matches) ? (oldData.matches as Match[]) : []
    };

    return {
        version: 1,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: freshData
    };
};
