import { useCallback } from 'react';
import type React from 'react';
import type { Team, Tournament, Player, Match } from '../types';
import { PlayerRole } from '../types';

export interface DeleteEligibility {
    canDelete: boolean;
    matchesCount: number;
    tournamentsCount: number;
    playersCount: number;
    referencesCount: number;
    reasons: string[];
}

export const getTeamDeleteEligibility = (
    teamId: string,
    teams: Team[],
    matches: Match[],
    tournaments: Tournament[]
): DeleteEligibility => {
    const team = teams.find(t => t.id === teamId);
    if (!team) {
        return {
            canDelete: false,
            matchesCount: 0,
            tournamentsCount: 0,
            playersCount: 0,
            referencesCount: 0,
            reasons: ["Team not found"]
        };
    }

    const playersCount = team.players ? team.players.length : 0;

    // Check matches linked
    const linkedMatches = matches.filter(m => {
        return m.team1Id === teamId || 
               m.team2Id === teamId || 
               m.winnerId === teamId || 
               m.toss?.winner === teamId ||
               m.innings1?.battingTeamId === teamId ||
               m.innings1?.bowlingTeamId === teamId ||
               m.innings2?.battingTeamId === teamId ||
               m.innings2?.bowlingTeamId === teamId;
    });
    const matchesCount = linkedMatches.length;

    // Check tournaments linked
    let tournamentsCount = 0;
    tournaments.forEach(t => {
        let hasRef = false;
        if (t.teamIds && t.teamIds.includes(teamId)) {
            hasRef = true;
        } else if (t.draftSchedule) {
            for (const round of t.draftSchedule) {
                if (round.matches) {
                    for (const match of round.matches) {
                        if (match.team1Id === teamId || match.team2Id === teamId) {
                            hasRef = true;
                            break;
                        }
                    }
                }
                if (hasRef) break;
            }
        }
        if (hasRef) {
            tournamentsCount++;
        }
    });

    const reasons: string[] = [];
    if (matchesCount > 0) {
        reasons.push(`This team is linked to ${matchesCount} match${matchesCount > 1 ? 'es' : ''}.`);
    }
    if (tournamentsCount > 0) {
        reasons.push(`This team is registered in ${tournamentsCount} league${tournamentsCount > 1 ? 's' : ''}/tournament${tournamentsCount > 1 ? 's' : ''}.`);
    }
    if (playersCount > 0) {
        reasons.push(`This team has ${playersCount} player${playersCount > 1 ? 's' : ''}. Players will not be deleted. Remove or transfer players before deleting this team.`);
    }

    const referencesCount = matchesCount + tournamentsCount;
    const canDelete = matchesCount === 0 && tournamentsCount === 0 && playersCount === 0;

    return {
        canDelete,
        matchesCount,
        tournamentsCount,
        playersCount,
        referencesCount,
        reasons
    };
};
import { generateEntityId, createTimestamp, createSyncMetadata } from '../utils/idGenerator';
import { generateDefaultRoles, LOGO_OPTIONS } from '../utils/initialData';
import { getMaxPlayers } from '../utils/matchConfig';
import { normalizeTeam, detectDuplicateTeams } from '../utils/teamNormalization';

