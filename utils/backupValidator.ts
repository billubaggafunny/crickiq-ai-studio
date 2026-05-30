import { Tournament, Team, Match } from '../types';

export interface BackupData {
    version: number;
    exportedAt: string;
    data: {
        tournaments: Tournament[];
        teams: Team[];
        matches: Match[];
    };
}

/**
 * Validates the structure and content of a CrickIQ backup file.
 * This is a critical security layer to prevent app crashes from corrupted or malicious imports.
 */
export const validateBackup = (json: unknown): { isValid: boolean; error?: string } => {
    if (!json || typeof json !== 'object') {
        return { isValid: false, error: 'Invalid file format. Must be a JSON object.' };
    }

    // 1. Basic Structure Check
    if (typeof json.version !== 'number') {
        return { isValid: false, error: 'Missing or invalid backup version.' };
    }

    if (!json.exportedAt || typeof json.exportedAt !== 'string' || isNaN(Date.parse(json.exportedAt))) {
        return { isValid: false, error: 'Missing or invalid export timestamp.' };
    }

    if (!json.data || typeof json.data !== 'object') {
        return { isValid: false, error: 'Missing backup data content.' };
    }

    const { tournaments, teams, matches } = json.data;

    // 2. Data Integrity Checks (Arrays must exist)
    if (!Array.isArray(tournaments)) {
        return { isValid: false, error: 'Corrupted data: tournaments must be an array.' };
    }

    if (!Array.isArray(teams)) {
        return { isValid: false, error: 'Corrupted data: teams must be an array.' };
    }

    if (!Array.isArray(matches)) {
        return { isValid: false, error: 'Corrupted data: matches must be an array.' };
    }

    // 3. Entity Validations (Basic property checks to ensure these are actually CrickIQ entities)
    // We don't do exhaustive validation to avoid breaking on future Type additions, 
    // but we check for mandatory "fingerprint" IDs.
    
    for (const t of tournaments) {
        if (!t.id || typeof t.id !== 'string') return { isValid: false, error: 'Invalid tournament found in backup.' };
        if (!t.name || typeof t.name !== 'string') return { isValid: false, error: `Tournament ${t.id} is missing a name.` };
    }

    for (const team of teams) {
        if (!team.id || typeof team.id !== 'string') return { isValid: false, error: 'Invalid team found in backup.' };
        if (!team.name || typeof team.name !== 'string') return { isValid: false, error: `Team ${team.id} is missing a name.` };
        if (!Array.isArray(team.players)) return { isValid: false, error: `Team ${team.name} has no player list.` };
    }

    for (const match of matches) {
        if (!match.id || typeof match.id !== 'string') return { isValid: false, error: 'Invalid match found in backup.' };
        if (!match.team1Id || !match.team2Id) return { isValid: false, error: `Match ${match.id} is missing team information.` };
    }

    return { isValid: true };
};
