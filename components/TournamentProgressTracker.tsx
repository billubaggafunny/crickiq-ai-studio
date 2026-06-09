import React from 'react';
import { TrophyIcon, CheckIcon, ClockIcon } from '../constants';
import type { Tournament, Match, Team } from '../types';
import { getTournamentProgress } from '../utils/scheduleLogic';

interface Props {
 tournament: Tournament;
 matches: Match[];
 teams: Team[];
}

const statusConfig = {
 'pending': { label: 'Pending', color: 'text-text-secondary', bg: 'bg-tertiary ', icon: <ClockIcon className="w-4 h-4" /> },
 'ready': { label: 'Ready', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: <ClockIcon className="w-4 h-4" /> },
 'in-progress': { label: 'In Progress', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <ClockIcon className="w-4 h-4 animate-pulse" /> },
 'completed': { label: 'Completed', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', icon: <CheckIcon className="w-4 h-4" /> },
};

const Step = ({ title, statusKey, countText }: { title: string, statusKey: keyof typeof statusConfig, countText?: string }) => {
 const config = statusConfig[statusKey];
 return (
 <div className="flex items-center justify-between p-3 rounded-lg bg-tertiary">
 <div>
 <div className="font-medium text-sm text-text-primary">{title}</div>
 {countText && <div className="text-xs text-text-secondary mt-0.5">{countText}</div>}
 </div>
 <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
 {config.icon}
 {config.label}
 </div>
 </div>
 )
};

export const TournamentProgressTracker: React.FC<Props> = ({ tournament, matches, teams }) => {
 const progress = getTournamentProgress(tournament, matches, teams);

 // Determine which stages to show based on format and existing knockouts
 const showLeague = tournament.format !== 'Knockout';
 
 // Only show semifinals if not purely round robin OR if semi-final matches manually exist
 const showSemifinals = tournament.format !== 'Round Robin' || progress.semifinals.total > 0;
 
 // Only show final if not purely round robin OR if final match manually exists
 const showFinal = tournament.format !== 'Round Robin' || progress.final.status !== 'pending';

 const noFixtures = progress.league.total === 0 && progress.semifinals.total === 0 && progress.final.status === 'pending';

 if (noFixtures) {
 return (
 <div className="bg-secondary border border-light-border dark:border-brand-blue/15 shadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-black/20 rounded-xl p-4 mb-6">
 <h3 className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-2 mb-2">
 <TrophyIcon className="w-4 h-4 text-brand-blue" />
 Tournament Progress
 </h3>
 <p className="text-sm text-text-secondary">No fixtures generated yet. Generate fixtures to start tracking tournament progress.</p>
 </div>
 );
 }

 return (
 <div className="bg-secondary border border-light-border dark:border-brand-blue/15 shadow-[0_4px_14px_rgba(0,0,0,0.06)] dark:shadow-black/20 rounded-xl p-4 mb-6">
 <h3 className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-2 mb-4">
 <TrophyIcon className="w-4 h-4 text-brand-blue" />
 Tournament Progress
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
 {showLeague && (
 <Step 
 title="League Stage" 
 statusKey={progress.league.status}
 countText={`${progress.league.completed} / ${progress.league.total} Matches Completed`}
 />
 )}
 
 {showSemifinals && (
 <Step 
 title="Semi Finals" 
 statusKey={progress.semifinals.status}
 countText={progress.semifinals.total > 0 ? `${progress.semifinals.completed} / ${progress.semifinals.total} Matches Completed` : '0 / 2 Matches Completed'}
 />
 )}
 
 {showFinal && (
 <Step 
 title="Final" 
 statusKey={progress.final.status}
 />
 )}

 <div className={`flex items-center justify-between p-3 rounded-lg border ${progress.champion.status === 'declared' ? 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10' : 'bg-tertiary /50'}`}>
 <div>
 <div className="font-medium text-sm text-text-primary flex items-center gap-1.5">
 Champion
 </div>
 {progress.champion.status === 'declared' ? (
 <div className="text-xs font-bold text-amber-600 dark:text-amber-500 mt-0.5">{progress.champion.teamName}</div>
 ) : (
 <div className="text-xs text-text-secondary mt-0.5">Not Declared</div>
 )}
 </div>
 <div className={`flex items-center justify-center w-8 h-8 rounded-full ${progress.champion.status === 'declared' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-tertiary text-text-secondary '}`}>
 <TrophyIcon className="w-4 h-4" />
 </div>
 </div>
 </div>
 </div>
 );
};
