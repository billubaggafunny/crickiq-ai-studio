import { useCallback } from 'react';
import type React from 'react';
import type { Tournament, Team, Match, Toss, Innings, Ball } from '../types';
import { PlayerRole, BattingStatus } from '../types';
import { generateEntityId, createTimestamp, createSyncMetadata } from '../utils/idGenerator';
import { calculateStats, rebuildInnings, determineWinner, calculatePointsTable } from '../utils/cricketLogic';
import { generateDefaultRoles, LOGO_OPTIONS } from '../utils/initialData';
import { getMaxPlayers } from '../utils/matchConfig';
import { normalizeTeam, makeTeamPairKey, matchBelongsToRivalry, makeLegacyNameRivalryKey, detectDuplicateTeams } from '../utils/teamNormalization';

export const getNextTournamentMatchNumber = (tournamentId: string, allMatches: Match[]): number => {
    if (!tournamentId || tournamentId === 't_quick_matches') return 1;
    const tournamentMatches = allMatches.filter(m => m.tournamentId === tournamentId && m.tournamentId !== 't_quick_matches');
    if (tournamentMatches.length === 0) return 1;
    let maxNum = 0;
    for (const m of tournamentMatches) {
        if (m.matchNumber !== undefined && m.matchNumber !== null && m.matchNumber > maxNum) {
            maxNum = m.matchNumber;
        }
    }
    return maxNum + 1;
};

export const getNextRivalryMatchNumber = (rivalryKey: string, allMatches: Match[], allTeams: Team[] = []): number => {
    if (!rivalryKey) return 1;
    // Support comparing via ID-based rivalryKey and legacy names
    const previousMatches = allMatches.filter(m => m.isQuickMatch && matchBelongsToRivalry(m, rivalryKey, allTeams));
    let maxNum = 0;
    for (const m of previousMatches) {
        if (m.rivalryMatchNumber !== undefined && m.rivalryMatchNumber !== null && m.rivalryMatchNumber > maxNum) {
            maxNum = m.rivalryMatchNumber;
        }
    }
    return maxNum + 1;
};

