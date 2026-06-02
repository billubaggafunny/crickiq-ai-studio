import { Team, Match, Tournament } from '../types';

/**
 * Finds all internal player IDs that share the same globalPlayerId.
 */
export const getLinkedPlayerIds = (teams: Team[], globalPlayerId: string): string[] => {
    const ids = new Set<string>();
    teams.forEach(team => {
        team.players.forEach(player => {
            if (player.globalPlayerId === globalPlayerId) {
                ids.add(player.id);
                // Also add originalId just in case it's used in stats tracking
                if (player.originalId) {
                    ids.add(player.originalId);
                }
            }
        });
    });
    return Array.from(ids);
};

/**
 * Finds all teams that a player belongs to, using their globalPlayerId.
 */
export const getPlayerTeams = (teams: Team[], globalPlayerId: string): Team[] => {
    return teams.filter(team => 
        team.players.some(player => player.globalPlayerId === globalPlayerId)
    );
};

/**
 * Finds all matches that a player participated in, using their globalPlayerId.
 */
export const getPlayerMatches = (teams: Team[], matches: Match[], globalPlayerId: string): Match[] => {
    const linkedIds = new Set(getLinkedPlayerIds(teams, globalPlayerId));
    
    return matches.filter(match => {
        // Did they bat?
        const batted1 = match.innings1?.batsmanScores && Object.keys(match.innings1.batsmanScores).some(id => linkedIds.has(id));
        const batted2 = match.innings2?.batsmanScores && Object.keys(match.innings2.batsmanScores).some(id => linkedIds.has(id));
        
        // Did they bowl?
        const bowled1 = match.innings1?.bowlerScores && Object.keys(match.innings1.bowlerScores).some(id => linkedIds.has(id));
        const bowled2 = match.innings2?.bowlerScores && Object.keys(match.innings2.bowlerScores).some(id => linkedIds.has(id));
        
        // Were they listed in current batsmen or bowler even if no runs/balls scored?
        const listed1 = match.innings1?.currentBatsmen?.some(id => id && linkedIds.has(id)) || match.innings1?.currentBowler && linkedIds.has(match.innings1.currentBowler);
        const listed2 = match.innings2?.currentBatsmen?.some(id => id && linkedIds.has(id)) || match.innings2?.currentBowler && linkedIds.has(match.innings2.currentBowler);
        
        // Were they in replacements?
        const replacedIn = match.replacements?.some(r => linkedIds.has(r.incomingPlayerId) || linkedIds.has(r.outgoingPlayerId));
        
        return batted1 || batted2 || bowled1 || bowled2 || listed1 || listed2 || replacedIn;
    });
};

/**
 * Finds all tournaments that a player has matches in or is part of a participating team.
 */
export const getPlayerTournaments = (tournaments: Tournament[], teams: Team[], matches: Match[], globalPlayerId: string): Tournament[] => {
    const playerTeams = getPlayerTeams(teams, globalPlayerId);
    const playerTeamIds = new Set(playerTeams.map(t => t.id));
    
    return tournaments.filter(tournament => {
        // Tournament includes a team this player is in
        const teamInTournament = tournament.teams?.some(teamId => playerTeamIds.has(teamId));
        // Or if Tournament explicitly lists matches, though here we match via team references
        return teamInTournament;
    });
};
