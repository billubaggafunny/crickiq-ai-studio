import CrickIQCard from './CrickIQCard';
import React from 'react';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { Team } from '../types';
import { formatScore } from '../utils/scoreFormatters';
import { getMatchResultLabel } from '../utils/resultFormatters';

interface QuickMatchHistoryProps extends UseCrickIQStateReturn {
    onViewResult: (matchId: string) => void;
    onRematch?: (matchId: string) => void;
    setQuickMatchSetupId: (id: string | null) => void;
    onOpenMatchHub?: (matchId: string, returnLocation?: Record<string, unknown>) => void;
}

const QuickMatchHistory: React.FC<QuickMatchHistoryProps> = ({ matches, getTeamById, onViewResult, setQuickMatchSetupId, onOpenMatchHub }) => {
    
    const allQuickMatches = matches
        .filter(m => m.isQuickMatch)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (allQuickMatches.length === 0) {
        return (
             <CrickIQCard>
                <p className="text-text-secondary text-center">No quick matches yet.</p>
             </CrickIQCard>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary">Match History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allQuickMatches.map((match) => {
                    const team1 = getTeamById(match.team1Id);
                    const team2 = getTeamById(match.team2Id);
                    if (!team1 || !team2) return null;

                    const { message, winnerTeam } = getMatchResultLabel(match, getTeamById);
                    const team1Score = match.innings1?.battingTeamId === team1.id ? match.innings1 : match.innings2;
                    const team2Score = match.innings1?.battingTeamId === team2.id ? match.innings1 : match.innings2;
                    
                    const isWinner = (team: Team) => winnerTeam !== 'draw' && winnerTeam?.id === team.id;
                    
                    const getStatusBadge = () => {
                        if (match.wasAbandoned) return <span className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30">Abandoned</span>;
                        if (match.isDraft || (match.status as string) === 'draft') return <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-100 dark:border-amber-900/30">Draft</span>;
                        if (match.status === 'live') return (
                            <span className="flex items-center gap-1.5 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span>
                                LIVE
                            </span>
                        );
                        if (match.status === 'completed') return <span className="bg-black/5 dark:bg-white/10 text-text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Completed</span>;
                        if ((match.status as string) === 'readyToToss') return <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Toss</span>;
                        if ((match.status as string) === 'readyToStart') return <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Ready</span>;
                        return <span className="bg-black/5 dark:bg-white/10 text-text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Upcoming</span>;
                    };

                    const getTeamTextStyle = (team: Team) => {
                        if (match.status !== 'completed' && !match.wasAbandoned) return 'text-text-primary';
                        if (winnerTeam === 'draw') return 'text-text-primary';
                        return isWinner(team) ? 'text-text-primary' : 'text-text-secondary';
                    };

                    return (
                    <CrickIQCard 
                            key={match.id}
                            accentColor={team1.logo}
                            className="flex flex-col p-0 overflow-hidden shadow-sm hover:shadow-md bg-secondary rounded-3xl transition-all duration-300"
                        >
                            <div 
                                onClick={() => {
                                    if ((match.status as string) === 'draft' || match.isDraft) {
                                        setQuickMatchSetupId(match.id);
                                    } else {
                                        if (onOpenMatchHub) {
                                            onOpenMatchHub(match.id);
                                        } else {
                                            onViewResult(match.id);
                                        }
                                    }
                                }}
                                className="p-5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-grow"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {getStatusBadge()}
                                            {match.rivalryMatchNumber !== undefined && match.rivalryMatchNumber !== null && (
                                                <span className="bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                                                    Match - {match.rivalryMatchNumber}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                                                {match.oversPerInnings} Overs
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-text-secondary uppercase tracking-wider">
                                            {new Date(match.date).toLocaleDateString()} {match.time ? `• ${match.time}` : ''}
                                        </span>
                                    </div>
                                </div>
                                
                                {match.isDraft ? (
                                    <div className="flex flex-col items-center py-6 gap-3">
                                        <div className="text-center font-bold text-text-secondary text-sm uppercase tracking-wider">Setup Pending</div>
                                        <div className="flex flex-col w-full px-4 gap-2">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team1.logo }}>
                                                    {team1.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm md:text-base font-semibold truncate text-text-primary">{team1.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3 overflow-hidden mt-1">
                                                <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team2.logo }}>
                                                    {team2.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-sm md:text-base font-semibold truncate text-text-primary">{team2.name}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setQuickMatchSetupId(match.id); }}
                                            className="w-full mt-4 px-4 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-md hover:bg-brand-blue/90"
                                        >
                                            Resume Setup
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2">
                                                    <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team1.logo }}>
                                                        {team1.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className={`text-sm md:text-base font-semibold truncate ${getTeamTextStyle(team1)}`}>{team1.name}</span>
                                                </div>
                                                <div className="flex items-baseline gap-1.5 shrink-0">
                                                    {team1Score ? (
                                                        <>
                                                            <span className={`font-mono font-bold text-lg md:text-xl ${getTeamTextStyle(team1)}`}>
                                                                {formatScore(team1Score.score, team1Score.wickets)}
                                                            </span>
                                                            <span className="font-mono text-xs text-text-secondary">
                                                                ({team1Score.overs})
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2">
                                                    <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team2.logo }}>
                                                        {team2.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className={`text-sm md:text-base font-semibold truncate ${getTeamTextStyle(team2)}`}>{team2.name}</span>
                                                </div>
                                                <div className="flex items-baseline gap-1.5 shrink-0">
                                                    {team2Score ? (
                                                        <>
                                                            <span className={`font-mono font-bold text-lg md:text-xl ${getTeamTextStyle(team2)}`}>
                                                                {formatScore(team2Score.score, team2Score.wickets)}
                                                            </span>
                                                            <span className="font-mono text-xs text-text-secondary">
                                                                ({team2Score.overs})
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {match.toss && (
                                            <p className="text-xs text-text-secondary mt-4 uppercase tracking-wider">
                                                {getTeamById(match.toss.winner)?.name} won the toss and chose to {match.toss.decision}
                                            </p>
                                        )}
                                        <div className="mt-4 text-sm font-medium text-brand-blue dark:text-text-primary">
                                            {message}
                                        </div>
                                        <div className="mt-5">
                                            {(match.status === 'completed' || match.wasAbandoned) ? (
                                                <button onClick={(e) => { e.stopPropagation(); onViewResult(match.id); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-tertiary text-text-primary shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                    View Scorecard
                                                </button>
                                            ) : (
                                                <button onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (onOpenMatchHub) onOpenMatchHub(match.id); 
                                                    else onViewResult(match.id);
                                                }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md hover:bg-brand-blue/90 transition-colors">
                                                    {match.status === 'live' ? 'Continue Live Match' : (match.status as string) === 'readyToStart' || (match.status as string) === 'readyToToss' ? 'Match Center' : 'View Details'}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </CrickIQCard>
                    )
                })}
            </div>
        </div>
    );
};

export default QuickMatchHistory;