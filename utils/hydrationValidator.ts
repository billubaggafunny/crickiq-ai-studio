import { AppState } from './stateSerializer';

export const validateHydrationState = (state: AppState): AppState => {
    // 1. Validate Teams
    const safeTeams = state.teams.filter(team => {
        if (!team || !team.id || typeof team.id !== 'string') return false;
        if (typeof team.name !== 'string') return false;
        if (!Array.isArray(team.players)) return false;
        return true;
    });

    const validTeamIds = new Set(safeTeams.map(t => t.id));

    // 2. Validate Tournaments
    const safeTournaments = state.tournaments.filter(t => {
        if (!t || !t.id || typeof t.id !== 'string') return false;
        return true;
    });

    // 3. Validate Matches
    const safeMatches = state.matches.filter(match => {
        if (!match || !match.id || typeof match.id !== 'string') {
            console.warn('[HydrationValidation] Skipped malformed match (invalid id).');
            return false;
        }
        if (!match.team1Id || !match.team2Id || typeof match.team1Id !== 'string' || typeof match.team2Id !== 'string') {
            console.warn(`[HydrationValidation] Skipped malformed match ${match.id} (missing teams).`);
            return false;
        }
        if (match.team1Id === match.team2Id) {
            console.warn(`[HydrationValidation] Skipped malformed match ${match.id} (same team playing against itself).`);
            return false;
        }
        if (typeof match.oversPerInnings !== 'number' || !Number.isFinite(match.oversPerInnings) || isNaN(match.oversPerInnings) || match.oversPerInnings <= 0) {
            console.warn(`[HydrationValidation] Skipped malformed match ${match.id} (invalid overs).`);
            return false;
        }
        
        // Ensure teams exist (prevents broken references in runtime UI)
        if (!validTeamIds.has(match.team1Id) || !validTeamIds.has(match.team2Id)) {
            console.warn(`[HydrationValidation] Skipped malformed match ${match.id} (referenced team does not exist).`);
            // Gracefully drop match instead of crashing
            return false;
        }

        // Validate Innings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validateInnings = (innings: any, key: string) => {
            if (!innings) return true;
            if (typeof innings !== 'object') {
                console.warn(`[HydrationValidation] Invalid ${key} rejected in match ${match.id}.`);
                return false;
            }
            if (typeof innings.score !== 'number' || !Number.isFinite(innings.score) || isNaN(innings.score) || innings.score < 0) {
                 console.warn(`[HydrationValidation] Invalid ${key} rejected (NaN/negative score) in match ${match.id}.`);
                 return false;
            }
            if (typeof innings.wickets !== 'number' || !Number.isFinite(innings.wickets) || isNaN(innings.wickets) || innings.wickets < 0 || innings.wickets > 11) {
                 console.warn(`[HydrationValidation] Invalid ${key} rejected (invalid wickets) in match ${match.id}.`);
                 return false;
            }
            if (!Array.isArray(innings.balls)) {
                 console.warn(`[HydrationValidation] Invalid ${key} rejected (balls not array) in match ${match.id}.`);
                 return false;
            }
            if (innings.currentBatsmen !== undefined) {
                 if (!Array.isArray(innings.currentBatsmen) || innings.currentBatsmen.length !== 2) {
                     console.warn(`[HydrationValidation] Invalid ${key} rejected (currentBatsmen format) in match ${match.id}.`);
                     return false;
                 }
                 // Simple safety for striker
                 if (innings.currentBatsmen[0] !== '' && typeof innings.currentBatsmen[0] !== 'string') {
                     console.warn(`[HydrationValidation] Invalid ${key} rejected (striker id invalid) in match ${match.id}.`);
                     return false;
                 }
            }
            if (innings.batsmanScores !== undefined && typeof innings.batsmanScores !== 'object') {
                 console.warn(`[HydrationValidation] Invalid ${key} rejected (batsmanScores format) in match ${match.id}.`);
                 return false;
            }
            return true;
        };

        if (match.innings1 && !validateInnings(match.innings1, 'innings1')) return false;
        if (match.innings2 && !validateInnings(match.innings2, 'innings2')) return false;

        return true;
    });

    return {
        tournaments: safeTournaments,
        teams: safeTeams,
        matches: safeMatches
    };
};
