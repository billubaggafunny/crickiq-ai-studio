import React from 'react';
import CrickIQCard from './CrickIQCard';
import { CalendarIcon } from '../constants';
import type { Match, Team, Tournament } from '../types';
import { getRequiredSquadSize } from '../utils/matchConfig';
import { canEnableSetToss } from '../utils/validation';
import { formatScore } from '../utils/scoreFormatters';

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
 handleDeleteMatch?: (id: string) => void;
 focusTeamId?: string;
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
 onOpenMatchHub,
 handleDeleteMatch,
 focusTeamId
}) => {
 const [matchToDelete, setMatchToDelete] = React.useState<Match | null>(null);
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
 <h3 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">
 <CalendarIcon className="w-5 h-5" />
 {title}
 </h3>
 {list.length === 0 ? (
 <CrickIQCard className="text-center">
 <p className="text-text-secondary">{emptyMessage}</p>
 </CrickIQCard>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {list.map(match => {
 const team1 = getTeamById(match.team1Id);
 const team2 = getTeamById(match.team2Id);
 const tournament = getTournamentById(match.tournamentId || '');
 if (!team1 || !team2) return null;

 const requiredSquadSize = getRequiredSquadSize(match, tournament);
 const t1Selected = { ...team1, players: team1.players.filter(p => (match.team1SquadIds || []).includes(p.id)) };
 const t2Selected = { ...team2, players: team2.players.filter(p => (match.team2SquadIds || []).includes(p.id)) };
 const setTossValidation = canEnableSetToss(t1Selected, t2Selected, match.oversPerInnings, requiredSquadSize, requiredSquadSize);
 const canToss = setTossValidation.canEnable;

 let playerMismatchTitle = "Set Toss";
 if (!canToss) {
 if ((match.team1SquadIds || []).length !== requiredSquadSize) {
 playerMismatchTitle = `${team1.name} squad must have ${requiredSquadSize} players (currently ${(match.team1SquadIds || []).length}/${requiredSquadSize})`;
 } else if ((match.team2SquadIds || []).length !== requiredSquadSize) {
 playerMismatchTitle = `${team2.name} squad must have ${requiredSquadSize} players (currently ${(match.team2SquadIds || []).length}/${requiredSquadSize})`;
 } else if (!setTossValidation.teamAValid) {
 playerMismatchTitle = `${team1.name} squad rules incomplete: ${setTossValidation.teamAErrors[0] || 'Check roles'}`;
 } else if (!setTossValidation.teamBValid) {
 playerMismatchTitle = `${team2.name} squad rules incomplete: ${setTossValidation.teamBErrors[0] || 'Check roles'}`;
 } else {
 playerMismatchTitle = "Roster or overs count validation failed.";
 }
 }
 
 const displayState = getMatchDisplayState(match);
 const isDeleteEligible = match.status !== 'live' && match.status !== 'completed' && !match.wasAbandoned;

 return (
 <CrickIQCard 
 key={match.id}
 accentColor={team1.logo}
 className="flex flex-col p-0 overflow-hidden shadow-sm hover:shadow-md bg-secondary rounded-3xl transition-all duration-300 relative"
 >
 {handleDeleteMatch && isDeleteEligible && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 setMatchToDelete(match);
 }}
 className="absolute top-4 right-4 z-10 w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 flex items-center justify-center rounded-full transition-colors border border-red-100 shadow-sm"
 title="Delete Match"
 >
 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 )}
 <div 
 className="p-5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 flex-grow" 
 onClick={() => {
 if (displayState.type === 'draft') {
 setEditingMatch(match);
 } else {
 onOpenMatchHub?.(match.id);
 }
 }}
 >
 <div className="flex justify-between items-start mb-4 pr-8">
    <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
            {(() => {
                if (displayState.type === 'abandoned') return <span className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30">Abandoned</span>;
                if (displayState.type === 'draft') return <span className="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-amber-100 dark:border-amber-900/30">Draft</span>;
                if (displayState.type === 'live') return (
                    <span className="flex items-center gap-1.5 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span>
                        LIVE
                    </span>
                );
                if (displayState.type === 'completed') return <span className="bg-black/5 dark:bg-white/10 text-text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Completed</span>;
                if (displayState.type === 'readyToToss') return <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Toss</span>;
                if (displayState.type === 'readyToStart') return <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Ready</span>;
                return <span className="bg-black/5 dark:bg-white/10 text-text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{displayState.label}</span>;
            })()}
            {match.tournamentId && match.tournamentId !== 't_quick_matches' && match.matchNumber !== undefined && match.matchNumber !== null && (
                <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider border border-sky-100 dark:border-sky-900/30">
                    Match {match.matchNumber}
                </span>
            )}
            {(!match.tournamentId || match.tournamentId === 't_quick_matches' || match.isQuickMatch) && match.rivalryMatchNumber !== undefined && match.rivalryMatchNumber !== null && (
                <span className="bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                    Match - {match.rivalryMatchNumber}
                </span>
            )}
            {focusTeamId && (match.team1Id === focusTeamId || match.team2Id === focusTeamId) && (
                <span className="bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider border border-brand-blue/20">
                    Team Match
                </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                {match.oversPerInnings} Overs
            </span>
        </div>
        <span className="text-[10px] text-text-secondary uppercase tracking-wider">
            {new Date(match.date).toLocaleDateString()} {match.time ? `• ${match.time}` : ''}
            {tournament ? (
                <> • {tournament.name} {match.knockoutType ? (match.knockoutType === 'semifinal' ? 'Semi Final' : 'Final') : match.groupId ? `(Group ${match.groupId.toUpperCase()})` : ''}</>
            ) : (!match.isDraft && (
                <> • Quick Match</>
            ))}
        </span>
    </div>
</div>
 
 {displayState.type === 'draft' ? (
    <div className="flex flex-col items-center py-5 gap-3">
        <div className="text-center font-bold text-text-secondary text-xs uppercase tracking-wider">Setup Pending</div>
        <div className="flex flex-col w-full px-4 gap-2">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-xs" style={{ backgroundColor: team1.logo }}>
                    {team1.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm md:text-base font-semibold truncate text-text-primary">{team1.name}</span>
            </div>
            <div className="flex items-center gap-3 overflow-hidden mt-1">
                <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-xs" style={{ backgroundColor: team2.logo }}>
                    {team2.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm md:text-base font-semibold truncate text-text-primary">{team2.name}</span>
            </div>
        </div>
    </div>
) : (
    <></>
)}
 
 <div className="space-y-4 pt-2">
     {displayState.type !== 'draft' && (() => {
         const isWinner = (team: Team) => match.winnerId !== 'draw' && match.winnerId === team.id;
         const getTeamTextStyle = (team: Team) => {
             if (match.status !== 'completed' && !match.wasAbandoned) return 'text-text-primary';
             if (match.winnerId === 'draw') return 'text-text-primary';
             return isWinner(team) ? 'text-text-primary' : 'text-text-secondary';
         };

         const getScoreText = (teamMatchId: string) => {
             if (match.status === 'scheduled' || match.isDraft) return null;
             if (teamMatchId === match.innings1?.battingTeamId) {
                 return { score: match.innings1.score ?? 0, wickets: match.innings1.wickets ?? 0, overs: match.innings1.overs ?? 0 };
             }
             if (teamMatchId === match.innings2?.battingTeamId) {
                 return { score: match.innings2.score ?? 0, wickets: match.innings2.wickets ?? 0, overs: match.innings2.overs ?? 0 };
             }
             return null;
         };

         const team1Score = getScoreText(team1.id);
         const team2Score = getScoreText(team2.id);

         return (
             <>
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
                                 <span className={`font-mono font-bold text-lg md:text-xl tracking-tighter ${getTeamTextStyle(team1)}`}>
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
                                 <span className={`font-mono font-bold text-lg md:text-xl tracking-tighter ${getTeamTextStyle(team2)}`}>
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
             </>
         );
     })()}
 </div>

 {match.toss && displayState.type !== 'live' && (
     <p className="text-xs text-text-secondary mt-5 uppercase tracking-wider text-center">
         {getTeamById(match.toss.winner)?.name} won the toss and chose to {match.toss.decision}
     </p>
 )}

 {(displayState.type === 'completed' || displayState.type === 'abandoned') && (
     <div className={`mt-4 pt-3 border-t border-border text-sm font-medium ${displayState.type === 'completed' ? 'text-brand-blue dark:text-text-primary' : 'text-red-500'}`}>
         {displayState.type === 'completed' ? (
             <div>
                 <p className="font-bold text-text-primary text-center tracking-tight uppercase">{getTeamById(match.winnerId)?.name} won</p>
                 {match.manOfTheMatchId && (
                     <p className="text-xs font-medium text-text-secondary mt-0.5 normal-case text-center">
                         🌟 MOM: {getTeamById(match.team1Id)?.players.find(p => p.id === match.manOfTheMatchId)?.name || getTeamById(match.team2Id)?.players.find(p => p.id === match.manOfTheMatchId)?.name}
                     </p>
                 )}
             </div>
         ) : (
             <p className="text-center font-bold uppercase">Match Abandoned</p>
         )}
     </div>
 )}
 
 <div className="mt-4">
 {displayState.type === 'completed' ? (
 <button onClick={(e) => { e.stopPropagation(); onViewMatchResult(match.id); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-tertiary text-text-primary shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
 View Scorecard
 </button>
 ) : displayState.type === 'live' ? (
 <button onClick={(e) => { e.stopPropagation(); onContinueMatch(match); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md hover:bg-brand-blue/90 transition-colors">Continue Live Match</button>
 ) : displayState.type === 'draft' ? (
 <button onClick={(e) => { e.stopPropagation(); setEditingMatch(match); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md hover:bg-brand-blue/90 transition-colors">Setup Teams</button>
 ) : displayState.type === 'readyToToss' ? (
 <button disabled={isMatchLive || !canToss} onClick={(e) => { e.stopPropagation(); setTossMatch(match); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md disabled:opacity-60 hover:bg-brand-blue/90 transition-colors" title={!canToss ? playerMismatchTitle : (isMatchLive ? 'Another match is live' : 'Set Toss')}>{isMatchLive ? 'Match Live' : (canToss ? 'Set Toss' : 'Squads Incomplete')}</button>
 ) : displayState.type === 'readyToStart' ? (
 <button onClick={(e) => { e.stopPropagation(); onStartMatch(match); }} className="w-full px-4 py-3 text-sm rounded-xl font-bold bg-brand-blue text-white shadow-md hover:bg-brand-blue/90 transition-colors">Start Match</button>
 ) : null}
 </div>
 </div>
 </CrickIQCard>
 )
 })}
 </div>
 )}

 {/* Delete Match Confirmation Dialog */}
 {matchToDelete && (
 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
 <CrickIQCard className="max-w-md w-full p-6 bg-secondary rounded-3xl shadow-xl border-none space-y-5 animate-in zoom-in-95 duration-200">
 <div className="flex flex-col items-center text-center space-y-3">
 <div className="w-12 h-12 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
 </svg>
 </div>
 <h3 className="text-xl font-bold text-text-primary dark:text-white">⚠️ Delete Match?</h3>
 <p className="text-sm text-text-primary dark:text-text-secondary">
 This match will be deleted.
 </p>
 </div>
 
 <div className="flex gap-3 justify-end pt-2">
 <button 
 onClick={() => setMatchToDelete(null)}
 className="flex-1 py-3 px-4 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition duration-200 cursor-pointer text-center text-button"
 >
 Cancel
 </button>
 <button 
 onClick={() => {
 if (handleDeleteMatch && matchToDelete) {
 handleDeleteMatch(matchToDelete.id);
 }
 setMatchToDelete(null);
 }}
 className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-md transition duration-200 cursor-pointer text-center text-button"
 >
 Delete
 </button>
 </div>
 </CrickIQCard>
 </div>
 )}
 </div>
 );
};

export default MatchTable;
