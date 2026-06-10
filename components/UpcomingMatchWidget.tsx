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
 let badgeColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
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
 badgeColor = 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500';
 badgeLabel = 'Live Match';
 onAction = () => handleActionClick('continue');
 } else if (match.status === 'readyToStart') {
 actionText = 'Start Match';
 badgeColor = 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500';
 badgeLabel = 'Ready to Start';
 onAction = () => handleActionClick('start');
 } else if (match.status === 'readyToToss') {
 actionText = 'Set Toss';
 badgeColor = 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-500';
 badgeLabel = 'Toss Pending';
 onAction = () => handleActionClick('toss');
 } else if (match.status === 'upcoming') {
 badgeColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
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
 
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border border-border bg-tertiary dark:bg-secondary/50">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1.5">
 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColor}`}>
 {badgeLabel}
 </span>
 {match.matchNumber && (
 <span className="text-xs font-semibold text-text-secondary">
 Match - {match.matchNumber}
 </span>
 )}
 </div>
 <h4 className="font-bold text-base text-text-primary mb-1">
 {team1.name} vs {team2.name}
 </h4>
 <div className="text-xs text-text-secondary font-medium">
 {matchStage} {dateString && `• ${dateString}${timeString}`}
 </div>
 </div>
 
 <button 
 onClick={onAction}
 className="w-full sm:w-auto px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
 >
 {actionText}
 </button>
 </div>
 </div>
 );
};
