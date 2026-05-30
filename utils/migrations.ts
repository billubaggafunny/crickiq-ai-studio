import { AppState } from './stateSerializer';
import { Match, Innings, Tournament } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const migrateInnings = (innings: any, matchContext: Partial<Match>): Innings | undefined => {
    if (!innings) return undefined;
    
    // Create safe copy
    const safeInnings = { ...innings } as Innings;
    
    // Ensure exception array exists safely
    if (!safeInnings.exceptions || !Array.isArray(safeInnings.exceptions)) {
        safeInnings.exceptions = [];
    }
    
    // Migrate old string exceptions to objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    safeInnings.exceptions = safeInnings.exceptions.map((exc: any) => {
        if (typeof exc === 'string') {
            const matchId = exc.match(/Bowler (p_[\w]+)/);
            if (matchId && matchId[1]) {
                const limitMatch = exc.match(/limit (\d+)/);
                const limit = limitMatch ? parseInt(limitMatch[1], 10) : matchContext.maxOversPerBowler || 0;
                return {
                    type: "BOWLER_LIMIT_EXCEPTION",
                    bowlerId: matchId[1],
                    limit,
                    timestamp: Date.now()
                };
            }
        }
        return exc;
    });

    return safeInnings;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const migrateMatch = (match: any): Match => {
    if (!match) return match;
    
    const maxOvers = match.maxOversPerBowler ?? undefined;
    
    return {
        ...match,
        maxOversPerBowler: maxOvers,
        innings1: migrateInnings(match.innings1, match),
        innings2: migrateInnings(match.innings2, match),
    } as Match;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const migrateTournament = (tournament: any): Tournament => {
    if (!tournament) return tournament;
    return {
        ...tournament,
    } as Tournament;
};

export const migrateState = (state: AppState & { schemaVersion?: number }): AppState & { schemaVersion?: number } => {
    if (!state) return state;
    
    const migratedState = { ...state };
    
    // Schema versioning support
    const currentVersion = migratedState.schemaVersion || 0;
    
    if (currentVersion < 1) {
        if (Array.isArray(migratedState.matches)) {
            migratedState.matches = migratedState.matches.map(migrateMatch);
        }
        
        if (Array.isArray(migratedState.tournaments)) {
            migratedState.tournaments = migratedState.tournaments.map(migrateTournament);
        }
        
        migratedState.schemaVersion = 1;
    }
    
    return migratedState;
};
