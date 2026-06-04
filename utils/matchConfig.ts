import { Match, Tournament, Team, Player } from '../types';

export function getRequiredSquadSize(match?: Match, tournament?: Tournament): number {
    if (match && typeof match.numberOfPlayers === 'number' && match.numberOfPlayers > 0) {
        return match.numberOfPlayers;
    }
    if (tournament && typeof tournament.numberOfPlayers === 'number' && tournament.numberOfPlayers > 0) {
        return tournament.numberOfPlayers;
    }
    return 11; // legacy fallback
}

export function getMaxPlayers(match?: Match, tournament?: Tournament): number {
    return getRequiredSquadSize(match, tournament);
}

export function getEffectiveSquadIds(match: Match | undefined, teamId: string): string[] {
    if (!match) return [];
    
    const originalSquadIds =
        teamId === match.team1Id
            ? match.team1SquadIds || []
            : teamId === match.team2Id
            ? match.team2SquadIds || []
            : [];

    const teamReplacements =
        (match.replacements || []).filter(r => r.teamId === teamId);

    const incomingIds = teamReplacements.map(r => r.incomingPlayerId);
    const outgoingIds = teamReplacements.map(r => r.outgoingPlayerId);

    return Array.from(new Set([...originalSquadIds, ...incomingIds]))
        .filter(id => !outgoingIds.includes(id));
}

export function getEffectiveSquadPlayers(team: Team | undefined, match: Match | undefined): Player[] {
    if (!team || !match) return [];
    const effectiveSquadIds = getEffectiveSquadIds(match, team.id);
    return team.players.filter(player => effectiveSquadIds.includes(player.id));
}

