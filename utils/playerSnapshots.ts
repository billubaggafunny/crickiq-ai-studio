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

            // Determine if player has wicketkeeper role or flag
            const isWicketKeeper = 
                player.role === "Wicket Keeper" || 
                (player as any).isWicketKeeper || 
                (player as any).isWicketkeeper ||
                ((player as any).role && (player as any).role.toLowerCase().includes('wk')) ||
                ((player as any).role && (player as any).role.toLowerCase().includes('keeper'));

            const snapshot: MatchPlayerSnapshot = {
                playerId: player.id,
                globalPlayerId: player.globalPlayerId,
                name: player.name,
                number: player.number,
                role: player.role,
                battingStyle: (player as any).battingStyle,
                bowlingStyle: (player as any).bowlingStyle,
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
