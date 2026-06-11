import { Match, Team } from '../types';
import { getMaxPlayers } from './matchConfig';

export const getMatchResultLabel = (
    match: Match, 
    getTeamById: (id: string) => Team | undefined
): { message: string, winnerTeam: Team | null | 'draw' } => {
    if (match.wasAbandoned) return { message: 'Match Abandoned', winnerTeam: null };
    if (match.isDraft) return { message: 'Setup Pending', winnerTeam: 'draw' };
    if (match.status !== 'completed') {
        if (match.status === 'live') return { message: 'Match Live', winnerTeam: null };
        if (match.status === 'readyToToss') return { message: 'Ready for Toss', winnerTeam: null };
        if (match.status === 'readyToStart') return { message: 'Ready to Start', winnerTeam: null };
        return { message: 'Upcoming', winnerTeam: null };
    }
    
    const winner = match.winnerId && match.winnerId !== 'draw' ? getTeamById(match.winnerId) : null;
    if (!winner) return { message: 'Match Drawn / Tied', winnerTeam: 'draw' };

    if (match.innings2 && winner.id === match.innings2.battingTeamId) {
        const battingTeam = getTeamById(match.innings2.battingTeamId);
        const maxPlayers = getMaxPlayers(match);
        const totalPlayers = battingTeam?.players?.length > 0 ? battingTeam.players.length : maxPlayers;
        const wicketsLeft = totalPlayers - 1 - (match.innings2.wickets || 0);
        return { message: `${winner.name} won by ${wicketsLeft} wickets`, winnerTeam: winner };
    } else if (match.innings1 && winner.id === match.innings1.battingTeamId) {
        const runMargin = (match.innings1.score || 0) - (match.innings2?.score || 0);
        return { message: `${winner.name} won by ${runMargin} runs`, winnerTeam: winner };
    }
    return { message: `${winner.name} won`, winnerTeam: winner };
};
