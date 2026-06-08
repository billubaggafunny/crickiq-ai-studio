import { Match, Team, MatchPlayerSnapshot } from "../types";

export function buildMatchPlayerSnapshots({
    match,
    team1,
    team2
}: {
    match: Match;
    team1: Team;
    team2: Team;
}): Record<string, MatchPlayerSnapshot> {
    const snapshots: Record<string, MatchPlayerSnapshot> = {};

    const addSnapshotsForTeam = (team: Team, squadIds: string[] | undefined, teamSide: "team1" | "team2") => {
        if (!squadIds) return;
        
        squadIds.forEach(playerId => {
            const player = team.players.find(p => p.id === playerId);
            if (!player) return;

            const pRecord = player as Record<string, unknown>;
            // Determine if player has wicketkeeper role or flag
            const isWicketKeeper = 
                player.role === "Wicket Keeper" || 
                pRecord.isWicketKeeper || 
                pRecord.isWicketkeeper ||
                (typeof pRecord.role === 'string' && pRecord.role.toLowerCase().includes('wk')) ||
                (typeof pRecord.role === 'string' && pRecord.role.toLowerCase().includes('keeper'));

            const snapshot: MatchPlayerSnapshot = {
                playerId: player.id,
                globalPlayerId: player.globalPlayerId,
                name: player.name,
                number: player.number,
                role: player.role,
                battingStyle: pRecord.battingStyle as string | undefined,
                bowlingStyle: pRecord.bowlingStyle as string | undefined,
                isWicketKeeper: !!isWicketKeeper,
                isCaptain: player.id === team.captainId,
                isViceCaptain: player.id === team.viceCaptainId,
                teamId: team.id,
                teamSide
            };

            snapshots[player.id] = snapshot;
        });
    };

    addSnapshotsForTeam(team1, match.team1SquadIds, "team1");
    addSnapshotsForTeam(team2, match.team2SquadIds, "team2");

    return snapshots;
}

export function getPlayerDisplayFromSnapshot(match: Match | undefined, playerId: string, teams: Team[]): string {
    if (match?.playerSnapshots && match.playerSnapshots[playerId]) {
        return match.playerSnapshots[playerId].name;
    }

    const allPlayers = teams.flatMap(t => t.players);
    const existingPlayer = allPlayers.find(p => p.id === playerId);
    
    if (existingPlayer) {
        return existingPlayer.name;
    }

    return "Unknown Player";
}
