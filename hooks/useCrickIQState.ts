import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePersistence } from './usePersistence';
import { usePersistenceObserver } from './usePersistenceObserver';
import { useTeamState, getTeamDeleteEligibility } from './useTeamState';
import { useTournamentState as useTournamentStateDomain } from './useTournamentState';
import { useMatchState } from './useMatchState';
import { getHydrationGeneration, incrementHydrationGeneration } from '../utils/authLifecycleManager';
import type { Tournament, Team, Match } from '../types';

export const useCrickIQState = () => {
    // 1. Persistence Layer
    const {
        loadAppState,
        createSnapshot,
        restoreBackup
    } = usePersistence();

    // 2. Runtime State
    const [isHydrating, setIsHydrating] = useState(true);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);

    const reloadAppState = useCallback(async () => {
        setIsHydrating(true);
        const generationSnapshot = getHydrationGeneration();
        try {
            const data = await loadAppState();
            if (generationSnapshot !== getHydrationGeneration()) {
                console.warn('[App] Stale hydration aborted due to generation mismatch');
                return;
            }
            setTournaments(data.tournaments);
            setTeams(data.teams);
            setMatches(data.matches);
        } catch (err) {
            console.error('[App] Hydration error (reload):', err);
        } finally {
            if (generationSnapshot === getHydrationGeneration()) {
                setIsHydrating(false);
            }
        }
    }, [loadAppState]);

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            const generationSnapshot = getHydrationGeneration();
            try {
                const data = await loadAppState();
                if (mounted && generationSnapshot === getHydrationGeneration()) {
                    setTournaments(data.tournaments);
                    setTeams(data.teams);
                    setMatches(data.matches);
                    setIsHydrating(false);
                } else if (generationSnapshot !== getHydrationGeneration()) {
                     console.warn('[App] Stale init hydration aborted due to generation mismatch');
                }
            } catch (err) {
                 console.error('[App] Hydration error:', err);
                 if (mounted && generationSnapshot === getHydrationGeneration()) setIsHydrating(false);
            }
        };
        init();
        return () => { mounted = false; };
    }, [loadAppState]);

    // 3. Persistence Observer
    // Observe state changes and persist automatically without blocking UI
    const appState = useMemo(() => ({ tournaments, teams, matches }), [tournaments, teams, matches]);
    const { isSaving, lastSavedAt, saveError } = usePersistenceObserver(appState, isHydrating);

    // Filter out hydration state changes so they don't trigger saves
    // The observer runs its own timer, but we can instruct the save not to happen if hydrating.
    // Wait, since we start with empty arrays while isHydrating is true, the observer will save empty arrays!
    // We should NOT let observer track state while hydrating!
    // Since usePersistenceObserver checks the state on every render, we need to pass a flag or condition.
    
    // Wrap createSnapshot mapping
    const handleCreateSnapshot = useCallback((ownerId?: string) => {
        if (!isHydrating) createSnapshot(appState, ownerId);
    }, [createSnapshot, appState, isHydrating]);

    const restoreData = useCallback(async (newData: { tournaments: Tournament[]; teams: Team[]; matches: Match[] }) => {
        incrementHydrationGeneration(); // Invalidate any incoming hydrations
        const generationSnapshot = getHydrationGeneration();
        handleCreateSnapshot(); // Save current state before restoring
        await restoreBackup(newData); // Save the restored data
        
        if (generationSnapshot !== getHydrationGeneration()) {
            console.warn('[App] Stale restoreData aborted due to generation mismatch');
            return;
        }

        setTournaments(newData.tournaments);
        setTeams(newData.teams);
        setMatches(newData.matches);
    }, [handleCreateSnapshot, restoreBackup]);

    // Safe isolation helper: reset runtime arrays without triggering persistence observer deletion
    // Useful during logout to clear sensitive memory before auth re-runs hydration
    const resetRuntimeStateForAccountSwitch = useCallback(() => {
        incrementHydrationGeneration();
        setIsHydrating(true); // Masks the empty arrays from usePersistenceObserver
        setTournaments([]);
        setTeams([]);
        setMatches([]);
    }, []);

    const clearHydrationState = useCallback(() => {
        incrementHydrationGeneration();
        setIsHydrating(true);
    }, []);

    const detachPersistenceSafely = useCallback(() => {
        resetRuntimeStateForAccountSwitch();
    }, [resetRuntimeStateForAccountSwitch]);

    const prepareForAccountSwitch = useCallback(() => {
        resetRuntimeStateForAccountSwitch();
    }, [resetRuntimeStateForAccountSwitch]);

    // 4. Domain Hooks
    const teamDomain = useTeamState(teams, setTeams, tournaments, setTournaments);
    
    const tournamentDomain = useTournamentStateDomain(
        tournaments,
        setTournaments,
        setMatches,
        handleCreateSnapshot
    );

    const matchDomain = useMatchState(
        matches,
        setMatches,
        tournaments,
        setTournaments,
        teams,
        setTeams,
        handleCreateSnapshot
    );

    // 5. Compose Orchestrator API
    return {
        // State
        isHydrating,
        tournaments,
        teams,
        matches,

        // Team Domain
        addTeamToTournament: teamDomain.addTeamToTournament,
        createGlobalTeam: teamDomain.createGlobalTeam,
        updateTeam: teamDomain.updateTeam,
        updateTeamProfile: teamDomain.updateTeamProfile,
        addPlayer: teamDomain.addPlayer,
        deletePlayer: teamDomain.deletePlayer,
        getTeamById: teamDomain.getTeamById,
        archiveTeam: teamDomain.archiveTeam,
        restoreTeam: teamDomain.restoreTeam,
        deleteTeamPermanently: teamDomain.deleteTeamPermanently,
        getTeamDeleteEligibility,

        // Tournament Domain
        addTournament: tournamentDomain.addTournament,
        updateTournament: tournamentDomain.updateTournament,
        deleteTournament: tournamentDomain.deleteTournament,
        saveDraftSchedule: tournamentDomain.saveDraftSchedule,
        clearDraftSchedule: tournamentDomain.clearDraftSchedule,
        removeTeamFromTournament: tournamentDomain.removeTeamFromTournament,
        getTournamentById: tournamentDomain.getTournamentById,

        // Match Domain
        addMatch: matchDomain.addMatch,
        addMatchesBatch: matchDomain.addMatchesBatch,
        updateMatch: matchDomain.updateMatch,
        addPlayerReplacement: matchDomain.addPlayerReplacement,
        deleteMatch: matchDomain.deleteMatch,
        addQuickMatch: matchDomain.addQuickMatch,
        createRematch: matchDomain.createRematch,
        abandonMatch: matchDomain.abandonMatch,
        updateToss: matchDomain.updateToss,
        startMatch: matchDomain.startMatch,
        endMatch: matchDomain.endMatch,
        recordBall: matchDomain.recordBall,
        updateLivePlayers: matchDomain.updateLivePlayers,
        retireBatsman: matchDomain.retireBatsman,
        undoLastBall: matchDomain.undoLastBall,
        endInnings: matchDomain.endInnings,
        setManOfTheMatch: matchDomain.setManOfTheMatch,
        toggleFreeHit: matchDomain.toggleFreeHit,
        ensureTournamentMatchNumbers: matchDomain.ensureTournamentMatchNumbers,

        // Persistence Domain
        exportImport: {
            restoreData,
            createSnapshot: handleCreateSnapshot
        },
        
        // Persistence Status
        persistenceStatus: {
            isSaving,
            lastSavedAt,
            saveError
        },
        
        // Auth Isolation Preparedness
        authIsolation: {
            reloadAppState,
            resetRuntimeStateForAccountSwitch,
            clearHydrationState,
            prepareForAccountSwitch,
            detachPersistenceSafely
        }
    };
};

export type UseCrickIQStateReturn = ReturnType<typeof useCrickIQState>;
