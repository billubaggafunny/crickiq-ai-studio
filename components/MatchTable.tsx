import React from 'react';
import CrickIQCard from './CrickIQCard';
import { CalendarIcon, ShareIcon, EditIcon, TrashIcon, BallIcon, ClockIcon } from '../constants';
import type { Match, Team, Tournament } from '../types';

export interface MatchTableProps {
    list: Match[];
    title: string;
    emptyMessage: string;
    today: Date;
    getTeamById: (id: string) => Team | undefined;
    getTournamentById: (id: string) => Tournament | undefined;
    isMatchLive: boolean;
    handleShareMatch: (match: Match) => void;
    setEditingMatch: (match: Match) => void;
    handleDeleteMatch: (id: string) => void;
    onViewMatchResult: (id: string) => void;
    onContinueMatch: (match: Match) => void;
    onStartMatch: (match: Match) => void;
    setTossMatch: (match: Match) => void;
}

const formatTime = (timeString: string | undefined) => {
    if (!timeString) return '';
    const [hourString, minute] = timeString.split(':');
    const hour = +hourString % 24;
    return new Date(1970, 0, 1, hour, +minute).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true});
};

const MatchTable: React.FC<MatchTableProps> = ({
    list,
    title,
    emptyMessage,
    today,
    getTeamById,
    getTournamentById,
    isMatchLive,
    handleShareMatch,
    setEditingMatch,
    handleDeleteMatch,
    onViewMatchResult,
    onContinueMatch,
    onStartMatch,
    setTossMatch
}) => {
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);
    dayAfterTomorrow.setHours(23, 59, 59, 999);

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
                        const tournament = getTournamentById(match.tournamentId);
                        if (!team1 || !team2) return null;

                        const arePlayerCountsEqual = team1.players.length === team2.players.length;
                        const playerMismatchTitle = `Teams must have same number of players (${team1.players.length} vs ${team2.players.length})`;
                        
                        let statusDisplay = '';
                        if (match.wasAbandoned) statusDisplay = 'Abandoned';
                        else if (match.status === 'live') statusDisplay = 'Live';
                        else if (match.status === 'completed') statusDisplay = 'Finished';
                        else if (match.isDraft) statusDisplay = 'Upcoming';
                        else {
                            const matchDateObj = new Date(match.date.replace(/-/g, '/'));
                            matchDateObj.setHours(0, 0, 0, 0);
                            const todayStart = new Date(today);
                            todayStart.setHours(0, 0, 0, 0);

                            if (matchDateObj < todayStart) statusDisplay = 'Scheduled'; // Past scheduled, treat as scheduled
                            else if (matchDateObj > dayAfterTomorrow) statusDisplay = 'Coming Soon';
                            else statusDisplay = 'Scheduled';
                        }

                        return (
                            <CrickIQCard key={match.id} className="flex flex-col space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className="h-5 flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-2xl flex items-center gap-1">
                                            {statusDisplay}
                                        </span>
                                        {/* Keep existing status indicators like LIVE, Group, etc. */}
                                        {match.status === 'live' && (
                                            <span className="text-[10px] font-bold text-danger bg-danger/20 dark:bg-red-900/30 px-2 py-0.5 rounded-2xl flex items-center gap-1 animate-pulse">
                                                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-2xl h-1.5 w-1.5 bg-danger/100"></span></span>
                                                LIVE
                                            </span>
                                        )}
                                        {match.groupId && (
                                            <span className="text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded-2xl uppercase">Group {match.groupId.toUpperCase()}</span>
                                        )}
                                        {tournament?.format && !match.knockoutType && !match.groupId && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-2xl uppercase ${
                                                tournament.format === 'Round Robin' ? 'text-brand-blue bg-brand-blue/20 dark:bg-blue-900/30' : 
                                                tournament.format === 'Knockout' ? 'text-brand-lavender bg-brand-lavender/20 dark:bg-brand-lavender/30' : ''
                                            }`}>{tournament.format}</span>
                                        )}
                                        {match.knockoutType === 'final' && (
                                            <span className="text-[10px] font-bold text-warning bg-warning/20 dark:bg-warning/20 px-2 py-0.5 rounded-2xl uppercase">Final</span>
                                        )}
                                        {match.knockoutType === 'semifinal' && (
                                            <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/20 dark:bg-blue-900/30 px-2 py-0.5 rounded-2xl uppercase">Semifinal</span>
                                        )}
                                    </div>
                                    <div className="flex items-center -mt-1 -mr-1">
                                        <button onClick={() => handleShareMatch(match)} className="p-1.5 rounded-full text-text-secondary hover:bg-primary transition-colors" title="Share Match"><ShareIcon className="w-4 h-4" /></button>
                                        {match.status === 'scheduled' && (
                                            <button onClick={() => setEditingMatch(match)} disabled={isMatchLive} className="p-1.5 rounded-full text-text-secondary hover:bg-primary transition-colors disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed" title={isMatchLive ? "Cannot edit while a match is live" : "Edit Match"}><EditIcon className="w-4 h-4" /></button>
                                        )}
                                        <button onClick={() => handleDeleteMatch(match.id)} disabled={isMatchLive} className="p-1.5 rounded-full text-text-secondary hover:text-highlight hover:bg-highlight/10 transition-colors disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed" title={isMatchLive ? "Cannot delete while a match is live" : "Delete Match"}><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
    
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center -mt-2">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-12 h-12 flex items-center justify-center rounded-lg text-white text-h2 shadow-md" style={{ backgroundColor: team1.logo }}>{team1.name.substring(0, 3).toUpperCase()}</div>
                                        <h3 className="text-base font-bold text-text-primary truncate w-full">{team1.name}</h3>
                                    </div>
                                    <span className="text-lg text-text-secondary">VS</span>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-12 h-12 flex items-center justify-center rounded-lg text-white text-h2 shadow-md" style={{ backgroundColor: team2.logo }}>{team2.name.substring(0, 3).toUpperCase()}</div>
                                        <h3 className="text-base font-bold text-text-primary truncate w-full">{team2.name}</h3>
                                    </div>
                                </div>
    
                                <div className="space-y-2 pt-2 border-t border-brand-blue/15">
                                    {!arePlayerCountsEqual && ( <div className="text-center text-highlight font-semibold text-[10px] p-1 bg-highlight/10 rounded-md">Unequal players ({team1.players.length} vs {team2.players.length})</div>)}
                                    <div className="flex justify-around items-center text-[11px] text-text-secondary">
                                        <div className="flex items-center gap-1.5"><CalendarIcon className="w-3 h-3" /> <span className="font-semibold">{new Date(match.date.replace(/-/g, '/')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>
                                        <div className="flex items-center gap-1.5"><ClockIcon className="w-3 h-3" /> <span className="font-semibold">{formatTime(match.time)}</span></div>
                                        <div className="flex items-center gap-1.5"><BallIcon className="w-3 h-3" /> <span className="font-semibold">{match.oversPerInnings} Overs</span></div>
                                    </div>
                                </div>
                                
                                <div className="text-center pt-2">
                                    {match.status === 'completed' ? (
                                        <button onClick={() => onViewMatchResult(match.id)} className="w-full px-4 py-4 text-body rounded-2xl font-bold bg-brand-gradient text-white shadow-md transform hover:-translate-y-0.5 transition-transform">
                                            View Scorecard
                                        </button>
                                    ) : match.status === 'live' ? (
                                        <button onClick={() => onContinueMatch(match)} className="w-full px-4 py-4 text-body rounded-2xl font-bold bg-brand-gradient text-white shadow-md transform hover:-translate-y-0.5 transition-transform">Continue Live Match</button>
                                    ) : match.isDraft ? (
                                        <button onClick={() => setEditingMatch(match)} className="w-full px-4 py-4 text-body rounded-2xl font-bold bg-brand-gradient text-white shadow-md transform hover:-translate-y-0.5 transition-transform">Setup Teams</button>
                                    ) : match.toss ? (
                                        <>
                                            <p className="text-[10px] text-text-secondary mb-1">{getTeamById(match.toss.winner)?.name} won toss & chose to {match.toss.decision}</p>
                                            <button disabled={isMatchLive || !arePlayerCountsEqual} onClick={() => onStartMatch(match)} className="w-full px-8 py-4 rounded-2xl font-bold text-h3 bg-brand-gradient text-white shadow-lg disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 transform hover:-translate-y-0.5 transition-transform" title={!arePlayerCountsEqual ? playerMismatchTitle : (isMatchLive ? 'Another match is live' : 'Start Match')}>{isMatchLive ? 'Match Live' : (arePlayerCountsEqual ? 'Start Match' : 'Unequal Players')}</button>
                                        </>
                                    ) : (
                                        <button disabled={isMatchLive || !arePlayerCountsEqual} onClick={() => setTossMatch(match)} className="w-full px-4 py-4 text-body rounded-2xl font-bold bg-brand-gradient text-white shadow-md disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 transform hover:-translate-y-0.5 transition-transform" title={!arePlayerCountsEqual ? playerMismatchTitle : (isMatchLive ? 'Another match is live' : 'Set Toss')}>{isMatchLive ? 'Match Live' : (arePlayerCountsEqual ? 'Set Toss' : 'Unequal Players')}</button>
                                    )}
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
