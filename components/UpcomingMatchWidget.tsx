import React from 'react';
import type { Tournament, Match, Team } from '../types';
import { getUpcomingTournamentMatch } from '../utils/scheduleLogic';
import { useNotification } from '../hooks/useNotification';

interface Props {
 tournament: Tournament;
 matches: Match[];
 teams: Team[];
 onStartMatch: (match: Match) => void;
 onSetToss: (match: Match) => void;
 onContinueMatch: (match: Match) => void;
 onOpenMatchHub: (match: Match) => void;
}

export const UpcomingMatchWidget: React.FC<Props> = ({
 tournament,
 matches,
 teams,
 onStartMatch,
 onSetToss,
 onContinueMatch,
 onOpenMatchHub
}) => {
 const { showNotification } = useNotification();
 const { match } = getUpcomingTournamentMatch(tournament, matches);

 if (!match) {
 return (
 <div className="bg-secondary shadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-black/20 rounded-3xl p-4 mb-6">
 <h3 className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-2 mb-2">
 Next Match
 </h3>
 <p className="text-sm text-gray-500 dark:text-gray-400">All scheduled matches are completed or no fixtures have been generated yet.</p>
 </div>
 );
 }

 const team1 = teams.find((t) => t.id === match.team1Id) || { name: 'Unknown Team' };
 const team2 = teams.find((t) => t.id === match.team2Id) || { name: 'Unknown Team' };

 let actionText = 'View Match';
 let badgeLabel = 'Scheduled';
 
 const handleActionClick = (actionName: string) => {
 if (!match?.id) {
 showNotification("No upcoming match found", "error");
 return;
 }

 const stillExists = matches.some(m => m.id === match.id);

 if (!stillExists) {
 showNotification("Match not found", "error");
 return;
 }

 if (actionName === 'openHub') {
 onOpenMatchHub(match);
 } else if (actionName === 'continue') {
 onContinueMatch(match);
 } else if (actionName === 'start') {
 onStartMatch(match);
 } else if (actionName === 'toss') {
 onSetToss(match);
 }
 };

 let onAction = () => handleActionClick('openHub');

 if (match.status === 'live') {
 actionText = 'Continue Scoring';
 badgeLabel = 'Live Match';
 onAction = () => handleActionClick('continue');
 } else if (match.status === 'readyToStart') {
 actionText = 'Start Match';
 badgeLabel = 'Ready to Start';
 onAction = () => handleActionClick('start');
 } else if (match.status === 'readyToToss') {
 actionText = 'Set Toss';
 badgeLabel = 'Toss Pending';
 onAction = () => handleActionClick('toss');
 } else if (match.status === 'upcoming') {
 badgeLabel = 'Upcoming';
 }

 const matchStage = match.knockoutType 
 ? (match.knockoutType === 'semifinal' ? 'Semi Final' : 'Final') 
 : match.groupId 
 ? `Group ${match.groupId.toUpperCase()}` 
 : 'League Match';

 const dateString = match.date 
 ? new Date(`${match.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
 : '';
 const timeString = match.time ? ` • ${match.time}` : '';

 return (
 <div className="bg-secondary shadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-black/20 rounded-3xl p-4 mb-6">
 <h3 className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-2 mb-4">
 Next Match
 </h3>
 
 <div className="flex flex-col gap-4 p-0">
     
<div className="space-y-4 relative z-10 flex flex-col p-4 bg-tertiary/20 rounded-xl border border-black/5 dark:border-white/5">
    <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center gap-2">
            {match.status === 'live' ? (
                <span className="flex items-center gap-1.5 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-900/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500"></span>
                    LIVE
                </span>
            ) : (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    match.status === 'readyToStart' || match.status === 'readyToToss' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' 
                        : 'bg-black/5 dark:bg-white/10 text-text-secondary border-black/5 dark:border-white/10'
                }`}>
                    {badgeLabel}
                </span>
            )}
            {match.matchNumber && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded">
                    Match {match.matchNumber}
                </span>
            )}
            <span className="text-[10px] uppercase tracking-wider font-bold text-text-secondary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded">
                {matchStage}
            </span>
        </div>
        <div className="text-[10px] text-text-secondary uppercase tracking-wider">
            {dateString} {timeString}
        </div>
    </div>

    <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2 flex-1">
            <div 
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm"
                style={{ backgroundColor: team1.logo || '#3B82F6' }}
            >
                {team1.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-sm md:text-base font-semibold truncate text-text-primary">
                {team1.name}
            </span>
        </div>
        <div className="flex items-baseline gap-1.5 shrink-0">
             {match.status === 'live' && match.innings1?.battingTeamId === team1.id ? (
                  <>
                      <span className="font-mono font-bold text-lg md:text-xl tracking-tighter text-text-primary">
                          {match.innings1.score}/{match.innings1.wickets ?? 0}
                      </span>
                      <span className="font-mono text-xs text-text-secondary">
                          ({match.innings1.overs ?? 0})
                      </span>
                  </>
             ) : (
                  <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
             )}
        </div>
    </div>

    <div className="flex justify-between items-center mt-2">
        <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2 flex-1">
            <div 
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm"
                style={{ backgroundColor: team2.logo || '#EF4444' }}
            >
                {team2.name.substring(0, 2).toUpperCase()}
            </div>
            <span className="text-sm md:text-base font-semibold truncate text-text-primary">
                {team2.name}
            </span>
        </div>
        <div className="flex items-baseline gap-1.5 shrink-0">
             {match.status === 'live' && (match.innings2?.battingTeamId === team2.id || match.innings1?.battingTeamId === team2.id) ? (
                  <>
                      <span className="font-mono font-bold text-lg md:text-xl tracking-tighter text-text-primary">
                          {match.innings2?.battingTeamId === team2.id ? match.innings2.score : match.innings1?.score}/{match.innings2?.battingTeamId === team2.id ? (match.innings2.wickets ?? 0) : (match.innings1?.wickets ?? 0)}
                      </span>
                      <span className="font-mono text-xs text-text-secondary">
                          ({match.innings2?.battingTeamId === team2.id ? match.innings2.overs : match.innings1?.overs ?? 0})
                      </span>
                  </>
             ) : (
                  <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
             )}
        </div>
    </div>

    <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex justify-end">
        <button 
        onClick={onAction}
        className="w-full sm:w-auto px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
        >
        {actionText}
        </button>
    </div>
</div>

  </div>
  </div>
  );
};

