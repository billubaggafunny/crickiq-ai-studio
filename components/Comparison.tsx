import CrickIQCard from './CrickIQCard';
import React, { useState, useMemo } from 'react';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { Match, Innings, PlayerCareerStats } from '../types';
import ComparisonBarChart from './ComparisonBarChart';
import { calculatePlayerCareerStats, calculateStrikeRate, calculateEconomy } from '../utils/cricketLogic';
import { getMaxPlayers } from '../utils/matchConfig';
import { useNotification } from '../hooks/useNotification';


const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md bg-brand-gradient text-white border-0';
    return <button {...props} className={`${baseClasses} ${className}`}>{children}</button>
};

const StatRow: React.FC<{ label: string, value1: string | number, value2: string | number }> = ({ label, value1, value2 }) => (
    <div className="grid grid-cols-3 items-center text-center py-2 border-b border-brand-blue/15 last:border-b-0">
        <span className="font-bold text-h3" style={{color: 'var(--color-brand-teal)'}}>{value1}</span>
        <span className="text-table-header text-text-secondary">{label}</span>
        <span className="font-bold text-h3" style={{color: 'var(--color-brand-blue)'}}>{value2}</span>
    </div>
);

const Comparison: React.FC<UseCrickIQStateReturn> = ({ teams, matches, getTournamentById }) => {
    const { showNotification } = useNotification();
    const [mode, setMode] = useState<'team' | 'player'>('team');
    
    // Team state
    const [team1Id, setTeam1Id] = useState<string>('');
    const [team2Id, setTeam2Id] = useState<string>('');
    const [teamResult, setTeamResult] = useState<{
        team1: { name: string; value: number; color: string; logo: string; wins: number; highestScore: number; lowestScore: number; biggestWinRuns: number | null; biggestWinWickets: number | null; },
        team2: { name: string; value: number; color: string; logo: string; wins: number; highestScore: number; lowestScore: number; biggestWinRuns: number | null; biggestWinWickets: number | null; },
        totalMatches: number;
    } | null>(null);

    // Player state
    const [p1TeamId, setP1TeamId] = useState<string>('');
    const [p2TeamId, setP2TeamId] = useState<string>('');
    const [player1Id, setPlayer1Id] = useState<string>('');
    const [player2Id, setPlayer2Id] = useState<string>('');
    const [playerResult, setPlayerResult] = useState<{
        player1: { name: string; value: number; color: string; logo: string; stats: PlayerCareerStats; },
        player2: { name: string; value: number; color: string; logo: string; stats: PlayerCareerStats; },
        totalScore: number
    } | null>(null);

    const allTeams = useMemo(() => [...teams].sort((a, b) => a.name.localeCompare(b.name)), [teams]);

    const handleTeamCompare = () => {
        if (!team1Id || !team2Id) return;

        const team1 = teams.find(t => t.id === team1Id);
        const team2 = teams.find(t => t.id === team2Id);
        
        if (!team1 || !team2) {
            showNotification('Could not find selected teams. They may have been deleted.', 'error');
            return;
        }

        const headToHeadMatches = matches.filter(m =>
            m.status === 'completed' && !m.wasAbandoned &&
            ((m.team1Id === team1Id && m.team2Id === team2Id) || (m.team1Id === team2Id && m.team2Id === team1Id))
        );

        const team1Wins = headToHeadMatches.filter(m => m.winnerId === team1Id).length;
        const team2Wins = headToHeadMatches.filter(m => m.winnerId === team2Id).length;
        const totalMatches = headToHeadMatches.length;

        if (totalMatches === 0) {
            setTeamResult({
                team1: { name: team1.name, value: 0, color: 'var(--color-brand-teal)', logo: team1.logo, wins: 0, highestScore: 0, lowestScore: 0, biggestWinRuns: null, biggestWinWickets: null },
                team2: { name: team2.name, value: 0, color: 'var(--color-brand-blue)', logo: team2.logo, wins: 0, highestScore: 0, lowestScore: 0, biggestWinRuns: null, biggestWinWickets: null },
                totalMatches: 0
            });
            return;
        }

        const team1WinPercentage = (team1Wins / totalMatches) * 100;
        const team2WinPercentage = (team2Wins / totalMatches) * 100;

        const team1Stats = { highestScore: 0, lowestScore: Infinity, biggestWinRuns: null as number | null, biggestWinWickets: null as number | null };
        const team2Stats = { highestScore: 0, lowestScore: Infinity, biggestWinRuns: null as number | null, biggestWinWickets: null as number | null };

        headToHeadMatches.forEach(match => {
            if (!match.innings1 || !match.innings2) return;
    
            const tournament = getTournamentById(match.tournamentId);
            const numPlayers = getMaxPlayers(match, tournament);
    
            const team1Innings = match.innings1.battingTeamId === team1.id ? match.innings1 : match.innings2;
            const team2Innings = match.innings1.battingTeamId === team2.id ? match.innings1 : match.innings2;
    
            team1Stats.highestScore = Math.max(team1Stats.highestScore, team1Innings.score);
            team1Stats.lowestScore = Math.min(team1Stats.lowestScore, team1Innings.score);
    
            team2Stats.highestScore = Math.max(team2Stats.highestScore, team2Innings.score);
            team2Stats.lowestScore = Math.min(team2Stats.lowestScore, team2Innings.score);
    
            if (match.winnerId === team1.id) {
                // Team 1 won
                if (team1Innings.battingTeamId === (match.innings1?.battingTeamId)) { // Team 1 batted first
                    const margin = team1Innings.score - team2Innings.score;
                    team1Stats.biggestWinRuns = Math.max(team1Stats.biggestWinRuns ?? 0, margin);
                } else { // Team 1 chased
                    const wicketsLeft = (numPlayers - 1) - team1Innings.wickets;
                    team1Stats.biggestWinWickets = Math.max(team1Stats.biggestWinWickets ?? 0, wicketsLeft);
                }
            } else if (match.winnerId === team2.id) {
                // Team 2 won
                if (team2Innings.battingTeamId === (match.innings1?.battingTeamId)) { // Team 2 batted first
                    const margin = team2Innings.score - team1Innings.score;
                    team2Stats.biggestWinRuns = Math.max(team2Stats.biggestWinRuns ?? 0, margin);
                } else { // Team 2 chased
                    const wicketsLeft = (numPlayers - 1) - team2Innings.wickets;
                    team2Stats.biggestWinWickets = Math.max(team2Stats.biggestWinWickets ?? 0, wicketsLeft);
                }
            }
        });

        setTeamResult({
            team1: { 
                name: team1.name, value: team1WinPercentage, color: 'var(--color-brand-teal)', logo: team1.logo, wins: team1Wins,
                highestScore: team1Stats.highestScore,
                lowestScore: team1Stats.lowestScore === Infinity ? 0 : team1Stats.lowestScore,
                biggestWinRuns: team1Stats.biggestWinRuns,
                biggestWinWickets: team1Stats.biggestWinWickets
            },
            team2: { 
                name: team2.name, value: team2WinPercentage, color: 'var(--color-brand-blue)', logo: team2.logo, wins: team2Wins,
                highestScore: team2Stats.highestScore,
                lowestScore: team2Stats.lowestScore === Infinity ? 0 : team2Stats.lowestScore,
                biggestWinRuns: team2Stats.biggestWinRuns,
                biggestWinWickets: team2Stats.biggestWinWickets
            },
            totalMatches: totalMatches
        });
    };

    const getPlayerPerformanceScore = (playerId: string, matches: Match[]): number => {
        let score = 0;
        for (const match of matches) {
            const innings = [match.innings1, match.innings2].filter(Boolean) as Innings[];
            for (const inning of innings) {
                const battingPerf = inning.batsmanScores[playerId];
                if (battingPerf) {
                    score += battingPerf.runs;
                    if (battingPerf.runs >= 100) score += 50;
                    else if (battingPerf.runs >= 50) score += 25;
                    const sr = parseFloat(calculateStrikeRate(battingPerf.runs, battingPerf.balls));
                    if (sr > 150 && battingPerf.balls > 10) score += 15;
                }
                const bowlingPerf = inning.bowlerScores[playerId];
                if (bowlingPerf) {
                    score += bowlingPerf.wickets * 20;
                    if (bowlingPerf.wickets >= 5) score += 50;
                    else if (bowlingPerf.wickets >= 3) score += 25;
                    const econ = parseFloat(calculateEconomy(bowlingPerf.runsConceded, bowlingPerf.overs));
                    if (econ > 0 && econ <= 4.0 && bowlingPerf.overs >= (match.oversPerInnings / 5)) score += 20;
                }
            }
        }
        return score;
    };

    const handlePlayerCompare = () => {
        if (!player1Id || !player2Id || !p1TeamId || !p2TeamId) return;
        
        const p1Team = teams.find(t => t.id === p1TeamId);
        const p2Team = teams.find(t => t.id === p2TeamId);
        
        if (!p1Team || !p2Team) {
            showNotification('Could not find player teams.', 'error');
            return;
        }

        const player1 = p1Team.players.find(p => p.id === player1Id);
        const player2 = p2Team.players.find(p => p.id === player2Id);
        
        if (!player1 || !player2) {
            showNotification('Could not find selected players.', 'error');
            return;
        }

        const headToHeadMatches = p1Team.id === p2Team.id ? [] : matches.filter(m =>
            m.status === 'completed' && !m.wasAbandoned &&
            ((m.team1Id === p1Team.id && m.team2Id === p2Team.id) || (m.team1Id === p2Team.id && m.team2Id === p1Team.id))
        );
        
        const player1Stats = calculatePlayerCareerStats(player1Id, headToHeadMatches);
        const player2Stats = calculatePlayerCareerStats(player2Id, headToHeadMatches);

        const player1Score = getPlayerPerformanceScore(player1Id, headToHeadMatches);
        const player2Score = getPlayerPerformanceScore(player2Id, headToHeadMatches);
        const totalScore = player1Score + player2Score;

        let player1Domination = 0;
        let player2Domination = 0;

        if (totalScore > 0) {
            player1Domination = (player1Score / totalScore) * 100;
            player2Domination = (player2Score / totalScore) * 100;
        }
        
        setPlayerResult({
            player1: { name: player1.name, value: player1Domination, color: 'var(--color-brand-teal)', logo: p1Team.logo, stats: player1Stats },
            player2: { name: player2.name, value: player2Domination, color: 'var(--color-brand-blue)', logo: p2Team.logo, stats: player2Stats },
            totalScore: totalScore
        });
    };

    const team1Options = useMemo(() => allTeams.filter(t => t.id !== team2Id), [allTeams, team2Id]);
    const team2Options = useMemo(() => allTeams.filter(t => t.id !== team1Id), [allTeams, team1Id]);
    const p1TeamOptions = useMemo(() => allTeams.filter(t => t.players.length > 0), [allTeams]);
    const p2TeamOptions = useMemo(() => allTeams.filter(t => t.players.length > 0), [allTeams]);

    const p1Players = useMemo(() => teams.find(t => t.id === p1TeamId)?.players || [], [teams, p1TeamId]);
    const p2Players = useMemo(() => teams.find(t => t.id === p2TeamId)?.players || [], [teams, p2TeamId]);

    return (
        <div className="space-y-6">
            <div className="border-b border-brand-blue/15 flex items-center gap-4">
                <button
                    onClick={() => setMode('team')}
                    className={`py-2 px-1 font-bold transition-colors duration-300 text-body ${mode === 'team' ? 'border-b-2 border-brand-blue text-brand-blue' : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    Team vs Team
                </button>
                <button
                    onClick={() => setMode('player')}
                    className={`py-2 px-1 font-bold transition-colors duration-300 text-body ${mode === 'player' ? 'border-b-2 border-brand-blue text-brand-blue' : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'}`}
                >
                    Player vs Player
                </button>
            </div>

            {mode === 'team' && (
                <div className="space-y-6 animate-fade-in">
                    <CrickIQCard>
                        <h3 className="text-h3 text-text-primary mb-4">Select Teams to Compare</h3>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                            <select value={team1Id} onChange={e => { setTeam1Id(e.target.value); setTeamResult(null); }} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option value="" disabled>Select Team 1</option>
                                {team1Options.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <select value={team2Id} onChange={e => { setTeam2Id(e.target.value); setTeamResult(null); }} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                <option value="" disabled>Select Team 2</option>
                                {team2Options.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <Button onClick={handleTeamCompare} disabled={!team1Id || !team2Id}>Compare</Button>
                        </div>
                    </CrickIQCard>
                    {teamResult && (
                        <CrickIQCard>
                            <h3 className="text-h3 text-text-primary mb-4">Head-to-Head Result</h3>
                            {teamResult.totalMatches > 0 ? (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-center text-md font-bold text-text-primary mb-2">Win Percentage</h4>
                                        <p className="text-center text-body text-text-secondary mb-4">Based on {teamResult.totalMatches} completed match(es).</p>
                                        <ComparisonBarChart data={[teamResult.team1, teamResult.team2]} />
                                    </div>
                                    <div>
                                        <h4 className="text-center text-md font-bold text-text-primary mb-2 mt-6">Detailed History</h4>
                                        <div className="bg-primary/50 dark:bg-black/20 rounded-lg p-2">
                                            <StatRow label="Highest Score" value1={teamResult.team1.highestScore} value2={teamResult.team2.highestScore} />
                                            <StatRow label="Lowest Score" value1={teamResult.team1.lowestScore} value2={teamResult.team2.lowestScore} />
                                            <StatRow label="Biggest Win (Runs)" value1={teamResult.team1.biggestWinRuns ? `${teamResult.team1.biggestWinRuns} runs` : '-'} value2={teamResult.team2.biggestWinRuns ? `${teamResult.team2.biggestWinRuns} runs` : '-'} />
                                            <StatRow label="Biggest Win (Wickets)" value1={teamResult.team1.biggestWinWickets ? `${teamResult.team1.biggestWinWickets} wkts` : '-'} value2={teamResult.team2.biggestWinWickets ? `${teamResult.team2.biggestWinWickets} wkts` : '-'} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-text-secondary py-4">No past head-to-head matches found between these teams.</p>
                            )}
                        </CrickIQCard>
                    )}
                </div>
            )}

            {mode === 'player' && (
                <div className="space-y-6 animate-fade-in">
                    <CrickIQCard>
                        <h3 className="text-h3 text-text-primary mb-4">Select Players to Compare</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                            <div className="space-y-2">
                                <select value={p1TeamId} onChange={e => { setP1TeamId(e.target.value); setPlayer1Id(''); setPlayerResult(null); }} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                    <option value="">Select Team 1</option>
                                    {p1TeamOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <select value={player1Id} onChange={e => { setPlayer1Id(e.target.value); setPlayerResult(null); }} disabled={!p1TeamId} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400">
                                    <option value="">Select Player 1</option>
                                    {p1Players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                             <div className="space-y-2">
                                <select value={p2TeamId} onChange={e => { setP2TeamId(e.target.value); setPlayer2Id(''); setPlayerResult(null); }} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                                    <option value="">Select Team 2</option>
                                    {p2TeamOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <select value={player2Id} onChange={e => { setPlayer2Id(e.target.value); setPlayerResult(null); }} disabled={!p2TeamId} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400">
                                    <option value="">Select Player 2</option>
                                    {p2Players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <Button onClick={handlePlayerCompare} disabled={!player1Id || !player2Id || player1Id === player2Id}>Compare</Button>
                        </div>
                    </CrickIQCard>
                    {playerResult && (
                        <CrickIQCard>
                            <h3 className="text-h3 text-text-primary mb-4">Player Comparison</h3>
                            {(playerResult.player1.stats.matches > 0 || playerResult.player2.stats.matches > 0) && p1TeamId !== p2TeamId ? (
                                <div className="space-y-6">
                                    {playerResult.totalScore > 0 && (
                                        <div>
                                            <h4 className="text-center text-md font-bold text-text-primary mb-2">Performance Score Domination</h4>
                                            <p className="text-center text-body text-text-secondary mb-4">Based on a weighted score in head-to-head matches.</p>
                                            <ComparisonBarChart data={[playerResult.player1, playerResult.player2]} />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-center text-md font-bold text-text-primary mb-2 mt-6">Head-to-Head Stats</h4>
                                        <div className="grid grid-cols-3 items-center text-center py-2 px-2 bg-primary/50 dark:bg-black/20 rounded-t-lg">
                                            <span className="font-bold text-text-primary truncate">{playerResult.player1.name}</span>
                                            <span className="text-xs font-semibold text-text-secondary">STAT</span>
                                            <span className="font-bold text-text-primary truncate">{playerResult.player2.name}</span>
                                        </div>
                                        <div className="bg-secondary/50 dark:bg-black/10 rounded-b-lg p-2">
                                            <StatRow label="Matches" value1={playerResult.player1.stats.matches} value2={playerResult.player2.stats.matches} />
                                            
                                            {(playerResult.player1.stats.inningsBatted > 0 || playerResult.player2.stats.inningsBatted > 0) && (
                                                <>
                                                    <h5 className="text-button text-text-secondary mt-4 mb-1 pl-1 text-center">Batting</h5>
                                                    <StatRow label="Runs" value1={playerResult.player1.stats.runsScored} value2={playerResult.player2.stats.runsScored} />
                                                    <StatRow label="High Score" value1={playerResult.player1.stats.highScore} value2={playerResult.player2.stats.highScore} />
                                                    <StatRow label="Average" value1={playerResult.player1.stats.battingAverage} value2={playerResult.player2.stats.battingAverage} />
                                                    <StatRow label="Strike Rate" value1={playerResult.player1.stats.strikeRate} value2={playerResult.player2.stats.strikeRate} />
                                                    <StatRow label="50s / 100s" value1={`${playerResult.player1.stats.fifties} / ${playerResult.player1.stats.hundreds}`} value2={`${playerResult.player2.stats.fifties} / ${playerResult.player2.stats.hundreds}`} />
                                                </>
                                            )}

                                            {(playerResult.player1.stats.inningsBowled > 0 || playerResult.player2.stats.inningsBowled > 0) && (
                                                <>
                                                    <h5 className="text-button text-text-secondary mt-4 mb-1 pl-1 text-center">Bowling</h5>
                                                    <StatRow label="Wickets" value1={playerResult.player1.stats.wicketsTaken} value2={playerResult.player2.stats.wicketsTaken} />
                                                    <StatRow label="Economy" value1={playerResult.player1.stats.economyRate} value2={playerResult.player2.stats.economyRate} />
                                                    <StatRow label="Average" value1={playerResult.player1.stats.bowlingAverage} value2={playerResult.player2.stats.bowlingAverage} />
                                                    <StatRow label="Best" value1={playerResult.player1.stats.bestBowlingInnings} value2={playerResult.player2.stats.bestBowlingInnings} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-text-secondary py-4">
                                    {(p1TeamId === p2TeamId)
                                    ? "Cannot compare players from the same team."
                                    : "No head-to-head matches found."}
                                </p>
                            )}
                        </CrickIQCard>
                    )}
                </div>
            )}
        </div>
    );
};

export default Comparison;