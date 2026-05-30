import { useCallback } from 'react';
import type React from 'react';
import type { Tournament, Match, ScheduleRound } from '../types';
import { generateEntityId, createTimestamp, createSyncMetadata } from '../utils/idGenerator';

export const useTournamentState = (
    tournaments: Tournament[], 
    setTournaments: React.Dispatch<React.SetStateAction<Tournament[]>>,
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>,
    createSnapshot: () => void
) => {
    
    const addTournament = useCallback((name: string, location: string, defaultOvers: number, numberOfPlayers: number, startDate: string, endDate: string, ownerId?: string): string => {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length > 50) {
            console.warn('[RuntimeValidation] Invalid tournament name rejected.');
            return '';
        }
        if (!Number.isInteger(defaultOvers) || defaultOvers <= 0 || defaultOvers > 100) {
            console.warn(`[RuntimeValidation] Invalid overs ${defaultOvers}.`);
            return '';
        }
        if (!Number.isInteger(numberOfPlayers) || numberOfPlayers < 2 || numberOfPlayers > 11) {
            console.warn(`[RuntimeValidation] Invalid players count ${numberOfPlayers}.`);
            return '';
        }

        const newId = `t_${generateEntityId()}`;
        const timestamp = createTimestamp();
        const newTournament: Tournament = { 
            id: newId, 
            ownerId,
            name: trimmedName, 
            location: location.trim(), 
            defaultOvers,
            numberOfPlayers,
            createdDate: timestamp,
            startDate,
            endDate,
            teamIds: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            ...createSyncMetadata()
        };
        setTournaments(prev => [...prev, newTournament]);
        createSnapshot();
        return newId;
    }, [setTournaments, createSnapshot]);

    const updateTournament = useCallback((tournamentId: string, updatedDetails: Partial<Omit<Tournament, 'id' | 'teamIds'>>) => {
        setTournaments(prev => prev.map(t => {
            if (t.id === tournamentId) {
                const updated = { ...t, ...updatedDetails, updatedAt: createTimestamp() };
                if (Object.prototype.hasOwnProperty.call(updatedDetails, 'groups') && updatedDetails.groups === undefined) {
                    delete updated.groups;
                }
                return updated;
            }
            return t;
        }));
    }, [setTournaments]);

    const deleteTournament = useCallback((tournamentId: string) => {
        createSnapshot();
        setTournaments(prev => prev.filter(t => t.id !== tournamentId));
        setMatches(prev => prev.filter(m => m.tournamentId !== tournamentId));
    }, [setTournaments, setMatches, createSnapshot]);

    const saveDraftSchedule = useCallback((tournamentId: string, schedule: ScheduleRound[]) => {
        setTournaments(prev => prev.map(t => t.id === tournamentId ? { ...t, draftSchedule: schedule } : t));
    }, [setTournaments]);

    const clearDraftSchedule = useCallback((tournamentId: string) => {
        setTournaments(prev => prev.map(t => {
            if (t.id === tournamentId) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { draftSchedule, ...rest } = t;
                return rest;
            }
            return t;
        }));
    }, [setTournaments]);

    const removeTeamFromTournament = useCallback((teamId: string, tournamentId: string) => {
        createSnapshot();
        setTournaments(prev => prev.map(t => {
            if (t.id === tournamentId) {
                return { ...t, teamIds: t.teamIds.filter(id => id !== teamId) };
            }
            return t;
        }));
        
        setMatches(prev => prev.filter(m => {
            if (m.tournamentId === tournamentId && (m.team1Id === teamId || m.team2Id === teamId)) {
                return false; 
            }
            return true;
        }));
    }, [setTournaments, setMatches, createSnapshot]);

    const getTournamentById = useCallback((tournamentId: string) => tournaments.find(t => t.id === tournamentId), [tournaments]);

    return {
        addTournament,
        updateTournament,
        deleteTournament,
        saveDraftSchedule,
        clearDraftSchedule,
        removeTeamFromTournament,
        getTournamentById
    };
};
