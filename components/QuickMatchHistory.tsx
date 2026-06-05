import CrickIQCard from './CrickIQCard';
import React from 'react';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { Match, Team } from '../types';
import { getMaxPlayers } from '../utils/matchConfig';




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

    const getWinnerMessage = (match: Match): { message: string, winnerTeam: Team | null | 'draw' } => {
        if (match.wasAbandoned) return { message: 'Match Abandoned', winnerTeam: null };
        if (match.isDraft) return { message: 'Setup Pending', winnerTeam: 'draw' };
        if (match.status !== 'completed') {
            if (match.status === 'live') return { message: 'Match Live', winnerTeam: null };
            if (match.status === 'readyToToss') return { message: 'Ready for Toss', winnerTeam: null };
            if (match.status === 'readyToStart') return { message: 'Ready to Start', winnerTeam: null };
            return { message: 'Upcoming', winnerTeam: null };
        }
        
        const winner = match.winnerId && match.winnerId !== 'draw' ? getTeamById(match.winnerId) : null;
        if (!winner) return { message: 'Match Drawn / Tied', winnerTeam: 'draw' };
    
        if (match.innings2 && winner.id === match.innings2.battingTeamId) {
            const battingTeam = getTeamById(match.innings2.battingTeamId);
            const maxPlayers = getMaxPlayers(match);
            const totalPlayers = battingTeam?.players?.length > 0 ? battingTeam.players.length : maxPlayers;
            const wicketsLeft = totalPlayers - 1 - (match.innings2.wickets || 0);
            return { message: `${winner.name} won by ${wicketsLeft} wickets`, winnerTeam: winner };
        } else if (match.innings1 && winner.id === match.innings1.battingTeamId) {
            const runMargin = (match.innings1.score || 0) - (match.innings2?.score || 0);
            return { message: `${winner.name} won by ${runMargin} runs`, winnerTeam: winner };
        }
        return { message: `${winner.name} won`, winnerTeam: winner };
    };

    if (allQuickMatches.length === 0) {
        return (
             <CrickIQCard>
                <p className="text-text-secondary text-center">No quick matches yet.</p>
             </CrickIQCard>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-h3 text-text-primary">Match History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allQuickMatches.map((match) => {
                    const team1 = getTeamById(match.team1Id);
                    const team2 = getTeamById(match.team2Id);
                    if (!team1 || !team2) return null;

                    const { message, winnerTeam } = getWinnerMessage(match);
                    const team1Score = match.innings1?.battingTeamId === team1.id ? match.innings1 : match.innings2;
                    const team2Score = match.innings1?.battingTeamId === team2.id ? match.innings1 : match.innings2;
                    
                    const isWinner = (team: Team) => winnerTeam !== 'draw' && winnerTeam?.id === team.id;
                    

                    return (
                    <CrickIQCard 
                            key={match.id}
                            accentColor={team1.logo}
                            className="flex flex-col p-0 overflow-hidden shadow-sm hover:shadow-md bg-white rounded-xl transition-all duration-300"
                        >
                            <div 
                                onClick={() => {
                                    if (match.status === 'draft' || match.isDraft) {
                                        setQuickMatchSetupId(match.id);
                                    } else {
                                        if (onOpenMatchHub) {
                                            onOpenMatchHub(match.id);
                                        } else {
                                            onViewResult(match.id);
                                        }
                                    }
                                }}
                                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex-grow"
                            >
                                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span>{new Date(match.date).toLocaleDateString()} {match.time ? `• ${match.time}` : ''}</span>
                                        {match.rivalryMatchNumber !== undefined && match.rivalryMatchNumber !== null && (
                                            <span className="bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                                                Match - {match.rivalryMatchNumber}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-medium">{match.oversPerInnings} Overs</span>
                                </div>
                                
                                {match.isDraft ? (
                                    <div className="flex flex-col items-center py-4 gap-3">
                                        <div className="text-center font-bold text-gray-500 text-lg">Setup Pending</div>
                                        <div className="flex items-center gap-2 font-bold text-md text-gray-900">
                                            <span>{team1.name}</span>
                                            <span className="text-gray-400">vs</span>
                                            <span>{team2.name}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setQuickMatchSetupId(match.id); }}
                                            className="w-full mt-2 px-4 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-md hover:bg-brand-blue/90"
                                        >
                                            Resume Setup
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {match.toss && (
                                            <p className="text-sm text-center text-gray-600 mb-4">
                                                {getTeamById(match.toss.winner)?.name} won the toss and chose to {match.toss.decision}.
                                            </p>
                                        )}
                                        <div className="space-y-3">
                                            <div className={`flex justify-between items-center ${isWinner(team1) ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                                                <div className="flex items-center gap-3 font-semibold">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team1.logo }}>
                                                        {team1.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-base">{team1.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-base">{team1Score ? `${team1Score.score}/${team1Score.wickets} (${team1Score.overs})` : 'DNB'}</span>
                                            </div>
                                            <div className={`flex justify-between items-center ${isWinner(team2) ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                                                <div className="flex items-center gap-3 font-semibold">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team2.logo }}>
                                                        {team2.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-base">{team2.name}</span>
                                                </div>
                                                <span className="font-mono font-bold text-base">{team2Score ? `${team2Score.score}/${team2Score.wickets} (${team2Score.overs})` : 'DNB'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 text-center text-md font-bold text-gray-900 pt-2 border-t border-gray-100">
                                            {message}
                                        </div>
                                        <div className="mt-4">
                                            {(match.status === 'completed' || match.wasAbandoned) ? (
                                                <button onClick={(e) => { e.stopPropagation(); onViewResult(match.id); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200">
                                                    View Scorecard
                                                </button>
                                            ) : (
                                                <button onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    if (onOpenMatchHub) onOpenMatchHub(match.id); 
                                                    else onViewResult(match.id);
                                                }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md">
                                                    {match.status === 'live' ? 'Continue Live Match' : match.status === 'readyToStart' || match.status === 'readyToToss' ? 'Match Center' : 'View Details'}
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