export const useMatchState = (
    matches: Match[],
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>,
    tournaments: Tournament[],
    setTournaments: React.Dispatch<React.SetStateAction<Tournament[]>>,
    teams: Team[],
    setTeams: React.Dispatch<React.SetStateAction<Team[]>>,
    createSnapshot: () => void
) => {

    const addMatch = useCallback((tournamentId: string, team1Id: string, team2Id: string, date: string, time: string, oversPerInnings: number, maxOversPerBowler?: number, ownerId?: string) => {
        if (!team1Id || !team2Id || team1Id === team2Id) {
            console.warn("[RuntimeValidation] Cannot add match: Invalid team relation.");
            return;
        }
        if (!Number.isInteger(oversPerInnings) || oversPerInnings <= 0 || oversPerInnings > 100) {
            console.warn(`[RuntimeValidation] Cannot add match: Invalid overs ${oversPerInnings}.`);
            return;
        }
        
        const t1 = teams.find(t => t.id === team1Id);
        const t2 = teams.find(t => t.id === team2Id);
        if (!t1 || !t2) {
            console.warn("[RuntimeValidation] Cannot add match: Teams not found.");
            return;
        }
        const timestamp = createTimestamp();
        setMatches(prev => {
            const nextMatchNumber = getNextTournamentMatchNumber(tournamentId, prev);
            const newMatch: Match = { 
                id: `m_${generateEntityId()}`, 
                ownerId,
                matchId: generateEntityId(),
                tournamentId, 
                team1Id, 
                team2Id, 
                date, 
                time, 
                status: 'scheduled', 
                oversPerInnings,
                maxOversPerBowler,
                createdAt: timestamp,
                updatedAt: timestamp,
                matchNumber: nextMatchNumber,
                ...createSyncMetadata()
            };
            return [...prev, newMatch];
        });
    }, [teams, setMatches]);

    const addMatchesBatch = useCallback((matchesToAdd: Omit<Match, 'id' | 'status'>[], ownerId?: string) => {
        const timestamp = createTimestamp();
        setMatches(prev => {
            const tempMatches = [...prev];
            const newMatches: Match[] = matchesToAdd.map((m) => {
                const tournamentId = m.tournamentId;
                const nextMatchNumber = getNextTournamentMatchNumber(tournamentId, tempMatches);
                const newMatchObj: Match = {
                    ...m,
                    id: `m_${generateEntityId()}`,
                    ownerId,
                    matchId: generateEntityId(),
                    status: 'scheduled',
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    matchNumber: nextMatchNumber,
                    ...createSyncMetadata()
                };
                tempMatches.push(newMatchObj);
                return newMatchObj;
            });
            return [...prev, ...newMatches];
        });
    }, [setMatches]);
    
    const updateMatch = useCallback((matchId: string, updatedDetails: Partial<Match>) => {
        if (updatedDetails.team1Id && updatedDetails.team2Id && updatedDetails.team1Id === updatedDetails.team2Id) {
            console.warn("[RuntimeValidation] Cannot update match: Teams cannot be the same.");
            return;
        }
        if (updatedDetails.oversPerInnings !== undefined && (!Number.isInteger(updatedDetails.oversPerInnings) || updatedDetails.oversPerInnings <= 0 || updatedDetails.oversPerInnings > 100)) {
            console.warn(`[RuntimeValidation] Cannot update match: Invalid overs ${updatedDetails.oversPerInnings}.`);
            return;
        }
        
        if (updatedDetails.team1Id || updatedDetails.team2Id) {
            setMatches(prev => {
                const existing = prev.find(m => m.id === matchId);
                const t1Id = updatedDetails.team1Id || existing?.team1Id;
                const t2Id = updatedDetails.team2Id || existing?.team2Id;
                const t1 = teams.find(t => t.id === t1Id);
                const t2 = teams.find(t => t.id === t2Id);
                if (!t1 || !t2) {
                    console.warn("[RuntimeValidation] Cannot update match: Teams not found.");
                    return prev;
                }
                return prev.map(m => (m.id === matchId ? { ...m, ...updatedDetails, updatedAt: createTimestamp() } : m));
            });
            return;
        }
        
        setMatches(prev => prev.map(m => (m.id === matchId ? { ...m, ...updatedDetails, updatedAt: createTimestamp() } : m)));
        console.log('[useMatchState] MATCH_UPDATED:', matchId);
    }, [teams, setMatches]);

    const addPlayerReplacement = useCallback((matchId: string, teamId: string, outgoingPlayerId: string, incomingPlayerId: string, reason?: string) => {
        setMatches(prev => prev.map(m => {
            if (m.id !== matchId) return m;
            const rep = { teamId, outgoingPlayerId, incomingPlayerId, reason, replacedAt: new Date().toISOString() };
            return { ...m, replacements: [...(m.replacements || []), rep], updatedAt: createTimestamp() };
        }));
    }, [setMatches]);

    const deleteMatch = useCallback((matchId: string) => {
        setMatches(prev => prev.filter(m => m.id !== matchId));
    }, [setMatches]);

    const addQuickMatch = useCallback((team1Data: string | Team, team2Data: string | Team, oversPerInnings: number, numberOfPlayers: number, maxOversPerBowler?: number, ownerId?: string, isDraft: boolean = false) => {
        const QUICK_MATCH_TOURNAMENT_ID = 't_quick_matches';
        const QUICK_MATCH_TOURNAMENT_NAME = 'Quick Matches';

        setTournaments(prev => {
            if (prev.some(t => t.id === QUICK_MATCH_TOURNAMENT_ID)) {
                return prev;
            }
            const timestamp = createTimestamp();
            const quickMatchTournament: Tournament = {
                id: QUICK_MATCH_TOURNAMENT_ID,
                ownerId,
                name: QUICK_MATCH_TOURNAMENT_NAME,
                location: 'Local',
                createdDate: timestamp,
                teamIds: [],
                createdAt: timestamp,
                updatedAt: timestamp,
                ...createSyncMetadata()
            };
            return [...prev, quickMatchTournament];
        });
        
        const newTeamsToCreate: Team[] = [];

        const findOrCreateTeam = (data: string | Team): Team => {
            const allKnownTeams = [...teams, ...newTeamsToCreate];

            if (typeof data === 'string') {
                const teamName = data.trim();
                
                // TODO: For Phase 2, instead of auto-matching by case-insensitive name,
                // show duplicate confirmation modal: "Team already exists. Use Existing or Create New Anyway."
                // For Phase 1.2, we add duplicate detection but temporarily preserve existing auto-reuse behavior to avoid breaking current UI.
                const duplicates = detectDuplicateTeams(teamName, allKnownTeams);
                const existingTeam = duplicates.length > 0 ? duplicates[0] : undefined;
                
                if (existingTeam) {
                    return existingTeam;
                }

                const newId = `team_${generateEntityId()}`;
                const defaultRoles = generateDefaultRoles(numberOfPlayers);
                const players = Array.from({ length: numberOfPlayers }, (_, i) => {
                    const entityId = generateEntityId();
                    return {
                        id: `p_${entityId}`,
                        globalPlayerId: `gp_${entityId}`,
                        number: i + 1,
                        name: `Player ${i + 1}`,
                        role: defaultRoles[i] || PlayerRole.BATSMAN,
                    };
                });
                const timestamp = createTimestamp();
                const newTeam: Team = normalizeTeam({
                    id: newId,
                    ownerId,
                    name: teamName,
                    logo: LOGO_OPTIONS[allKnownTeams.length % LOGO_OPTIONS.length],
                    players,
                    captainId: null,
                    viceCaptainId: null,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    scope: 'quick',
                    tournamentId: QUICK_MATCH_TOURNAMENT_ID,
                    ...createSyncMetadata()
                });
                newTeamsToCreate.push(newTeam);
                return newTeam;
            } else {
                return data;
            }
        };

        const finalTeam1 = findOrCreateTeam(team1Data);
        const finalTeam2 = findOrCreateTeam(team2Data);

        if (newTeamsToCreate.length > 0) {
            setTeams(prev => [...prev, ...newTeamsToCreate]);
        }
        
        setTournaments(prev => prev.map(t => {
            if (t.id === QUICK_MATCH_TOURNAMENT_ID) {
                const newTeamIds = new Set([...t.teamIds, finalTeam1.id, finalTeam2.id]);
                return { ...t, teamIds: Array.from(newTeamIds) };
            }
            return t;
        }));

        const isTeam1New = newTeamsToCreate.some(t => t.id === finalTeam1.id);
        const isTeam2New = newTeamsToCreate.some(t => t.id === finalTeam2.id);

        const newMatchId = `m_${generateEntityId()}`;
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const timestamp = createTimestamp();
        const rKey = makeTeamPairKey(finalTeam1.id, finalTeam2.id);

        setMatches(prev => {
            const rMatchNumber = getNextRivalryMatchNumber(rKey, prev, [...teams, ...newTeamsToCreate]);
            const newMatch: Match = {
                id: newMatchId,
                ownerId,
                matchId: generateEntityId(),
                tournamentId: QUICK_MATCH_TOURNAMENT_ID,
                team1Id: finalTeam1.id,
                team2Id: finalTeam2.id,
                date: now.toISOString().split('T')[0],
                time: time,
                status: 'scheduled',
                isDraft,
                oversPerInnings,
                isQuickMatch: true,
                numberOfPlayers,
                team1SquadIds: isTeam1New ? finalTeam1.players.map(p => p.id) : undefined,
                team2SquadIds: isTeam2New ? finalTeam2.players.map(p => p.id) : undefined,
                maxOversPerBowler,
                createdAt: timestamp,
                updatedAt: timestamp,
                rivalryKey: rKey,
                rivalryMatchNumber: rMatchNumber,
                ...createSyncMetadata()
            };
            return [...prev, newMatch];
        });
        
        return { matchId: newMatchId, team1Id: finalTeam1.id, team2Id: finalTeam2.id };
    }, [teams, setTournaments, setTeams, setMatches]);

    const createRematch = useCallback((originalMatchId: string, ownerId?: string): Match | null => {
        const originalMatch = matches.find(m => m.id === originalMatchId);
    
        if (!originalMatch || !originalMatch.isQuickMatch) {
            console.error("Cannot create rematch for this match.");
            return null;
        }
    
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const timestamp = createTimestamp();
        
        const t1 = teams.find(t => t.id === originalMatch.team1Id);
        const t2 = teams.find(t => t.id === originalMatch.team2Id);
        const rKey = (originalMatch.team1Id && originalMatch.team2Id)
            ? makeTeamPairKey(originalMatch.team1Id, originalMatch.team2Id)
            : (originalMatch.rivalryKey || (t1 && t2 ? makeLegacyNameRivalryKey(t1.name, t2.name) : ''));
        const rMatchNumber = getNextRivalryMatchNumber(rKey, matches, teams);
    
        const newMatch: Match = {
            id: `m_${generateEntityId()}`,
            ownerId: ownerId || originalMatch.ownerId,
            matchId: generateEntityId(),
            tournamentId: originalMatch.tournamentId,
            team1Id: originalMatch.team1Id,
            team2Id: originalMatch.team2Id,
            date: now.toISOString().split('T')[0],
            time: time,
            oversPerInnings: originalMatch.oversPerInnings,
            maxOversPerBowler: originalMatch.maxOversPerBowler,
            status: 'scheduled',
            isQuickMatch: true,
            numberOfPlayers: originalMatch.numberOfPlayers,
            team1SquadIds: originalMatch.team1SquadIds ? [...originalMatch.team1SquadIds] : undefined,
            team2SquadIds: originalMatch.team2SquadIds ? [...originalMatch.team2SquadIds] : undefined,
            createdAt: timestamp,
            updatedAt: timestamp,
            rivalryKey: rKey,
            rivalryMatchNumber: rMatchNumber,
            ...createSyncMetadata()
        };
    
        setMatches(prev => [...prev, newMatch]);
        return newMatch;
    }, [matches, teams, setMatches]);
    
    const abandonMatch = useCallback((matchId: string) => {
        setMatches(prev => prev.map(m => 
            m.id === matchId ? { ...m, status: 'completed', wasAbandoned: true, updatedAt: createTimestamp() } : m
        ));
    }, [setMatches]);

    const updateToss = useCallback((matchId: string, toss: Toss) => {
        setMatches(prev => prev.map(m => {
            if (m.id === matchId) {
                return { ...m, toss, updatedAt: createTimestamp() };
            }
            return m;
        }));
    }, [setMatches]);

    const startMatch = useCallback((matchId: string) => {
         setMatches(prev => prev.map(m => {
            if (m.id === matchId && m.toss) {
                if (m.status !== 'scheduled') {
                    console.warn('[RuntimeValidation] Cannot start match: Status is not scheduled.');
                    return m;
                }
                const battingTeamId = m.toss.decision === 'bat' ? m.toss.winner : (m.toss.winner === m.team1Id ? m.team2Id : m.team1Id);
                const bowlingTeamId = battingTeamId === m.team1Id ? m.team2Id : m.team1Id;
                
                const innings1: Innings = {
                    battingTeamId,
                    bowlingTeamId,
                    score: 0,
                    wickets: 0,
                    overs: 0,
                    balls: [],
                    batsmanScores: {},
                    bowlerScores: {},
                    currentBatsmen: [ '', null ],
                    currentBowler: null,
                    lastBowlerId: null,
                    manualOverrides: [],
                };

                return { ...m, status: 'live' as const, isDraft: false, innings1, updatedAt: createTimestamp() };
            }
            return m;
        }));
    }, [setMatches]);
    
    const endMatch = useCallback((matchId: string) => {
        const matchToEnd = matches.find(m => m.id === matchId);
        if (!matchToEnd || matchToEnd.status === 'completed') {
            if (matchToEnd?.status === 'completed') {
                console.warn('[RuntimeValidation] Match already completed. Ignoring endMatch.');
            }
            return;
        }

        let winnerId: Match['winnerId'] = 'draw';
        if (matchToEnd.winnerId) {
            winnerId = matchToEnd.winnerId;
        } else if (matchToEnd.innings1 && matchToEnd.innings2) {
            winnerId = determineWinner(matchToEnd.innings1, matchToEnd.innings2);
        }
        
        let updatedMatches = matches.map(m => m.id === matchId ? { ...m, status: 'completed' as const, winnerId: winnerId, updatedAt: createTimestamp() } : m);
        const finishedMatch = updatedMatches.find(m => m.id === matchId)!;

        const tournament = tournaments.find(t => t.id === finishedMatch.tournamentId);
        if (!tournament || finishedMatch.isQuickMatch) {
            setMatches(updatedMatches);
            createSnapshot();
            return;
        }

        const tournamentMatches = updatedMatches.filter(m => m.tournamentId === tournament.id);
        const newKnockoutMatches: Match[] = [];
        let nextStage: Tournament['stage'] | undefined = undefined;

        const getNextKnockoutDate = (lastMatchDateStr: string | undefined): string => {
            const baseDateStr = lastMatchDateStr || tournament.endDate || new Date().toISOString().split('T')[0];
            const date = new Date(baseDateStr.replace(/-/g, '/'));
            date.setDate(date.getDate() + 2);
            return date.toISOString().split('T')[0];
        };

        const lastMatchDate = tournamentMatches
            .filter(m => m.status === 'completed' && !m.knockoutType)
            .reduce((latest, match) => (match.date > latest ? match.date : latest), '1970-01-01');

        if (tournament.format === 'Round Robin + Knockout') {
            const currentStage = tournament.stage || 'group';
            if (currentStage === 'group') {
                const groupMatches = tournamentMatches.filter(m => !m.knockoutType);
                const allGroupMatchesFinished = groupMatches.length > 0 && groupMatches.every(m => m.status === 'completed');

                if (allGroupMatchesFinished) {
                    if (tournament.groups) { 
                        const groupAMatches = groupMatches.filter(m => m.groupId === 'a');
                        const groupBMatches = groupMatches.filter(m => m.groupId === 'b');
                        const groupATeams = teams.filter(t => tournament.groups!.a.includes(t.id));
                        const groupBTeams = teams.filter(t => tournament.groups!.b.includes(t.id));
                        
                        const tableA = calculatePointsTable(groupATeams, groupAMatches);
                        const tableB = calculatePointsTable(groupBTeams, groupBMatches);

                        if (tableA.length >= 2 && tableB.length >= 2) {
                            const [a1, a2] = tableA;
                            const [b1, b2] = tableB;
                            newKnockoutMatches.push({ id: `m_semi1_${tournament.id}`, tournamentId: tournament.id, team1Id: a1.teamId, team2Id: b2.teamId, date: getNextKnockoutDate(lastMatchDate), oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'semifinal' });
                            newKnockoutMatches.push({ id: `m_semi2_${tournament.id}`, tournamentId: tournament.id, team1Id: b1.teamId, team2Id: a2.teamId, date: getNextKnockoutDate(lastMatchDate), oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'semifinal' });
                            nextStage = 'semifinals';
                        }
                    } else { 
                        const tournamentTeams = teams.filter(t => tournament.teamIds.includes(t.id));
                        const pointsTable = calculatePointsTable(tournamentTeams, groupMatches);
                        if (pointsTable.length >= 4) {
                            const [p1, p2, p3, p4] = pointsTable;
                            newKnockoutMatches.push({ id: `m_semi1_${tournament.id}`, tournamentId: tournament.id, team1Id: p1.teamId, team2Id: p4.teamId, date: getNextKnockoutDate(lastMatchDate), oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'semifinal' });
                            newKnockoutMatches.push({ id: `m_semi2_${tournament.id}`, tournamentId: tournament.id, team1Id: p2.teamId, team2Id: p3.teamId, date: getNextKnockoutDate(lastMatchDate), oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'semifinal' });
                            nextStage = 'semifinals';
                        }
                    }
                }
            }
        }

        if (tournament.format === 'Round Robin') {
            const currentStage = tournament.stage || 'group';
            if (currentStage === 'group') {
                const groupStageMatches = tournamentMatches.filter(m => !m.knockoutType);
                if (groupStageMatches.length > 0 && groupStageMatches.every(m => m.status === 'completed')) {
                    const tournamentTeams = teams.filter(t => tournament.teamIds.includes(t.id));
                    const pointsTable = calculatePointsTable(tournamentTeams, groupStageMatches);
                    if (pointsTable.length >= 2) {
                        const [p1, p2] = pointsTable;
                        newKnockoutMatches.push({ id: `m_final_${tournament.id}`, tournamentId: tournament.id, team1Id: p1.teamId, team2Id: p2.teamId, date: getNextKnockoutDate(lastMatchDate), oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'final' });
                        nextStage = 'final';
                    }
                }
            }
        } 
        
        if ((tournament.stage === 'semifinals' || (tournament.format === 'Round Robin + Knockout' && nextStage === 'semifinals')) && finishedMatch.knockoutType === 'semifinal') {
            const semifinals = tournamentMatches.filter(m => m.knockoutType === 'semifinal');
            if (semifinals.every(m => m.status === 'completed')) {
                const winners = semifinals.map(m => m.winnerId).filter((id): id is string => !!id && id !== 'draw');
                if (winners.length === 2) {
                    const lastSemiDate = semifinals.reduce((latest, match) => (match.date > latest ? match.date : latest), '1970-01-01');
                    newKnockoutMatches.push({ id: `m_final_${tournament.id}`, tournamentId: tournament.id, team1Id: winners[0], team2Id: winners[1], date: getNextKnockoutDate(lastSemiDate), oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'final' });
                    nextStage = 'final';
                }
            }
        }

        if (tournament.format === 'Knockout') {
            const finishedKnockoutType = finishedMatch.knockoutType;
            const currentRoundMatches = tournamentMatches.filter(m => m.knockoutType === finishedKnockoutType);

            if (currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status === 'completed')) {
                const winners = currentRoundMatches.map(m => m.winnerId).filter((id): id is string => !!id && id !== 'draw');
                
                const nextStageType = finishedKnockoutType === 'semifinal' ? 'final' : (winners.length === 2 ? 'final' : (winners.length === 4 ? 'semifinals' : undefined));
                const nextStageAlreadyExists = nextStageType ? tournamentMatches.some(m => m.knockoutType === nextStageType) : false;

                if (winners.length >= 2 && !nextStageAlreadyExists) {
                    const lastRoundMatchDate = currentRoundMatches.reduce((latest, match) => (match.date > latest ? match.date : latest), '1970-01-01');
                    const nextMatchDate = getNextKnockoutDate(lastRoundMatchDate);

                    if (winners.length === 2) { 
                        newKnockoutMatches.push({ id: `m_final_${tournament.id}`, tournamentId: tournament.id, team1Id: winners[0], team2Id: winners[1], date: nextMatchDate, oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'final' });
                        nextStage = 'final';
                    } else if (winners.length === 4) { 
                        newKnockoutMatches.push({ id: `m_semi1_${tournament.id}`, tournamentId: tournament.id, team1Id: winners[0], team2Id: winners[1], date: nextMatchDate, oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'semifinal' });
                        newKnockoutMatches.push({ id: `m_semi2_${tournament.id}`, tournamentId: tournament.id, team1Id: winners[2], team2Id: winners[3], date: nextMatchDate, oversPerInnings: tournament.defaultOvers || 20, status: 'scheduled' as const, knockoutType: 'semifinal' });
                        nextStage = 'semifinals';
                    }
                }
            }
        }
        
        if (newKnockoutMatches.length > 0) {
            const tempMatches = [...updatedMatches];
            const knockoutMatchesWithNumber = newKnockoutMatches.map((m) => {
                const nextMatchNumber = getNextTournamentMatchNumber(tournament.id, tempMatches);
                const completeMatchObj = { ...m, matchNumber: nextMatchNumber };
                tempMatches.push(completeMatchObj);
                return completeMatchObj;
            });
            updatedMatches = [...updatedMatches, ...knockoutMatchesWithNumber];
        }
        
        setMatches(updatedMatches);

        if (nextStage) {
            setTournaments(prev => prev.map(t => t.id === tournament.id ? { ...t, stage: nextStage } : t));
        }

        createSnapshot();
    }, [matches, tournaments, teams, createSnapshot, setMatches, setTournaments]);

    const recordBall = useCallback((matchId: string, ball: Omit<Ball, 'ballNumber' | 'overNumber'>) => {
        setMatches(prev => prev.map(m => {
            if (m.id !== matchId || m.status !== 'live') return m;

            const currentInningsKey = m.innings2 ? 'innings2' : 'innings1';
            const currentInnings = m[currentInningsKey];
            if (!currentInnings) return m;

            const ballWithMetadata = {
                ...ball,
                ballId: generateEntityId(),
                timestamp: createTimestamp(),
                ...createSyncMetadata()
            };

            const { updatedInnings } = calculateStats(currentInnings, ballWithMetadata);
            console.log('[useMatchState] BALL_RECORDED:', ballWithMetadata.ballId, 'Match:', matchId);
            
            if (currentInningsKey === 'innings2' && m.innings1 && updatedInnings.score > m.innings1.score) {
                return {
                    ...m,
                    innings2: updatedInnings,
                    status: 'completed',
                    winnerId: updatedInnings.battingTeamId,
                    updatedAt: createTimestamp()
                };
            }

            const battingTeam = teams.find(t => t.id === updatedInnings.battingTeamId);
            const parentTournament = m.tournamentId ? tournaments.find(t => t.id === m.tournamentId) : undefined;
            const maxPlayers = getMaxPlayers(m, parentTournament);
            const totalPlayers = battingTeam?.players?.length > 0 ? battingTeam.players.length : maxPlayers;
            const isAllOut = updatedInnings.wickets >= totalPlayers - 1;
            const isOversFinished = updatedInnings.overs >= m.oversPerInnings;

            if (isAllOut || isOversFinished) {
                 if (currentInningsKey === 'innings1') {
                     const newInnings2: Innings = {
                        battingTeamId: updatedInnings.bowlingTeamId,
                        bowlingTeamId: updatedInnings.battingTeamId,
                        score: 0,
                        wickets: 0,
                        overs: 0,
                        balls: [],
                        batsmanScores: {},
                        bowlerScores: {},
                        currentBatsmen: ['', null],
                        currentBowler: null,
                        lastBowlerId: null,
                        manualOverrides: [],
                     };
                     return { ...m, innings1: updatedInnings, innings2: newInnings2, updatedAt: createTimestamp() };
                 } else if (currentInningsKey === 'innings2' && m.innings1) {
                    const winnerId = determineWinner(m.innings1, updatedInnings);
                    return { ...m, innings2: updatedInnings, status: 'completed', winnerId, updatedAt: createTimestamp() };
                 }
            }
            
            return { ...m, [currentInningsKey]: updatedInnings, updatedAt: createTimestamp() };
        }));
    }, [teams, setMatches, tournaments]);
    
    const updateLivePlayers = useCallback((matchId: string, onStrikeId: string, nonStrikerId: string | null, bowlerId: string | null) => {
        if (onStrikeId && nonStrikerId && onStrikeId === nonStrikerId) {
            console.warn('[RuntimeValidation] Striker and non-striker cannot be the same player.');
            return;
        }

        setMatches(prev => prev.map(m => {
            if (m.id !== matchId || m.status !== 'live') return m;

            const currentInningsKey = m.innings2 ? 'innings2' : 'innings1';
            const currentInnings = m[currentInningsKey];

            if (!currentInnings) return m;

            const updatedInnings: Innings = {
                ...currentInnings,
                manualOverrides: [...(currentInnings.manualOverrides || [])]
            };
            
            const updatedBatsmanScores = { ...updatedInnings.batsmanScores };
            const selectedBatsmenIds = [onStrikeId, nonStrikerId].filter(Boolean) as string[];

            selectedBatsmenIds.forEach(id => {
                if (!updatedBatsmanScores[id]) {
                    updatedBatsmanScores[id] = {
                        playerId: id, runs: 0, balls: 0, fours: 0, sixes: 0, status: BattingStatus.NOT_OUT,
                    };
                } else if (updatedBatsmanScores[id]?.status === BattingStatus.RETIRED_HURT) {
                    updatedBatsmanScores[id] = { ...updatedBatsmanScores[id], status: BattingStatus.NOT_OUT };
                }
            });

            updatedInnings.batsmanScores = updatedBatsmanScores;

            const ballIndex = updatedInnings.balls.length;
            const newOverride = {
                ballIndex,
                batsmen: [onStrikeId, nonStrikerId] as [string, string | null],
                bowler: bowlerId
            };
            const existingOverrideIndex = updatedInnings.manualOverrides!.findIndex(o => o.ballIndex === ballIndex);

            if (existingOverrideIndex > -1) {
                updatedInnings.manualOverrides![existingOverrideIndex] = newOverride;
            } else {
                updatedInnings.manualOverrides!.push(newOverride);
            }
            
            updatedInnings.currentBatsmen = newOverride.batsmen;
            updatedInnings.currentBowler = newOverride.bowler;
            
            if (bowlerId && m.maxOversPerBowler) {
                const bowlerStats = updatedInnings.bowlerScores[bowlerId];
                if (bowlerStats && Math.floor(bowlerStats.overs) >= m.maxOversPerBowler) {
                    if (!updatedInnings.exceptions) updatedInnings.exceptions = [];
                    // Check if we already logged this exception for this bowler to prevent spam
                    const alreadyHasException = updatedInnings.exceptions.some(e => 
                        (typeof e === 'object' && e.type === 'BOWLER_LIMIT_EXCEPTION' && e.bowlerId === bowlerId) ||
                        (typeof e === 'string' && e.includes(`Bowler ${bowlerId}`))
                    );
                    
                    if (!alreadyHasException) {
                        updatedInnings.exceptions.push({
                            type: 'BOWLER_LIMIT_EXCEPTION',
                            bowlerId,
                            limit: m.maxOversPerBowler,
                            timestamp: Date.now()
                        });
                    }
                }
            }

            if ((!currentInnings.initialBatsmen || !currentInnings.initialBatsmen[0]) && onStrikeId) {
                updatedInnings.initialBatsmen = [onStrikeId, nonStrikerId] as [string, string | null];
            }
            if (!currentInnings.initialBowler && bowlerId) {
                updatedInnings.initialBowler = bowlerId;
            }

            return { ...m, [currentInningsKey]: updatedInnings, updatedAt: createTimestamp() };
        }));
    }, [setMatches]);

    const retireBatsman = useCallback((matchId: string, playerId: string) => {
        setMatches(prev => prev.map(m => {
            if (m.id !== matchId || m.status !== 'live') return m;

            const currentInningsKey = m.innings2 ? 'innings2' : 'innings1';
            const currentInnings = m[currentInningsKey];
            if (!currentInnings) return m;

            const existingScore = currentInnings.batsmanScores[playerId] || {
                playerId: playerId,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                status: BattingStatus.NOT_OUT,
            };

            const updatedBatsmanScores = {
                ...currentInnings.batsmanScores,
                [playerId]: { ...existingScore, status: BattingStatus.RETIRED_HURT }
            };

            const updatedCurrentBatsmen = [...currentInnings.currentBatsmen];
            if (updatedCurrentBatsmen[0] === playerId) {
                updatedCurrentBatsmen[0] = '';
            } else if (updatedCurrentBatsmen[1] === playerId) {
                updatedCurrentBatsmen[1] = null;
            }

            const updatedInnings = {
                ...currentInnings,
                batsmanScores: updatedBatsmanScores,
                currentBatsmen: updatedCurrentBatsmen as [string, string | null]
            };
            
            return { ...m, [currentInningsKey]: updatedInnings, updatedAt: createTimestamp() };
        }));
    }, [setMatches]);

    const undoLastBall = useCallback((matchId: string) => {
        const matchToUndo = matches.find(m => m.id === matchId);
        if (!matchToUndo) return;
    
        const originalStatus = matchToUndo.status;
    
        let revertedMatch: Match;
        {
            const tempMatch = JSON.parse(JSON.stringify(matchToUndo));
            let ballWasUndone = false;
            
            const isSecondInnings = tempMatch.innings2 && tempMatch.innings2.balls.length > 0;
            const isFirstInnings = tempMatch.innings1 && tempMatch.innings1.balls.length > 0;
    
            if (isSecondInnings) {
                const updatedBalls = tempMatch.innings2.balls.slice(0, -1);
                tempMatch.innings2 = rebuildInnings(tempMatch.innings2, updatedBalls);
                ballWasUndone = true;
            } else if (isFirstInnings) {
                if (tempMatch.innings2) delete tempMatch.innings2;
                const updatedBalls = tempMatch.innings1.balls.slice(0, -1);
                tempMatch.innings1 = rebuildInnings(tempMatch.innings1, updatedBalls);
                ballWasUndone = true;
            } else {
                return;
            }
            
            if (ballWasUndone && tempMatch.status === 'completed') {
                tempMatch.status = 'live';
                delete tempMatch.winnerId;
                delete tempMatch.manOfTheMatchId;
            }
            tempMatch.updatedAt = createTimestamp();
            revertedMatch = tempMatch;
        }
        
        const statusChangedFromCompleted = originalStatus === 'completed' && revertedMatch.status === 'live';
        
        if (statusChangedFromCompleted) {
            const tournament = tournaments.find(t => t.id === revertedMatch.tournamentId);
            
            if (tournament && tournament.id !== 't_quick_matches' && tournament.format) {
                let progressionReverted = false;
                let tournamentUpdate: Partial<Tournament> | null = null;
                let finalMatches = matches;
                
                const hasScheduledKnockouts = matches.some(m => m.tournamentId === tournament.id && m.status === 'scheduled' && m.knockoutType);
    
                if (hasScheduledKnockouts) {
                    if ((tournament.format === 'Round Robin' || tournament.format === 'Round Robin + Knockout') && (tournament.stage === 'final' || tournament.stage === 'semifinals')) {
                         finalMatches = matches.filter(m => !(m.tournamentId === tournament.id && m.knockoutType && m.status === 'scheduled'));
                         tournamentUpdate = { stage: 'group' };
                         progressionReverted = true;
                    } else if (tournament.format === 'Knockout') {
                        if (!revertedMatch.knockoutType && (tournament.stage === 'semifinals' || tournament.stage === 'final')) {
                            finalMatches = matches.filter(m => !(m.tournamentId === tournament.id && m.knockoutType && m.status === 'scheduled'));
                            tournamentUpdate = { stage: undefined };
                            progressionReverted = true;
                        } else if (revertedMatch.knockoutType === 'semifinal' && tournament.stage === 'final') {
                            finalMatches = matches.filter(m => !(m.tournamentId === tournament.id && m.knockoutType === 'final'));
                            tournamentUpdate = { stage: 'semifinals' };
                            progressionReverted = true;
                        }
                    }
                }
    
                if (progressionReverted) {
                    setMatches(finalMatches.map(m => m.id === matchId ? revertedMatch : m));
                    if (tournamentUpdate) {
                        setTournaments(prev => prev.map(t => t.id === tournament.id ? { ...t, ...tournamentUpdate } : t));
                    }
                    return;
                }
            }
        }
        
        setMatches(prev => prev.map(m => m.id === matchId ? revertedMatch : m));
    }, [matches, tournaments, setMatches, setTournaments]);

    const endInnings = useCallback((matchId: string) => {
        setMatches(prev => prev.map(m => {
            if (m.id !== matchId || m.status !== 'live') return m;

            const isSecondInnings = !!m.innings2;
            const currentInnings = m.innings2 || m.innings1;

            if (!currentInnings) return m;

            if (!isSecondInnings && m.innings1) {
                const innings1 = m.innings1;
                const newInnings2: Innings = {
                    battingTeamId: innings1.bowlingTeamId,
                    bowlingTeamId: innings1.battingTeamId,
                    score: 0,
                    wickets: 0,
                    overs: 0,
                    balls: [],
                    batsmanScores: {},
                    bowlerScores: {},
                    currentBatsmen: ['', null],
                    currentBowler: null,
                    lastBowlerId: null,
                    manualOverrides: [],
                };
                return { ...m, innings2: newInnings2, updatedAt: createTimestamp() };
            } else if (isSecondInnings && m.innings1 && m.innings2) {
                const winnerId = determineWinner(m.innings1, m.innings2);
                return { ...m, status: 'completed', winnerId, updatedAt: createTimestamp() };
            }
            
            return m;
        }));
    }, [setMatches]);

    const setManOfTheMatch = useCallback((matchId: string, playerId: string) => {
        setMatches(prev => prev.map(m => 
            m.id === matchId ? { ...m, manOfTheMatchId: playerId, updatedAt: createTimestamp() } : m
        ));
    }, [setMatches]);

    const toggleFreeHit = useCallback((matchId: string) => {
        setMatches(prev => prev.map(m => {
            if (m.id !== matchId || m.status !== 'live') return m;

            const currentInningsKey = m.innings2 ? 'innings2' : 'innings1';
            const currentInnings = m[currentInningsKey];

            if (!currentInnings) return m;

            const updatedInnings: Innings = {
                ...currentInnings,
                isFreeHit: !currentInnings.isFreeHit,
            };

            return { ...m, [currentInningsKey]: updatedInnings, updatedAt: createTimestamp() };
        }));
    }, [setMatches]);

    const ensureTournamentMatchNumbers = useCallback((tournamentId: string) => {
        if (!tournamentId || tournamentId === 't_quick_matches') return;
        setMatches(prev => {
            const tournamentMatches = prev.filter(m => m.tournamentId === tournamentId && m.tournamentId !== 't_quick_matches');
            if (tournamentMatches.length === 0) return prev;

            const hasMissing = tournamentMatches.some(m => m.matchNumber === undefined || m.matchNumber === null);
            if (!hasMissing) return prev;

            let maxNum = 0;
            for (const m of tournamentMatches) {
                if (m.matchNumber !== undefined && m.matchNumber !== null && m.matchNumber > maxNum) {
                    maxNum = m.matchNumber;
                }
            }

            let currentNextNum = maxNum + 1;
            const updatedMatches = prev.map(m => {
                if (m.tournamentId === tournamentId && m.tournamentId !== 't_quick_matches' && (m.matchNumber === undefined || m.matchNumber === null)) {
                    const updatedMatch = { ...m, matchNumber: currentNextNum };
                    currentNextNum++;
                    return updatedMatch;
                }
                return m;
            });
            return updatedMatches;
        });
    }, [setMatches]);

    return {
        addMatch,
        addMatchesBatch,
        updateMatch,
        addPlayerReplacement,
        deleteMatch,
        addQuickMatch,
        createRematch,
        abandonMatch,
        updateToss,
        startMatch,
        endMatch,
        recordBall,
        updateLivePlayers,
        retireBatsman,
        undoLastBall,
        endInnings,
        setManOfTheMatch,
        toggleFreeHit,
        ensureTournamentMatchNumbers
    };
};
