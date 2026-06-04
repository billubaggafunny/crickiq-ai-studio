import CrickIQCard from './CrickIQCard';
import React, { useState, useEffect, useMemo } from 'react';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { Match, Team } from '../types';
// FIX: Changed to a named import to resolve module resolution error.
import { TeamEditorModal } from './TeamEditorModal';
import { EditIcon } from '../constants';
import { calculatePlayerCareerStats } from '../utils/cricketLogic';
import LineupPreview from './LineupPreview';
import TossModal from './TossModal';
import { canEnableSetToss } from '../utils/validation';
import { getRequiredSquadSize } from '../utils/matchConfig';

// FIX: Updated Card component to accept and spread additional props (e.g., onClick) to resolve type errors.

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'blue' }> = ({ children, className = '', variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses = variant === 'secondary' ? 'bg-brand-lightblue text-white border-0' : variant === 'blue' ? 'bg-brand-blue text-white border-0' : 'bg-brand-gradient text-white border-0'; // primary

    return <button {...props} className={`${baseClasses} ${variantClasses} ${className}`}>{children}</button>
};

interface QuickMatchSetupProps extends UseCrickIQStateReturn {
    match: Match;
    onStartMatch: (match: Match) => void;
    startWithToss?: boolean;
    onCancel?: () => void;
}

const TeamPanel: React.FC<{ team: Team, isReady: boolean, onManage: () => void }> = ({ team, isReady, onManage }) => (
    <CrickIQCard  className="text-center">
        <div className="text-h2 text-text-primary flex items-center justify-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: team.logo }}>
                {team.name.substring(0, 2).toUpperCase()}
            </div>
            {team.name}
        </div>
        <p className="text-sm text-text-secondary mb-4">{team.players.length} Players</p>
        <button
            onClick={onManage}
            className={`w-full py-2 rounded-2xl font-semibold flex items-center justify-center gap-2 text-body transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue ${
                isReady
                ? ' text-white'
                : ' text-gray-800  dark:text-text-primary hover:brightness-105 border border-brand-blue/15'
            }`}
        >
            {isReady ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            ) : <EditIcon />}
            {isReady ? 'Ready' : 'Manage Players'}
        </button>
    </CrickIQCard>
);

