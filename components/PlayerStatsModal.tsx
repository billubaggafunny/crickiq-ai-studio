

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Player, Match, Team, Innings } from '../types';
import { calculatePlayerCareerStats } from '../utils/cricketLogic';
import { getRoleIcon } from '../constants';

import { SafeChartWrapper } from './SafeChartWrapper';

interface PlayerStatsModalProps {
    player: Player & { teamName?: string; teamId?: string };
    matches: Match[];
    teams: Team[];
    onClose: () => void;
}

const StatItem: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
    <div className="flex flex-col items-center justify-center p-3 bg-primary rounded-[16px] selectable-text shadow-sm">
        <span className="font-bold text-2xl md:text-3xl tracking-tight text-text-primary leading-none mb-1.5">{value}</span>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-text-secondary">{label}</span>
    </div>
);

const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({ player, matches, teams, onClose }) => {

    const careerStats = useMemo(() => calculatePlayerCareerStats(player.id, matches), [player, matches]);
    
    const performanceData = useMemo(() => {
        const data: { match: string, runs: number, wickets: number }[] = [];

        const completedMatches = matches
            .filter(m => m.status === 'completed')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        for (const match of completedMatches) {
            const innings = [match.innings1, match.innings2].filter((i): i is Innings => !!i);
            let runs = 0;
            let wickets = 0;
            let played = false;

            const opponentId = match.team1Id === player.teamId ? match.team2Id : match.team1Id;
            const opponent = teams.find(t => t.id === opponentId);
            const matchName = `vs ${opponent ? opponent.name.split(' ').pop() : 'N/A'}`;
            
            for (const inning of innings) {
                if(inning.batsmanScores[player.id]) {
                    runs += inning.batsmanScores[player.id].runs;
                    played = true;
                }
                if(inning.bowlerScores[player.id]) {
                    wickets += inning.bowlerScores[player.id].wickets;
                    played = true;
                }
            }

            if(played) {
                data.push({ match: matchName, runs, wickets });
            }
        }
        return data;
    }, [player, matches, teams]);


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-secondary rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-brand-blue/15 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-text-primary leading-tight mt-1">{player.name}</h2>
                        <div className="text-text-secondary flex items-center gap-2">
                             <div className="w-5 h-5 flex items-center justify-center rounded-sm text-button text-white text-[10px]" style={{ backgroundColor: teams.find(t => t.id === player.teamId)?.logo }}>
                                 {player.teamName?.substring(0, 2).toUpperCase()}
                             </div>
                            <span>{player.teamName}</span>
                            <span className="text-slate-600 dark:text-text-secondary">&bull;</span>
                            <div className="flex items-center gap-1.5">
                                {getRoleIcon(player.role)}
                                <span>{player.role}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-3xl text-text-secondary hover:text-text-primary">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 no-scrollbar">
                    {/* Batting Stats */}
                    {careerStats.inningsBatted > 0 && (
                        <div>
                            <h3 className="text-sm uppercase tracking-widest font-bold text-text-secondary mb-4">Batting Career</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <StatItem label="Matches" value={careerStats.matches} />
                                <StatItem label="Innings" value={careerStats.inningsBatted} />
                                <StatItem label="Runs" value={careerStats.runsScored} />
                                <StatItem label="Not Outs" value={careerStats.notOuts} />
                                <StatItem label="Average" value={careerStats.battingAverage} />
                                <StatItem label="Strike Rate" value={careerStats.strikeRate} />
                                <StatItem label="High Score" value={careerStats.highScore} />
                                <StatItem label="100s" value={careerStats.hundreds} />
                                <StatItem label="50s" value={careerStats.fifties} />
                                <StatItem label="30s" value={careerStats.thirties} />
                                <StatItem label="4s" value={careerStats.fours} />
                                <StatItem label="6s" value={careerStats.sixes} />
                            </div>
                        </div>
                    )}

                    {/* Bowling Stats */}
                    {careerStats.inningsBowled > 0 && (
                         <div>
                            <h3 className="text-sm uppercase tracking-widest font-bold text-text-secondary mb-4">Bowling Career</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <StatItem label="Matches" value={careerStats.matches} />
                                <StatItem label="Innings" value={careerStats.inningsBowled} />
                                <StatItem label="Wickets" value={careerStats.wicketsTaken} />
                                <StatItem label="Overs" value={careerStats.oversBowled} />
                                <StatItem label="Economy" value={careerStats.economyRate} />
                                <StatItem label="Average" value={careerStats.bowlingAverage} />
                                <StatItem label="Runs" value={careerStats.runsConceded} />
                                <StatItem label="Maidens" value={careerStats.maidens} />
                                <StatItem label="Best" value={careerStats.bestBowlingInnings} />
                            </div>
                        </div>
                    )}

                    {/* Performance Charts */}
                    {performanceData.length > 0 && (
                        <div>
                            <h3 className="text-sm uppercase tracking-widest font-bold text-text-secondary mb-4">Performance Timeline</h3>
                            {careerStats.inningsBatted > 0 && (
                                 <div className="mb-4">
                                    <h4 className="text-base font-semibold text-text-secondary mb-2">Runs per Match</h4>
                                    
        <div className="w-full h-[200px] min-h-[200px]">
            {(!performanceData || performanceData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                <SafeChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="match" stroke="var(--color-text-secondary)" fontSize={12} />
                            <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
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
        
                                </div>
                            )}
                             {careerStats.inningsBowled > 0 && (
                                 <div>
                                    <h4 className="text-base font-semibold text-text-secondary mb-2">Wickets per Match</h4>
                                    
        <div className="w-full h-[200px] min-h-[200px]">
            {(!performanceData || performanceData.length === 0) ? (
                <div className="flex items-center justify-center h-full w-full text-text-secondary">No data available</div>
            ) : (
                <SafeChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={performanceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="match" stroke="var(--color-text-secondary)" fontSize={12} />
                            <YAxis stroke="var(--color-text-secondary)" fontSize={12} allowDecimals={false} />
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
        
                                </div>
                            )}
                        </div>
                    )}
                </div>

                 <div className="p-4 border-t border-brand-blue/15 text-right">
                    <button onClick={onClose} className="px-4 py-1.5 bg-brand-blue text-white font-semibold rounded-lg hover:bg-opacity-90">Close</button>
                </div>
            </div>
        </div>
    );
};

export default PlayerStatsModal;