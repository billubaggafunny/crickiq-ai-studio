import { Team, Player } from '../types';

export interface PlayerCandidate {
    player: Player;
    team: Team;
}

export interface PlayerDuplicateWarnings {
    hasBlockingDuplicate: boolean;
    hasArchivedBlockingDuplicate: boolean;
    sameTeamDuplicates: Player[];
    archivedSameTeamDuplicates: Player[];
    crossTeamCandidates: Array<{
        teamId: string;
        teamName: string;
        player: Player;
    }>;
    globalPlayerMatches: Array<{
        teamId: string;
        teamName: string;
        player: Player;
    }>;
    warnings: string[];
}

export const getPlayerDuplicateWarnings = ({
    player,
    currentTeam,
    allTeams,
    mode,
    editingPlayerId
}: {
    player: Partial<Player>;
    currentTeam: Team;
    allTeams: Team[];
    mode: 'add' | 'edit';
    editingPlayerId?: string;
}): PlayerDuplicateWarnings => {
    const inputName = player.name || '';
    const normalizedInput = inputName.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedNoSpaces = normalizedInput.replace(/\s/g, '');

    const result: PlayerDuplicateWarnings = {
        hasBlockingDuplicate: false,
        hasArchivedBlockingDuplicate: false,
        sameTeamDuplicates: [],
        archivedSameTeamDuplicates: [],
        crossTeamCandidates: [],
        globalPlayerMatches: [],
        warnings: []
    };

    if (normalizedInput.length < 2) {
        return result;
    }

    // Same team duplicates
    for (const p of currentTeam.players) {
        if (mode === 'edit' && p.id === editingPlayerId) continue;
        
        const pNormalized = p.name.trim().toLowerCase().replace(/\s+/g, ' ');
        const pNoSpaces = pNormalized.replace(/\s/g, '');

        if (pNormalized === normalizedInput) {
            if (p.isArchived) {
                result.archivedSameTeamDuplicates.push(p);
                result.hasArchivedBlockingDuplicate = true;
            } else {
                result.sameTeamDuplicates.push(p);
            }
            result.hasBlockingDuplicate = true;
        } else if (pNoSpaces === normalizedNoSpaces) {
            if (p.isArchived) {
                result.archivedSameTeamDuplicates.push(p);
            } else {
                result.sameTeamDuplicates.push(p);
            }
        } else {
            // Check for similar name (e.g. initial + last name, like "R. Sharma" and "Rohit Sharma")
            const parts1 = pNormalized.split(' ');
            const parts2 = normalizedInput.split(' ');
            
            if (parts1.length > 1 && parts2.length > 1) {
                const last1 = parts1[parts1.length - 1];
                const last2 = parts2[parts2.length - 1];
                
                if (last1 === last2) {
                    const first1 = parts1[0];
                    const first2 = parts2[0];
                    if (first1[0] === first2[0]) {
                        if (p.isArchived) {
                            result.archivedSameTeamDuplicates.push(p);
                        } else {
                            result.sameTeamDuplicates.push(p);
                        }
                    }
                }
            } else if (pNormalized.includes(normalizedInput) || normalizedInput.includes(pNormalized)) {
                 if (normalizedInput.length > 3 && pNormalized.length > 3) {
                     if (p.isArchived) {
                         result.archivedSameTeamDuplicates.push(p);
                     } else {
                         result.sameTeamDuplicates.push(p);
                     }
                 }
            }
        }
    }

    // Global Player Matches & Cross Team Candidates
    for (const team of allTeams) {
        if (team.id === currentTeam.id) continue;

        for (const p of team.players) {
            const pNormalized = p.name.trim().toLowerCase().replace(/\s+/g, ' ');
            
            if (pNormalized === normalizedInput) {
                result.crossTeamCandidates.push({
                    teamId: team.id,
                    teamName: team.name,
                    player: p
                });
            }

            if (player.globalPlayerId && p.globalPlayerId === player.globalPlayerId) {
                if (mode !== 'edit') {
                    result.globalPlayerMatches.push({
                        teamId: team.id,
                        teamName: team.name,
                        player: p
                    });
                }
            }
        }
    }

    if (result.hasBlockingDuplicate) {
        result.warnings.push('Player already exists in this team. Use the existing player or change the name.');
    } else if (result.sameTeamDuplicates.length > 0) {
        result.warnings.push('Similar player found in this team. Please check before saving.');
    }

    if (result.crossTeamCandidates.length > 0) {
        result.warnings.push('Similar player found in another team. You may want to link this player instead of creating a duplicate.');
    }

    if (result.globalPlayerMatches.length > 0) {
        result.warnings.push('This player appears linked to an existing global player profile.');
    }

    return result;
};

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
