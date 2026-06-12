import React from 'react';
import type { Match, Team, Tournament } from '../../types';

interface ScoreHeroProps {
    match: Match;
    tournament: Tournament;
    teams: Team[];
}

export default function ScoreHero({ match, tournament, teams }: ScoreHeroProps) {
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);
    
    if (!team1 || !team2) return null;

    const getStatusBadgeClass = () => {
        switch (match.status) {
            case 'completed': return 'bg-emerald-500 text-white';
            case 'live': return 'bg-amber-500 text-white animate-pulse';
            case 'abandoned': return 'bg-red-500 text-white';
            default: return 'bg-sky-400 text-white';
        }
    };

    const winnerMessage = match.winnerId && match.winnerId !== 'draw' 
        ? `${teams.find(t => t.id === match.winnerId)?.name} won` 
        : "Match Drawn";

    return (
        <div className="bg-white dark:bg-[#07111F] p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-[#26364F]">
            {/* Tournament Header */}
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-800 dark:text-[#F8FAFC] uppercase tracking-wider">{tournament.name}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getStatusBadgeClass()}`}>{match.status === 'completed' ? 'FINAL' : match.status}</span>
            </div>
            <p className="text-gray-500 dark:text-[#CBD5E1] text-[10px] uppercase tracking-widest font-medium mb-2">{tournament.venue} • {match.date}</p>
            
            {/* Result Badge */}
            <div className="text-center mb-2">
                <div className="bg-[#ACD1FD] dark:bg-[rgba(0,196,154,0.15)] inline-block px-4 py-0.5 rounded-full text-[#10367D] dark:text-[#00C49A] border-transparent dark:border dark:border-[#00C49A] font-bold text-[10px] tracking-wide shadow-sm">
                    {winnerMessage}
                </div>
            </div>

            {/* Score Comparison Panel */}
            <div className="bg-gradient-to-b from-[#10367D] to-[#1A4A9A] dark:bg-none dark:bg-[#162338] dark:border dark:border-[#26364F] p-4 rounded-xl mb-3 shadow-inner">
                <div className="flex justify-between items-center">
                    <div className="text-left flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1 mb-1">
                             <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#74B4D9] to-[#ACD1FD] dark:bg-none dark:bg-[#0F1B2D] text-[#10367D] dark:text-[#00C49A] font-extrabold text-xl shadow-lg border-2 border-white/20 dark:border-[#00C49A]">
                                {team1.name.substring(0, 2).toUpperCase()}
                            </div>
                            <p className="font-semibold text-white dark:text-[#F8FAFC] text-xs leading-tight text-center truncate w-full">{team1.name}</p>
                        </div>
                        <p className="text-2xl font-bold text-white dark:text-[#F8FAFC] text-center">{match.innings1?.score}/{match.innings1?.wickets}</p>
                        <p className="text-xs text-[#DBDBE5] dark:text-[#CBD5E1] text-center">{match.innings1?.overs} Overs</p>
                    </div>
                
                    <div className="px-2 font-black text-[#10367D] dark:text-[#00C49A] text-sm bg-[#ACD1FD] dark:bg-[rgba(0,196,154,0.15)] border border-transparent dark:border-[#00C49A] rounded-full w-8 h-8 flex items-center justify-center shadow-lg">VS</div>
                
                    <div className="text-right flex-1 min-w-0">
                        <div className="flex flex-col items-center gap-1 mb-1">
                            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#74B4D9] to-[#ACD1FD] dark:bg-none dark:bg-[#0F1B2D] text-[#10367D] dark:text-[#00C49A] font-extrabold text-xl shadow-lg border-2 border-white/20 dark:border-[#00C49A]">
                                {team2.name.substring(0, 2).toUpperCase()}
                            </div>
                            <p className="font-semibold text-white dark:text-[#F8FAFC] text-xs leading-tight text-center truncate w-full">{team2.name}</p>
                        </div>
                        <p className="text-2xl font-bold text-white dark:text-[#F8FAFC] text-center">{match.innings2?.score}/{match.innings2?.wickets}</p>
                        <p className="text-xs text-[#DBDBE5] dark:text-[#CBD5E1] text-center">{match.innings2?.overs} Overs</p>
                    </div>
                </div>
            </div>

            {/* Footer Information Row */}
            <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-700 dark:text-[#CBD5E1]">
                    <span className="text-[#10367D] dark:text-[#00C49A] font-bold mr-1">•</span>
                    <span className="text-[#64748B] dark:text-[#CBD5E1] font-medium mr-1.5 ">Toss:</span>
                    <span className="font-semibold text-[#21222D] dark:text-[#F8FAFC]">{teams.find(t => t.id === match.toss?.winner)?.name} elected to {match.toss?.decision}</span>
                </p>
                <p className="text-xs text-gray-700 dark:text-[#CBD5E1]">
                    <span className="text-[#10367D] dark:text-[#00C49A] font-bold mr-1">•</span>
                    <span className="text-[#64748B] dark:text-[#CBD5E1] font-medium mr-1.5 ">Player of the Match:</span>
                    <span className="font-semibold text-[#21222D] dark:text-[#F8FAFC]">{match.manOfTheMatchId ? teams.flatMap(t => t.players).find(p => p.id === match.manOfTheMatchId)?.name : 'TBD'}</span>
                </p>
            </div>
        </div>
    );
}
