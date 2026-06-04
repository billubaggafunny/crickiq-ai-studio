import { useMemo } from 'react';
import type { Match } from '../types';

export interface TeamLockStatus {
    isLocked: boolean;
    reason: string;
    activeMatch: Match | null;
    isTossTaken: boolean;
    isLive: boolean;
    isCompleted: boolean;
    isAbandoned: boolean;
}

export function useTeamLock(teamId: string, matches: Match[], tournamentId?: string, isMatchLive: boolean = false): TeamLockStatus {
    return useMemo(() => {
        let activeMatchForLock: Match | undefined;

        if (isMatchLive) {
            activeMatchForLock = matches.find(m => m.status === 'live');
        } else {
            activeMatchForLock = matches.find(m => {
                const isRelevantTournament = tournamentId ? m.tournamentId === tournamentId : true;
                const isRelevantTeam = (m.team1Id === teamId || m.team2Id === teamId);
                
                if (!isRelevantTournament || !isRelevantTeam) return false;

                return (
                    m.status === 'live' || 
                    m.status === 'completed' || 
                    m.wasAbandoned === true || 
                    m.toss !== undefined ||
                    (m.innings1 !== undefined && m.innings1.overs && m.innings1.overs.length > 0)
                );
            });
        }

        const isTossTaken = !!(activeMatchForLock && activeMatchForLock.toss !== undefined);
        const isLive = activeMatchForLock?.status === 'live';
        const isCompleted = activeMatchForLock?.status === 'completed';
        const isAbandoned = !!activeMatchForLock?.wasAbandoned;

        const isLocked = !!activeMatchForLock;
        let reason = '';
        if (isLocked) {
            if (isCompleted) reason = 'Match is completed';
            else if (isAbandoned) reason = 'Match was abandoned';
            else if (isLive) reason = 'Match is currently live';
            else if (isTossTaken) reason = 'Toss has been completed';
            else reason = 'Match is in progress';
        }

        return {
            isLocked,
            reason,
            activeMatch: activeMatchForLock || null,
            isTossTaken,
            isLive,
            isCompleted,
            isAbandoned
        };
    }, [teamId, matches, tournamentId, isMatchLive]);
}
