import { MatchException } from '../types';

export const createBowlerLimitException = (bowlerId: string, limit: number, timestamp?: number): MatchException => ({
    type: "BOWLER_LIMIT_EXCEPTION",
    bowlerId,
    limit,
    timestamp: timestamp || Date.now()
});