export const useTeamState = (
    teams: Team[],
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>,
    tournaments: Tournament[],
    setTournaments: React.Dispatch<React.SetStateAction<Tournament[]>>
) => {
    
    const addTeamToTournament = useCallback((name: string, tournamentId: string, existingTeamId?: string): { success: boolean, error?: string, warning?: string } => {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length > 50) {
            console.warn('[RuntimeValidation] Invalid team name rejected.');
            return { success: false, error: "Invalid team name" };
        }

        const tournament = tournaments.find(t => t.id === tournamentId);
        if (!tournament) {
            console.warn('[RuntimeValidation] Tournament not found');
            return { success: false, error: "Tournament not found" };
        }
    
        let existingTeam: Team | undefined;
        if (existingTeamId) {
            existingTeam = teams.find(t => t.id === existingTeamId);
        } else {
            const duplicates = detectDuplicateTeams(trimmedName, teams);
            existingTeam = duplicates.length > 0 ? duplicates[0] : undefined;
        }

        let teamIdToAdd: string;
        let warning: string | undefined;
    
        if (existingTeam) {
            const reqPlayers = getMaxPlayers(undefined, tournament);
            if (existingTeam.players.length !== reqPlayers) {
                // Do NOT block adding the team if it is an existing global/reused team or empty team.
                // We show a warning instead.
                teamIdToAdd = existingTeam.id;
                warning = `Team added, but roster needs ${reqPlayers} players for this tournament. Complete the squad before toss/start.`;
            } else {
                teamIdToAdd = existingTeam.id;
            }
        } else {
            const numPlayers = getMaxPlayers(undefined, tournament);
            const newTeamId = `team_${generateEntityId()}`;
            const defaultRoles = generateDefaultRoles(numPlayers);
            const players = Array.from({ length: numPlayers }, (_, i) => ({
                id: `p_${generateEntityId()}`,
                number: i + 1,
                name: `Player ${i + 1}`,
                role: defaultRoles[i] || PlayerRole.BATSMAN,
            }));
            const logo = LOGO_OPTIONS[teams.length % LOGO_OPTIONS.length];
            const timestamp = createTimestamp();
            const newTeam: Team = normalizeTeam({ 
                id: newTeamId, 
                ownerId: tournament.ownerId,
                name: trimmedName, 
                logo, 
                players, 
                captainId: null, 
                viceCaptainId: null,
                createdAt: timestamp,
                updatedAt: timestamp,
                scope: 'tournament',
                tournamentId: tournament.id,
                ...createSyncMetadata()
            });
            
            setTeams(prev => [...prev, newTeam]);
            teamIdToAdd = newTeam.id;
            console.log('[useTeamState] TEAM_CREATED:', newTeamId);
        }
    
        setTournaments(prev => prev.map(t => {
            if (t.id === tournamentId) {
                if (t.teamIds.includes(teamIdToAdd)) {
                    return t;
                }
                return { ...t, teamIds: [...t.teamIds, teamIdToAdd] };
            }
            return t;
        }));
        return { success: true, warning };
    }, [tournaments, teams, setTeams, setTournaments]);

    const createGlobalTeam = useCallback((input: {
        name: string;
        shortName?: string;
        teamType?: Team["teamType"];
        logoColor?: string;
        logoUrl?: string;
        homeGround?: string;
        city?: string;
        state?: string;
        country?: string;
    }): Team | null => {
        const trimmedName = input.name.trim();
        if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
            console.warn('[RuntimeValidation] Invalid team name');
            return null;
        }

        const newTeamId = `team_${generateEntityId()}`;
        const timestamp = createTimestamp();
        
        // Pick a default logo color from LOGO_OPTIONS if not provided
        const logo = input.logoColor || LOGO_OPTIONS[teams.length % LOGO_OPTIONS.length];
        
        const newTeam: Team = normalizeTeam({
            id: newTeamId,
            name: trimmedName,
            shortName: input.shortName ? input.shortName.trim() : undefined,
            teamType: input.teamType || 'custom',
            logoColor: input.logoColor || logo,
            logo: logo,
            logoUrl: input.logoUrl || '',
            homeGround: input.homeGround || '',
            city: input.city || '',
            state: input.state || '',
            country: input.country || '',
            scope: 'global',
            tournamentId: null,
            players: [],
            captainId: null,
            viceCaptainId: null,
            isArchived: false,
            archivedAt: null,
            createdAt: timestamp,
            updatedAt: timestamp,
            ...createSyncMetadata()
        });

        setTeams(prev => [...prev, newTeam]);
        console.log('[useTeamState] GLOBAL_TEAM_CREATED:', newTeamId);
        return newTeam;
    }, [teams, setTeams]);

    const updateTeam = useCallback((updatedTeam: Team) => {
        setTeams(prev => prev.map(t => t.id === updatedTeam.id ? { ...updatedTeam, updatedAt: createTimestamp() } : t));
    }, [setTeams]);

    const updateTeamProfile = useCallback((teamId: string, updates: {
        name: string;
        shortName?: string;
        teamType?: Team["teamType"];
        logoColor?: string;
        logoUrl?: string;
        homeGround?: string;
        city?: string;
        state?: string;
        country?: string;
    }): Team | null => {
        const t = teams.find(team => team.id === teamId);
        if (!t) return null;

        const allowedUpdates = {
            name: updates.name.trim(),
            shortName: updates.shortName ? updates.shortName.trim() : undefined,
            teamType: updates.teamType,
            logoColor: updates.logoColor,
            logoUrl: updates.logoUrl,
            homeGround: updates.homeGround ? updates.homeGround.trim() : undefined,
            city: updates.city ? updates.city.trim() : undefined,
            state: updates.state ? updates.state.trim() : undefined,
            country: updates.country ? updates.country.trim() : undefined,
        };

        const updatedTeamObj = normalizeTeam({
            ...t,
            ...allowedUpdates,
            id: t.id, // Explicit lock on internal fields
            ownerId: t.ownerId,
            scope: t.scope,
            tournamentId: t.tournamentId,
            players: t.players,
            captainId: t.captainId,
            viceCaptainId: t.viceCaptainId,
            isArchived: t.isArchived,
            archivedAt: t.archivedAt,
            createdAt: t.createdAt,
            updatedAt: createTimestamp(),
        });

        setTeams(prev => prev.map(item => item.id === teamId ? updatedTeamObj : item));
        console.log('[useTeamState] TEAM_PROFILE_UPDATED:', teamId, allowedUpdates);
        return updatedTeamObj;
    }, [teams, setTeams]);
    
    const addPlayer = useCallback((teamId: string, tournamentId: string, name: string, number: number, role: PlayerRole) => {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length > 50) {
            console.warn('[RuntimeValidation] Invalid player name rejected.');
            return;
        }

        setTeams(prevTeams => prevTeams.map(team => {
            if (team.id === teamId) {
                const tournament = tournaments.find(t => t.id === tournamentId);
                if (!tournament) return team;
                
                const maxPlayers = getMaxPlayers(undefined, tournament);

                if (team.players.length >= maxPlayers) {
                    console.warn(`[RuntimeValidation] Cannot add player: Team is full (${maxPlayers} players maximum).`);
                    return team;
                }
                
                if (team.players.some(p => p.number === number)) {
                    console.warn(`[RuntimeValidation] Cannot add player: Number ${number} is already taken.`);
                    return team;
                }
                
                if (team.players.some(p => p.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
                    console.warn(`[RuntimeValidation] Cannot add player: Name ${trimmedName} is already taken.`);
                    return team;
                }
                
                if (number <= 0 || number > 999) {
                    console.warn(`[RuntimeValidation] Cannot add player: Invalid number ${number}.`);
                    return team;
                }

                const newPlayer: Player = {
                    id: `p_${generateEntityId()}`,
                    number,
                    name: trimmedName,
                    role,
                };
                return {
                    ...team,
                    players: [...team.players, newPlayer],
                    updatedAt: createTimestamp()
                };
            }
            return team;
        }));
    }, [tournaments, setTeams]);
    
    const deletePlayer = useCallback((teamId: string, playerId: string) => {
        setTeams(prev => prev.map(t => {
            if (t.id === teamId) {
                const updatedTeam = { ...t, updatedAt: createTimestamp() };
                updatedTeam.players = updatedTeam.players.filter(p => p.id !== playerId);
                if (updatedTeam.captainId === playerId) {
                    updatedTeam.captainId = null;
                }
                if (updatedTeam.viceCaptainId === playerId) {
                    updatedTeam.viceCaptainId = null;
                }
                return updatedTeam;
            }
            return t;
        }));
    }, [setTeams]);

    const getTeamById = useCallback((teamId: string) => teams.find(t => t.id === teamId), [teams]);

    const archiveTeam = useCallback((teamId: string) => {
        const timestamp = createTimestamp();
        setTeams(prev => prev.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    isArchived: true,
                    archivedAt: timestamp,
                    updatedAt: timestamp
                };
            }
            return t;
        }));
        console.log('[useTeamState] TEAM_ARCHIVED:', teamId);
    }, [setTeams]);

    const restoreTeam = useCallback((teamId: string) => {
        const timestamp = createTimestamp();
        setTeams(prev => prev.map(t => {
            if (t.id === teamId) {
                return {
                    ...t,
                    isArchived: false,
                    archivedAt: null,
                    updatedAt: timestamp
                };
            }
            return t;
        }));
        console.log('[useTeamState] TEAM_RESTORED:', teamId);
    }, [setTeams]);

    const deleteTeamPermanently = useCallback((teamId: string, eligibility: DeleteEligibility) => {
        if (!eligibility || !eligibility.canDelete) {
            console.warn('[useTeamState] Deletion blocked: team is ineligible');
            return false;
        }
        setTeams(prev => prev.filter(t => t.id !== teamId));
        console.log('[useTeamState] TEAM_DELETED_PERMANENTLY:', teamId);
        return true;
    }, [setTeams]);

    return {
        addTeamToTournament,
        createGlobalTeam,
        updateTeam,
        updateTeamProfile,
        addPlayer,
        deletePlayer,
        getTeamById,
        archiveTeam,
        restoreTeam,
        deleteTeamPermanently
    };
};
