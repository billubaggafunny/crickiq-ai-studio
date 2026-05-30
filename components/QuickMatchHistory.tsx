import CrickIQCard from './CrickIQCard';
import React from 'react';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { Match, Team } from '../types';




interface QuickMatchHistoryProps extends UseCrickIQStateReturn {
    onViewResult: (matchId: string) => void;
}

const QuickMatchHistory: React.FC<QuickMatchHistoryProps> = ({ matches, getTeamById, onViewResult }) => {
    
    const completedMatches = matches
        .filter(m => m.isQuickMatch && m.status === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getWinnerMessage = (match: Match): { message: string, winnerTeam: Team | null | 'draw' } => {
        if (match.wasAbandoned) return { message: 'Match Abandoned', winnerTeam: null };
        const winner = match.winnerId && match.winnerId !== 'draw' ? getTeamById(match.winnerId) : null;
        if (!winner) return { message: 'Match Drawn', winnerTeam: 'draw' };
    
        if (match.innings2 && winner.id === match.innings2.battingTeamId) {
            const battingTeam = getTeamById(match.innings2.battingTeamId);
            const wicketsLeft = (battingTeam?.players.length || 11) - 1 - (match.innings2.wickets || 0);
            return { message: `${winner.name} won by ${wicketsLeft} wickets`, winnerTeam: winner };
        } else if (match.innings1 && winner.id === match.innings1.battingTeamId) {
            const runMargin = (match.innings1.score || 0) - (match.innings2?.score || 0);
            return { message: `${winner.name} won by ${runMargin} runs`, winnerTeam: winner };
        }
        return { message: `${winner.name} won`, winnerTeam: winner };
    };

    if (completedMatches.length === 0) {
        return (
             <CrickIQCard>
                <p className="text-text-secondary text-center">No completed quick matches yet.</p>
             </CrickIQCard>
        )
    }

    return (
        <div className="space-y-4">
            <h3 className="text-h3 text-text-primary">Match History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedMatches.map((match) => {
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
                            className={`flex flex-col p-0 overflow-hidden hover:shadow-xl transition-all duration-300 group `}
                        >
                            <div 
                                onClick={() => onViewResult(match.id)}
                                className="p-4 cursor-pointer hover:bg-black/10 transition-colors flex-grow"
                            >
                                <div className="flex justify-between items-center text-caption text-text-secondary mb-2">
                                    <span>{new Date(match.date).toLocaleDateString()}</span>
                                    <span>{match.oversPerInnings} Overs</span>
                                </div>
                                {match.toss && (
                                    <p className="text-caption text-center text-text-secondary mb-1">
                                        {getTeamById(match.toss.winner)?.name} won the toss and chose to {match.toss.decision}.
                                    </p>
                                )}
                                <div className="space-y-1">
                                    <div className={`flex justify-between items-center py-1.5 px-2 rounded-lg transition-colors ${isWinner(team1) ? 'bg-brand-blue/10 text-brand-blue font-bold' : 'bg-black/5 dark:bg-white/5'}`}>
                                        <div className="flex items-center gap-2 font-bold">
                                            <div className="w-6 h-6 flex items-center justify-center rounded-md text-button text-white text-caption" style={{ backgroundColor: team1.logo }}>
                                                {team1.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm">{team1.name}</span>
                                        </div>
                                        <span className="font-mono font-bold">{team1Score ? `${team1Score.score}/${team1Score.wickets} (${team1Score.overs})` : 'DNB'}</span>
                                    </div>
                                     <div className={`flex justify-between items-center py-1.5 px-2 rounded-lg transition-colors ${isWinner(team2) ? 'bg-brand-blue/10 text-brand-blue font-bold' : 'bg-black/5 dark:bg-white/5'}`}>
                                        <div className="flex items-center gap-2 font-bold">
                                            <div className="w-6 h-6 flex items-center justify-center rounded-md text-button text-white text-caption" style={{ backgroundColor: team2.logo }}>
                                                {team2.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm">{team2.name}</span>
                                        </div>
                                        <span className="font-mono font-bold">{team2Score ? `${team2Score.score}/${team2Score.wickets} (${team2Score.overs})` : 'DNB'}</span>
                                    </div>
                                </div>
                                <div className="mt-2 text-center text-body font-semibold py-1.5 px-2 rounded-lg bg-black/5 dark:bg-white/5">
                                    {message}
                                </div>
                            </div>
                        </CrickIQCard>
                    )
                })}
            </div>
        </div>
    );
};

export default QuickMatchHistory;