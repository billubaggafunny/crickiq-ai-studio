import { Team, Player } from '../types';

export interface PlayerCandidate {
    player: Player;
    team: Team;
}

export const findExistingPlayerCandidates = (inputName: string, teams: Team[], currentTeamId: string): PlayerCandidate[] => {
    if (!inputName || inputName.trim().length <= 2) {
        return [];
    }

    const normalizedInput = inputName.trim().toLowerCase().replace(/\s+/g, ' ');

    const candidates: PlayerCandidate[] = [];
    const seenGlobalIds = new Set<string>();

    for (const team of teams) {
        if (team.id === currentTeamId) {
            continue;
        }

        for (const player of team.players) {
            if (player.name.trim().toLowerCase().replace(/\s+/g, ' ') === normalizedInput) {
                if (player.globalPlayerId && !seenGlobalIds.has(player.globalPlayerId)) {
                    seenGlobalIds.add(player.globalPlayerId);
                    candidates.push({ player, team });
                }
            }
        }
    }

    // Sort active players first, then archived
    candidates.sort((a, b) => {
        const aArchived = ("isArchived" in a.player && (a.player as {isArchived?: boolean}).isArchived) ? 1 : 0;
        const bArchived = ("isArchived" in b.player && (b.player as {isArchived?: boolean}).isArchived) ? 1 : 0;
        return aArchived - bArchived;
    });

    return candidates;
};
