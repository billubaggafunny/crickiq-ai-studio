import { Table, Thead, Tbody, Tr, Th, Td } from './CrickIQTable';
import CrickIQCard from './CrickIQCard';
import React, { useState, useMemo } from 'react';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { Team, Match, PointsTableData, Tournament } from '../types';
import { calculatePointsTable } from '../utils/cricketLogic';

const getQualificationCutoff = (tournament: Tournament | null): number | null => {
    if (!tournament) return null;
    if (tournament.groups) return 2; // Two groups format, top 2 from each group qualify
    if (tournament.format === 'Knockout' || tournament.format === 'Round Robin') return null;
    return 4; // Assume 4 for 'Round Robin + Knockout' by default
};

interface PointsTableProps extends UseCrickIQStateReturn {
    tournamentId?: string; // If provided, shows only this tournament's table
}


const PointsTable = (props: PointsTableProps) => {
    const { tournaments, teams, matches, tournamentId } = props;
    const [view, setView] = useState<'tournaments' | 'quickMatches'>('tournaments');
    const tournamentOptions = useMemo(() => tournaments.filter(t => t.id !== 't_quick_matches'), [tournaments]);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>(tournamentId || tournamentOptions[0]?.id || '');
    const [activeGroup, setActiveGroup] = useState<'a' | 'b'>('a');

    // State for swipe gestures
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

    const { tableData, tournament } = useMemo(() => {
        const effectiveTournamentId = tournamentId || (view === 'tournaments' ? selectedTournamentId : null);
        
        if (view === 'quickMatches' && !tournamentId) {
            // Quick Matches logic
            const quickMatches = matches.filter(m => m.isQuickMatch && m.status === 'completed');
            if (quickMatches.length === 0) return { tableData: [], tournament: null };
            
            const quickMatchTeams = teams.filter(t => quickMatches.some(m => m.team1Id === t.id || m.team2Id === t.id));
            
            const stats: Record<string, PointsTableData> = {};
            quickMatchTeams.forEach(team => {
                stats[team.id] = { teamId: team.id, teamName: team.name, logo: team.logo, played: 0, won: 0, lost: 0, drawn: 0, points: 0, nrr: 'N/A' };
            });

            quickMatches.forEach(match => {
                if (!stats[match.team1Id] || !stats[match.team2Id]) return;
                stats[match.team1Id].played += 1;
                stats[match.team2Id].played += 1;
                if (match.winnerId && match.winnerId !== 'draw') {
                    stats[match.winnerId].won += 1;
                    stats[match.winnerId].points += 2;
                    const loserId = match.team1Id === match.winnerId ? match.team2Id : match.team1Id;
                    stats[loserId].lost += 1;
                } else {
                    stats[match.team1Id].drawn += 1;
                    stats[match.team2Id].drawn += 1;
                    stats[match.team1Id].points += 1;
                    stats[match.team2Id].points += 1;
                }
            });
            
            return {
                tableData: Object.values(stats).sort((a, b) => b.points - a.points || a.teamName.localeCompare(b.teamName)),
                tournament: null
            };
        }

        const tournament = tournaments.find(t => t.id === effectiveTournamentId);
        if (!tournament) return { tableData: [], tournament: null };

        let relevantMatches: Match[];
        let relevantTeams: Team[];

        if (tournament.groups) {
            const groupTeamIds = tournament.groups[activeGroup];
            relevantTeams = teams.filter(t => groupTeamIds.includes(t.id));
            relevantMatches = matches.filter(m => m.tournamentId === tournament.id && m.status === 'completed' && m.groupId === activeGroup);
        } else {
            relevantTeams = teams.filter(t => tournament.teamIds.includes(t.id));
            relevantMatches = matches.filter(m => m.tournamentId === tournament.id && m.status === 'completed' && !m.knockoutType);
        }

        return { tableData: calculatePointsTable(relevantTeams, relevantMatches), tournament };

    }, [view, selectedTournamentId, matches, teams, tournaments, tournamentId, activeGroup]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (tournamentId) return; // Disable swipe in embedded mode
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe, .overflow-x-auto, [data-no-swipe="true"]')) {
            return;
        }
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchCurrentX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        setTouchCurrentX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null || touchCurrentX === null) {
            return;
        }

        const diffX = touchStartX - touchCurrentX;
        const SWIPE_THRESHOLD = 75;

        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
            const tabs: ('tournaments' | 'quickMatches')[] = ['tournaments', 'quickMatches'];
            const currentIndex = tabs.indexOf(view);

            if (diffX > 0) { // Swiped left
                if (currentIndex < tabs.length - 1) {
                    e.stopPropagation(); // Local swipe success, prevent workspace swipe
                    setView(tabs[currentIndex + 1]);
                }
            } else { // Swiped right
                if (currentIndex > 0) {
                    e.stopPropagation(); // Local swipe success, prevent workspace swipe
                    setView(tabs[currentIndex - 1]);
                }
            }
        }

        setTouchStartX(null);
        setTouchCurrentX(null);
    };

    if (!tournamentId && view === 'tournaments' && tournamentOptions.length === 0) {
        return (
            <CrickIQCard  className="! sm:!">
                <p className="text-center text-text-secondary">No tournaments available to show points.</p>
            </CrickIQCard>
        );
    }
    
    return (
        <div className="space-y-4">
            {!tournamentId && (
                <>
                    <CrickIQCard  className="!">
                        <div className="flex flex-col sm:flex-row items-stretch gap-2">
                            <div className="flex bg-primary/50 p-1 rounded-2xl flex-shrink-0">
                                <button
                                    onClick={() => setView('tournaments')}
                                    className={`w-full sm:w-auto py-1.5 px-4 rounded-2xl font-semibold transition-colors duration-300 text-body ${view === 'tournaments' ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-secondary'}`}
                                >
                                    Tournaments
                                </button>
                                <button
                                    onClick={() => setView('quickMatches')}
                                    className={`w-full sm:w-auto py-1.5 px-4 rounded-2xl font-semibold transition-colors duration-300 text-body ${view === 'quickMatches' ? 'bg-brand-blue text-white shadow-sm' : 'hover:bg-secondary'}`}
                                >
                                    Quick Matches
                                </button>
                            </div>
                            {view === 'tournaments' && (
                                <select
                                    value={selectedTournamentId}
                                    onChange={e => setSelectedTournamentId(e.target.value)}
                                    className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue text-body font-semibold"
                                >
                                    {tournamentOptions.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </CrickIQCard>
                </>
            )}

            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {tournament?.groups && (
                     <div className="border-b border-brand-blue/15 flex items-center justify-center gap-4">
                        <button onClick={() => setActiveGroup('a')} className={`py-2 px-4 font-bold transition-colors duration-300 text-body ${activeGroup === 'a' ? 'border-b-2 border-brand-blue text-brand-blue' : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'}`}>
                            Group A
                        </button>
                        <button onClick={() => setActiveGroup('b')} className={`py-2 px-4 font-bold transition-colors duration-300 text-body ${activeGroup === 'b' ? 'border-b-2 border-brand-blue text-brand-blue' : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'}`}>
                            Group B
                        </button>
                    </div>
                )}
                <CrickIQCard  className="! sm:!">
                                {tableData.length > 0 ? (
                                    <Table >
                                            <Thead>
                                                <Tr >
                                                    <Th className="w-full">Team</Th>
                                                    <Th className="text-right" title="Played">P</Th>
                                                    <Th className="text-right" title="Won">W</Th>
                                                    <Th className="text-right" title="Lost">L</Th>
                                                    <Th className="text-right" title="Drawn/No Result">D</Th>
                                                    <Th className="text-right" title="Points">Pts</Th>
                                                    {view === 'tournaments' && <Th className="text-right" title="Net Run Rate">NRR</Th>}
                                                    {view === 'tournaments' && getQualificationCutoff(tournament) !== null && <Th className="text-right">Status</Th>}
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {tableData.map((d, index) => {
                                                    const cutoff = getQualificationCutoff(tournament);
                                                    const rank = index + 1;
                                                    let badge = null;
                                                    if (view === 'tournaments' && cutoff !== null) {
                                                        const isQualified = rank <= cutoff;
                                                        badge = isQualified ? (
                                                            <span className="text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap">
                                                                🟢 Q
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded-full uppercase whitespace-nowrap">
                                                                🔴 E
                                                            </span>
                                                        );
                                                    }
                                                    return (
                                                    <Tr key={d.teamId} className={cutoff !== null && rank === cutoff && rank < tableData.length ? 'border-b-2 border-dashed !border-brand-blue/40 dark:!border-brand-blue/40' : ''}>
                                                        <Td >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md text-button text-white text-caption" style={{ backgroundColor: d.logo }}>
                                                                    {d.teamName.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <span className="truncate max-w-[120px] sm:max-w-xs">{d.teamName}</span>
                                                            </div>
                                                        </Td>
                                                        <Td className="text-right">{d.played}</Td>
                                                        <Td className="text-right">{d.won}</Td>
                                                        <Td className="text-right">{d.lost}</Td>
                                                        <Td className="text-right">{d.drawn}</Td>
                                                        <Td className="text-right font-bold text-brand-blue">{d.points}</Td>
                                                        {view === 'tournaments' && <Td className="text-right">{d.nrr}</Td>}
                                                        {view === 'tournaments' && cutoff !== null && <Td className="text-right">{badge}</Td>}
                                                    </Tr>
                                                    );
                                                })}
                                            </Tbody>
                                        </Table>
                                ) : (
                        <p className="text-center text-text-secondary">
                            {view === 'tournaments' ? 'No completed matches for this tournament yet.' : 'No completed quick matches yet.'}
                        </p>
                    )}
                </CrickIQCard>
            </div>
        </div>
    );
};
export default PointsTable;