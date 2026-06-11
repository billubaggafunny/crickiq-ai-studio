import { Table, Thead, Tbody, Tr, Th, Td } from './CrickIQTable';
import CrickIQCard from './CrickIQCard';
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import { calculatePlayerCareerStats } from '../utils/cricketLogic';
import PlayerStatsModal from './PlayerStatsModal';
import type { Player } from '../types';
import { SafeChartWrapper } from './SafeChartWrapper';

// FIX: Updated Card component to accept and spread additional props (e.g., onClick) to resolve type errors.

const QuickMatchStats: React.FC<UseCrickIQStateReturn> = ({ matches, teams }) => {
    const [viewingPlayer, setViewingPlayer] = useState< (Player & { teamName?: string; teamId?: string; }) | null>(null);

    const { playerStats, quickMatches, filteredTeams } = useMemo(() => {
        const quickMatches = matches.filter(m => m.isQuickMatch && m.status === 'completed');
        const quickMatchTeamIds = new Set<string>();
        quickMatches.forEach(m => {
            quickMatchTeamIds.add(m.team1Id);
            quickMatchTeamIds.add(m.team2Id);
        });
        const filteredTeams = teams.filter(t => quickMatchTeamIds.has(t.id));

        const allPlayers = filteredTeams.flatMap(t => {
            const teamName = t.name;
            const teamId = t.id;
            const logo = t.logo;
            return t.players.map(p => ({ ...p, teamName, teamId, logo }));
        });

        const playerStats = allPlayers.map(player => {
            const careerStats = calculatePlayerCareerStats(player.id, quickMatches);
            return {
                ...player,
                ...careerStats,
            };
        });

        return { playerStats, quickMatches, filteredTeams };
    }, [matches, teams]);
    
    const topScorer = useMemo(() => [...playerStats].sort((a,b) => b.runsScored - a.runsScored)[0], [playerStats]);
    const topBowler = useMemo(() => [...playerStats].sort((a,b) => b.wicketsTaken - a.wicketsTaken)[0], [playerStats]);

    const topBattersData = useMemo(() => {
        return [...playerStats]
            .filter(p => p.runsScored > 0)
            .sort((a,b) => b.runsScored - a.runsScored)
            .slice(0, 5)
            .map(p => ({ name: p.name.split(' ')[0], runs: p.runsScored }));
    }, [playerStats]);

    const topBowlersData = useMemo(() => {
        return [...playerStats]
            .filter(p => p.wicketsTaken > 0)
            .sort((a,b) => b.wicketsTaken - a.wicketsTaken)
            .slice(0, 5)
            .map(p => ({ name: p.name.split(' ')[0], wickets: p.wicketsTaken }));
    }, [playerStats]);

    if (quickMatches.length === 0) {
        return (
            <CrickIQCard>
                <p className="text-center text-text-secondary py-8">
                    No completed quick matches to generate stats.
                </p>
            </CrickIQCard>
        );
    }

    return (
        <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CrickIQCard>
                    <h2 className="text-sm uppercase tracking-widest font-bold text-text-secondary mb-4">Top Scorer</h2>
                    {topScorer && topScorer.runsScored > 0 ? (
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: topScorer.logo }}>
                                {topScorer.teamName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                                    {topScorer.name}
                                </p>
                                <p className="text-sm text-text-secondary">{topScorer.teamName}</p>
                            </div>
                            <div className="ml-auto text-right selectable-text">
                                <p className="text-2xl font-bold text-text-primary">{topScorer.runsScored}</p>
                                <p className="text-sm text-text-muted">SR: {topScorer.strikeRate}</p>
                            </div>
                        </div>
                    ) : <p className="text-text-secondary">No data yet.</p>}
                </CrickIQCard>
                 <CrickIQCard>
                    <h2 className="text-sm uppercase tracking-widest font-bold text-text-secondary mb-4">Top Wicket Taker</h2>
                    {topBowler && topBowler.wicketsTaken > 0 ? (
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: topBowler.logo }}>
                                {topBowler.teamName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
                                    {topBowler.name}
                                </p>
                                <p className="text-sm text-text-secondary">{topBowler.teamName}</p>
                            </div>
                            <div className="ml-auto text-right selectable-text">
                                <p className="text-2xl font-bold text-text-primary">{topBowler.wicketsTaken}</p>
                                <p className="text-sm text-text-muted">Econ: {topBowler.economyRate}</p>
                            </div>
                        </div>
                    ) : <p className="text-text-secondary">No data yet.</p>}
                </CrickIQCard>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CrickIQCard>
                    <h3 className="text-xl font-bold text-text-primary mb-4">Top Run Scorers</h3>
                     
        <div className="w-full h-[300px] min-h-[300px]">
            {(!topBattersData || topBattersData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                <SafeChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topBattersData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                            <YAxis stroke="var(--color-text-secondary)" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0.25rem'
                                }}
                            />
                            <Bar dataKey="runs" fill="var(--color-info)" name="Runs" />
                        </BarChart>
                    </ResponsiveContainer>
                </SafeChartWrapper>
            )}
        </div>
        
                </CrickIQCard>
                <CrickIQCard>
                    <h3 className="text-xl font-bold text-text-primary mb-4">Top Wicket Takers</h3>
                     
        <div className="w-full h-[300px] min-h-[300px]">
            {(!topBowlersData || topBowlersData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                <SafeChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topBowlersData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="name" stroke="var(--color-text-secondary)" />
                            <YAxis stroke="var(--color-text-secondary)" allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0.25rem'
                                }}
                            />
                            <Bar dataKey="wickets" fill="var(--color-danger)" name="Wickets" />
                        </BarChart>
                    </ResponsiveContainer>
                </SafeChartWrapper>
            )}
        </div>
        
                </CrickIQCard>
            </div>


            <CrickIQCard>
                <h2 className="text-xl font-bold tracking-tight text-text-primary mb-4">Batting Leaderboard</h2>
                <Table >
                        <Thead>
                           <Tr className="border-b border-brand-blue/15">
                                <Th className="w-full">Player</Th>
                                <Th className="text-right">Runs</Th>
                                <Th className="text-right">HS</Th>
                                <Th className="text-right">Avg</Th>
                                <Th className="text-right">SR</Th>
                           </Tr>
                        </Thead>
                        <Tbody>
                            {[...playerStats]
                                .filter(p => p.inningsBatted > 0)
                                .sort((a,b) => b.runsScored - a.runsScored)
                                .map(p => (
                                <Tr key={p.id} onClick={() => setViewingPlayer(p)} className="border-b border-brand-blue/15 last:border-b-0 hover:bg-secondary cursor-pointer transition-colors duration-200">
                                    <Td >
                                        <p className="font-semibold text-text-primary">{p.name}</p> 
                                        <p className="text-caption text-text-secondary flex items-center gap-2">
                                            <div className="w-4 h-4 flex items-center justify-center rounded-sm text-button text-white text-[8px]" style={{ backgroundColor: p.logo }}>
                                                {p.teamName.substring(0, 2).toUpperCase()}
                                            </div>
                                            {p.teamName}
                                        </p>
                                    </Td>
                                    <Td className="text-right font-bold text-brand-blue">{p.runsScored}</Td>
                                    <Td className="text-right">{p.highScore}</Td>
                                    <Td className="text-right">{p.battingAverage}</Td>
                                    <Td className="text-right">{p.strikeRate}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
            </CrickIQCard>

            <CrickIQCard>
                <h2 className="text-xl font-bold tracking-tight text-text-primary mb-4">Bowling Leaderboard</h2>
                <Table >
                        <Thead>
                            <Tr className="border-b border-brand-blue/15">
                                <Th className="w-full">Player</Th>
                                <Th className="text-right">Wickets</Th>
                                <Th className="text-right">Econ</Th>
                                <Th className="text-right">Avg</Th>
                                <Th className="text-right">Best</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {[...playerStats]
                                .filter(p => p.inningsBowled > 0)
                                .sort((a, b) => b.wicketsTaken - a.wicketsTaken || a.runsConceded - b.runsConceded)
                                .map(p => (
                                <Tr key={p.id} onClick={() => setViewingPlayer(p)} className="border-b border-brand-blue/15 last:border-b-0 hover:bg-secondary cursor-pointer transition-colors duration-200">
                                    <Td > 
                                        <p className="font-semibold text-text-primary">{p.name}</p> 
                                        <p className="text-caption text-text-secondary flex items-center gap-2">
                                            <div className="w-4 h-4 flex items-center justify-center rounded-sm text-button text-white text-[8px]" style={{ backgroundColor: p.logo }}>
                                                {p.teamName.substring(0, 2).toUpperCase()}
                                            </div>
                                            {p.teamName}
                                        </p>
                                    </Td>
                                    <Td className="text-right font-bold text-brand-blue">{p.wicketsTaken}</Td>
                                    <Td className="text-right">{p.economyRate}</Td>
                                    <Td className="text-right">{p.bowlingAverage}</Td>
                                    <Td className="text-right">{p.bestBowlingInnings}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
            </CrickIQCard>

            {viewingPlayer && (
                <PlayerStatsModal
                    player={viewingPlayer}
                    matches={quickMatches}
                    teams={filteredTeams}
                    onClose={() => setViewingPlayer(null)}
                />
            )}
        </div>
    );
};

export default QuickMatchStats;