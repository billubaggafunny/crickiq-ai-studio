import { useCallback } from 'react';
import type React from 'react';
import type { Team, Tournament, Player } from '../types';
import { PlayerRole } from '../types';
import { generateEntityId, createTimestamp, createSyncMetadata } from '../utils/idGenerator';
import { generateDefaultRoles, LOGO_OPTIONS } from '../utils/initialData';

export const useTeamState = (
    teams: Team[],
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>,
    tournaments: Tournament[],
    setTournaments: React.Dispatch<React.SetStateAction<Tournament[]>>
) => {
    
    const addTeamToTournament = useCallback((name: string, tournamentId: string): { success: boolean, error?: string } => {
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
    
        const existingTeam = teams.find(t => t.name.trim().toLowerCase() === trimmedName.toLowerCase());
        let teamIdToAdd: string;
    
        if (existingTeam) {
            if (existingTeam.players.length !== tournament.numberOfPlayers) {
                return { success: false, error: `Cannot add team: ${existingTeam.name} has ${existingTeam.players.length} players, but tournament requires ${tournament.numberOfPlayers}.` };
            }
            teamIdToAdd = existingTeam.id;
        } else {
            const numPlayers = tournament.numberOfPlayers || 11;
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
            const newTeam: Team = { 
                id: newTeamId, 
                ownerId: tournament.ownerId,
                name: trimmedName, 
                logo, 
                players, 
                captainId: null, 
                viceCaptainId: null,
                createdAt: timestamp,
                updatedAt: timestamp,
                ...createSyncMetadata()
            };
            
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
        return { success: true };
    }, [tournaments, teams, setTeams, setTournaments]);

    const updateTeam = useCallback((updatedTeam: Team) => {
        setTeams(prev => prev.map(t => t.id === updatedTeam.id ? { ...updatedTeam, updatedAt: createTimestamp() } : t));
    }, [setTeams]);
    
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
                
                const maxPlayers = tournament.numberOfPlayers || 11;

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

    return {
        addTeamToTournament,
        updateTeam,
        addPlayer,
        deletePlayer,
        getTeamById
    };
};