const QuickMatchSetup: React.FC<QuickMatchSetupProps> = ({ match: initialMatch, onStartMatch, matches, startWithToss, ...tournamentState }) => {
    const { getTeamById, updateToss, updateTeam, getTournamentById, addPlayer, deletePlayer, updateMatch } = tournamentState;

    const match = matches.find(m => m.id === initialMatch.id) || initialMatch;

    const [team1Ready, setTeam1Ready] = useState(false);
    const [team2Ready, setTeam2Ready] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [previewingTeamId, setPreviewingTeamId] = useState<string | null>(null);
    const [showTossModal, setShowTossModal] = useState(false);
    const [activeLineupTab, setActiveLineupTab] = useState<'team1' | 'team2'>('team1');
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

    useEffect(() => {
        if (startWithToss) {
            const timeoutId = setTimeout(() => {
                setTeam1Ready(true);
                setTeam2Ready(true);
                setShowTossModal(true);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [startWithToss]);

    const team1Pool = getTeamById(match.team1Id);
    const team2Pool = getTeamById(match.team2Id);
    
    // Step 1: Match Squad Separation
    // Match Squad starts empty if teamXSquadIds is undefined, allowing user to select from the pool.
    const team1SquadIds = useMemo(() => match.team1SquadIds || [], [match.team1SquadIds]);
    const team2SquadIds = useMemo(() => match.team2SquadIds || [], [match.team2SquadIds]);
    
    const team1 = useMemo(() => team1Pool ? { ...team1Pool, players: team1Pool.players.filter(p => team1SquadIds.includes(p.id)) } : undefined, [team1Pool, team1SquadIds]);
    const team2 = useMemo(() => team2Pool ? { ...team2Pool, players: team2Pool.players.filter(p => team2SquadIds.includes(p.id)) } : undefined, [team2Pool, team2SquadIds]);

    const quickMatches = useMemo(() => matches.filter(m => m.isQuickMatch && m.status === 'completed'), [matches]);

    const getPlayerStatsMap = (team: Team | null, historicalMatches: Match[]) => {
        const statsMap = new Map<string, { matches: number; runsScored: number; wicketsTaken: number; }>();
        if (team) {
            team.players.forEach(player => {
                const idForStats = player.originalId || player.id;
                const stats = calculatePlayerCareerStats(idForStats, historicalMatches);
                statsMap.set(player.id, {
                    matches: stats.matches,
                    runsScored: stats.runsScored,
                    wicketsTaken: stats.wicketsTaken,
                });
            });
        }
        return statsMap;
    };

    const team1Stats = getPlayerStatsMap(team1, quickMatches);
    const team2Stats = getPlayerStatsMap(team2, quickMatches);

    const handleTeamReady = (teamId: string) => {
        if (teamId === team1?.id) setTeam1Ready(true);
        if (teamId === team2?.id) setTeam2Ready(true);
        setEditingTeamId(null);
    };
    
    const handleTeamPanelClick = (team: Team, isReady: boolean) => {
        if (isReady) {
            setPreviewingTeamId(team.id);
        } else {
            setEditingTeamId(team.id);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe, .recharts-surface, .overflow-x-auto, [data-no-swipe="true"]')) {
            return;
        }
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchCurrentX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        setTouchCurrentX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStartX === null || touchCurrentX === null) {
            return;
        }

        const diffX = touchStartX - touchCurrentX;
        const SWIPE_THRESHOLD = 50;

        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
            if (diffX > 0) { // Swiped left
                if (activeLineupTab === 'team1') {
                    setActiveLineupTab('team2');
                }
            } else { // Swiped right
                if (activeLineupTab === 'team2') {
                    setActiveLineupTab('team1');
                }
            }
        }

        setTouchStartX(null);
        setTouchCurrentX(null);
    };

    const arePlayerCountsEqual = team1?.players.length === team2?.players.length;
    const tournament = match.tournamentId ? getTournamentById(match.tournamentId) : undefined;
    const maxPlayers = getRequiredSquadSize(match, tournament);
    const setTossValidation = canEnableSetToss(team1, team2, match.oversPerInnings, maxPlayers, maxPlayers);
    const isTossDisabled = !(team1Ready && team2Ready && setTossValidation.canEnable);

    const tossButtonTitle = useMemo(() => {
        if (!team1 || !team2) return 'Loading...';
        if (!team1Ready || !team2Ready) {
            return 'Both teams must be marked as ready';
        }
        if (!setTossValidation.canEnable) {
            if (team1.players.length !== maxPlayers) return `${team1.name} must have ${maxPlayers} players`;
            if (team2.players.length !== maxPlayers) return `${team2.name} must have ${maxPlayers} players`;
            if (!arePlayerCountsEqual) return `Teams must have same number of players (${team1.players.length} vs ${team2.players.length})`;
            if (!setTossValidation.teamAValid) return `${team1.name} roster is invalid: ${setTossValidation.teamAErrors[0]}`;
            if (!setTossValidation.teamBValid) return `${team2.name} roster is invalid: ${setTossValidation.teamBErrors[0]}`;
            return 'Fix roster issues to proceed';
        }
        return 'Proceed to toss';
    }, [team1, team2, team1Ready, team2Ready, setTossValidation, arePlayerCountsEqual, maxPlayers]);

    if (!team1 || !team2) {
        return <div className="text-center p-8">Loading teams...</div>;
    }


    return (
        <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <TeamPanel team={team1} isReady={team1Ready} onManage={() => handleTeamPanelClick(team1, team1Ready)} />
                <TeamPanel team={team2} isReady={team2Ready} onManage={() => handleTeamPanelClick(team2, team2Ready)} />
            </div>

            {team1Ready && team2Ready && (
                <CrickIQCard>
                    <h3 className="text-h2 text-text-primary mb-4 text-center">Team Lineups</h3>
                    <div className="border-b border-brand-blue/15 flex items-center justify-center gap-4 mb-4">
                        <button
                            onClick={() => setActiveLineupTab('team1')}
                            className={`py-2 px-4 font-bold transition-colors duration-300 text-body ${activeLineupTab === 'team1' ? 'border-b-2 border-brand-blue text-brand-blue' : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'}`}
                        >
                            {team1.name}
                        </button>
                        <button
                            onClick={() => setActiveLineupTab('team2')}
                            className={`py-2 px-4 font-bold transition-colors duration-300 text-body ${activeLineupTab === 'team2' ? 'border-b-2 border-brand-blue text-brand-blue' : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'}`}
                        >
                            {team2.name}
                        </button>
                    </div>
                    <div
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {activeLineupTab === 'team1' ? (
                            <div className="animate-fade-in">
                                <LineupPreview team={team1} playerStats={team1Stats} match={match} />
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <LineupPreview team={team2} playerStats={team2Stats} match={match} />
                            </div>
                        )}
                    </div>
                </CrickIQCard>
            )}

            <CrickIQCard>
                <div className="text-center">
                    <p className="text-sm text-text-secondary">{match.oversPerInnings} Overs Match</p>
                    <div className="text-2xl my-2 flex items-center justify-center gap-2">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: team1.logo }}>
                                {team1.name.substring(0, 2).toUpperCase()}
                            </div>
                            {team1.name}
                        </div>
                        <span className="text-text-secondary mx-1">vs</span>
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: team2.logo }}>
                                {team2.name.substring(0, 2).toUpperCase()}
                            </div>
                            {team2.name}
                        </div>
                    </div>
                     {!arePlayerCountsEqual && team1Ready && team2Ready && (
                        <div className="text-center text-highlight font-semibold text-body my-4 p-2 bg-highlight/10 rounded-lg">
                            Warning: Teams have different numbers of players ({team1.players.length} vs {team2.players.length}).
                        </div>
                    )}
                    <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                        {!match.toss ? (
                            <>
                                <button 
                                    onClick={() => { setTeam1Ready(false); setTeam2Ready(false); }}
                                    className="w-full sm:w-auto px-4 py-2 rounded-2xl text-button bg-primary/80 border border-brand-blue/15 hover:bg-primary"
                                >
                                    Edit Teams
                                </button>
                                <button 
                                    disabled={isTossDisabled}
                                    onClick={() => setShowTossModal(true)}
                                    className="w-full sm:w-auto px-6 py-2 rounded-2xl text-button bg-brand-blue text-white shadow-md disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed transition-opacity"
                                    title={tossButtonTitle}
                                >
                                    Set Toss
                                </button>
                            </>
                        ) : (
                             <div className="text-center w-full">
                                 <div className="text-sm text-text-secondary flex items-center justify-center gap-2">
                                     <div className="w-5 h-5 flex items-center justify-center rounded-md text-button text-white text-[10px]" style={{ backgroundColor: getTeamById(match.toss.winner)?.logo }}>
                                        {getTeamById(match.toss.winner)?.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span>
                                        {getTeamById(match.toss.winner)?.name} won toss & chose to {match.toss.decision}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => onStartMatch(match)}
                                    className="mt-6 w-full sm:w-auto px-8 py-1.5 rounded-2xl font-bold text-h3 bg-brand-gradient text-white shadow-lg"
                                >
                                    Start Match
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </CrickIQCard>

            {editingTeamId && getTeamById(editingTeamId) && (
                <TeamEditorModal
                    team={getTeamById(editingTeamId)!}
                    tournamentId={match.tournamentId}
                    onClose={() => setEditingTeamId(null)}
                    onDone={handleTeamReady}
                    isMatchLive={false}
                    updateTeam={updateTeam}
                    getTournamentById={getTournamentById}
                    addPlayer={addPlayer}
                    deletePlayer={deletePlayer}
                    matches={matches}
                    match={match}
                    updateMatch={updateMatch}
                />
            )}
            
            {previewingTeamId && getTeamById(previewingTeamId) && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setPreviewingTeamId(null)}>
                    <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <CrickIQCard>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-h2 text-text-primary">Team Preview</h3>
                                <button onClick={() => setPreviewingTeamId(null)} className="text-3xl leading-none text-text-secondary hover:text-text-primary">&times;</button>
                            </div>
                            <LineupPreview team={getTeamById(previewingTeamId)!} playerStats={previewingTeamId === team1?.id ? team1Stats : team2Stats} match={match} />
                            <div className="mt-4 flex justify-end gap-2">
                                <Button 
                                    onClick={() => { setEditingTeamId(previewingTeamId); setPreviewingTeamId(null); }} 
                                    variant="secondary"
                                >
                                    <EditIcon /> Edit Team
                                </Button>
                            </div>
                        </CrickIQCard>
                    </div>
                </div>
            )}
            
            <TossModal 
                isOpen={showTossModal}
                onClose={() => setShowTossModal(false)}
                onConfirm={(winnerId, decision) => {
                    updateToss(match.id, { winner: winnerId, decision: decision });
                    setShowTossModal(false);
                }}
                team1={team1}
                team2={team2}
            />
        </div>
    );
};

export default QuickMatchSetup;
