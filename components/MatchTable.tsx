import React from 'react';
import CrickIQCard from './CrickIQCard';
import { CalendarIcon } from '../constants';
import type { Match, Team, Tournament } from '../types';

export interface MatchTableProps {
    list: Match[];
    title: string;
    emptyMessage: string;
    today: Date;
    getTeamById: (id: string) => Team | undefined;
    getTournamentById: (id: string) => Tournament | undefined;
    isMatchLive: boolean;
    setEditingMatch: (match: Match) => void;
    onViewMatchResult: (id: string) => void;
    onContinueMatch: (match: Match) => void;
    onStartMatch: (match: Match) => void;
    setTossMatch: (match: Match) => void;
    onOpenMatchHub?: (matchId: string, returnLocation?: Record<string, unknown>) => void;
}

const MatchTable: React.FC<MatchTableProps> = ({
    list,
    title,
    emptyMessage,
    today,
    getTeamById,
    getTournamentById,
    isMatchLive,
    setEditingMatch,
    onViewMatchResult,
    onContinueMatch,
    onStartMatch,
    setTossMatch,
    onOpenMatchHub
}) => {
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    dayAfterTomorrow.setHours(23, 59, 59, 999);

    const getMatchDisplayState = (match: Match) => {
        const matchDateObj = new Date(match.date.replace(/-/g, '/'));
        matchDateObj.setHours(0, 0, 0, 0);
        const todayNoTime = new Date(today);
        todayNoTime.setHours(0, 0, 0, 0);
        
        const isToday = matchDateObj.getTime() === todayNoTime.getTime();
        const isFuture = matchDateObj.getTime() > todayNoTime.getTime();

        if (match.status === 'completed') return { type: 'completed', label: match.winnerId === 'draw' ? 'Match Drawn / Tied' : 'Completed' };
        if (match.wasAbandoned) return { type: 'abandoned', label: 'Abandoned' };
        if (match.status === 'live') return { type: 'live', label: 'Live Match' };
        if (match.isDraft) return { type: 'draft', label: 'Setup Pending' };
        
        if (isToday) {
            if (!match.toss) return { type: 'readyToToss', label: 'Ready for Toss' };
            return { type: 'readyToStart', label: 'Ready to Start' };
        }
        
        if (isFuture) return { type: 'upcoming', label: 'Upcoming Match' };
        
        return { type: 'pastUnplayed', label: 'Not Started' };
    };

    return (
        <div className="space-y-6">
            <h3 className="text-h3 text-text-primary flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {title}
            </h3>
            {list.length === 0 ? (
                <CrickIQCard  className="text-center">
                    <p className="text-text-secondary">{emptyMessage}</p>
                </CrickIQCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {list.map(match => {
                        const team1 = getTeamById(match.team1Id);
                        const team2 = getTeamById(match.team2Id);
                        const tournament = getTournamentById(match.tournamentId || '');
                        if (!team1 || !team2) return null;

                        const arePlayerCountsEqual = team1.players.length === team2.players.length;
                        const playerMismatchTitle = `Teams must have same number of players (${team1.players.length} vs ${team2.players.length})`;
                        
                        const displayState = getMatchDisplayState(match);

                        return (
                            <CrickIQCard 
                                key={match.id}
                                accentColor={team1.logo}
                                className="flex flex-col p-0 overflow-hidden shadow-sm hover:shadow-md bg-white rounded-xl transition-all duration-300"
                            >
                                <div 
                                    className="p-5 cursor-pointer hover:bg-gray-50 flex-grow" 
                                    onClick={() => {
                                        if (displayState.type === 'draft') {
                                            setEditingMatch(match);
                                        } else {
                                            onOpenMatchHub?.(match.id);
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-[10px] uppercase text-gray-600 tracking-wider">
                                            {displayState.label}
                                        </span>
                                        <span className="text-sm font-medium text-gray-500">
                                            {match.oversPerInnings} Overs
                                        </span>
                                    </div>
                                    <div className="text-gray-500 text-xs text-center -mt-3 mb-3">
                                        {new Date(match.date).toLocaleDateString()} {match.time ? `• ${match.time}` : ''}
                                    </div>
                                    
                                    <h3 className="text-center font-bold text-gray-900 text-lg mb-4">
                                        {team1.name} vs {team2.name}
                                    </h3>
                                    
                                    {tournament && (
                                        <div className="text-center text-xs font-semibold text-brand-blue mb-4">
                                            {tournament.name} • {match.knockoutType ? (match.knockoutType === 'semifinal' ? 'Semi Final' : 'Final') : match.groupId ? `Group ${match.groupId.toUpperCase()}` : 'League Match'}
                                        </div>
                                    )}
                                    {!tournament && !match.isDraft && (
                                        <div className="text-center text-xs font-medium text-gray-400 mb-4 uppercase tracking-wider">
                                            Quick Match
                                        </div>
                                    )}
                                    
                                    {displayState.type === 'live' ? (
                                        <div className="flex justify-center mb-4">
                                            <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                                                <span className="flex h-2 w-2 rounded-full bg-red-500"></span>
                                                LIVE
                                            </span>
                                        </div>
                                    ) : match.toss ? (
                                        <p className="text-sm text-center text-gray-600 mb-4 px-2">
                                            {getTeamById(match.toss.winner)?.name} won the toss and chose to {match.toss.decision}.
                                        </p>
                                    ) : null}
                                    
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between items-center text-gray-900 font-bold">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-xs" style={{ backgroundColor: team1.logo }}>
                                                    {team1.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-base">{team1.name}</span>
                                            </div>
                                            <span className="font-mono text-base">
                                                {(match.status !== 'scheduled' && !match.isDraft) ? `${team1.id === match.innings1?.battingTeamId ? (match.innings1?.score ?? 0) : (match.innings2?.score ?? 0)}/${team1.id === match.innings1?.battingTeamId ? (match.innings1?.wickets ?? 0) : (match.innings2?.wickets ?? 0)}` : 'DNB'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-gray-900 font-bold">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-xs" style={{ backgroundColor: team2.logo }}>
                                                    {team2.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-base">{team2.name}</span>
                                            </div>
                                            <span className="font-mono text-base">
                                                {(match.status !== 'scheduled' && !match.isDraft) ? `${team2.id === match.innings1?.battingTeamId ? (match.innings1?.score ?? 0) : (match.innings2?.score ?? 0)}/${team2.id === match.innings1?.battingTeamId ? (match.innings1?.wickets ?? 0) : (match.innings2?.wickets ?? 0)}` : 'DNB'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 text-center text-md font-bold text-gray-900 pt-3 border-t border-gray-100 uppercase tracking-wider">
                                        {displayState.type === 'completed' ? (
                                            <div className="text-center text-sm font-semibold text-gray-900">
                                                <p className="font-bold">{getTeamById(match.winnerId)?.name} won</p>
                                                {match.manOfTheMatchId && (
                                                    <p className="text-xs text-gray-500 mt-1 normal-case">MOM: {getTeamById(match.team1Id)?.players.find(p => p.id === match.manOfTheMatchId)?.name || getTeamById(match.team2Id)?.players.find(p => p.id === match.manOfTheMatchId)?.name}</p>
                                                )}
                                            </div>
                                        ) : displayState.type === 'abandoned' ? 'Match Abandoned' : displayState.label}
                                    </div>
                                    
                                    <div className="mt-4">
                                        {displayState.type === 'completed' ? (
                                            <button onClick={(e) => { e.stopPropagation(); onViewMatchResult(match.id); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200">
                                                View Scorecard
                                            </button>
                                        ) : displayState.type === 'live' ? (
                                            <button onClick={(e) => { e.stopPropagation(); onContinueMatch(match); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md">Continue Live Match</button>
                                        ) : displayState.type === 'draft' ? (
                                            <button onClick={(e) => { e.stopPropagation(); setEditingMatch(match); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md">Setup Teams</button>
                                        ) : displayState.type === 'readyToToss' ? (
                                            <button disabled={isMatchLive || !arePlayerCountsEqual} onClick={(e) => { e.stopPropagation(); setTossMatch(match); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md disabled:bg-gray-300" title={!arePlayerCountsEqual ? playerMismatchTitle : (isMatchLive ? 'Another match is live' : 'Set Toss')}>{isMatchLive ? 'Match Live' : (arePlayerCountsEqual ? 'Set Toss' : 'Unequal Players')}</button>
                                        ) : displayState.type === 'readyToStart' ? (
                                            <button onClick={(e) => { e.stopPropagation(); onStartMatch(match); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md">Start Match</button>
                                        ) : null}
                                    </div>
                                </div>
                            </CrickIQCard>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default MatchTable;
