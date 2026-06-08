import React, { useState } from 'react';
import { Match, Team, Tournament } from '../types';
import { ChevronLeft, Calendar, Trophy, Target, Activity } from 'lucide-react';
import CrickIQCard from './CrickIQCard';
import MatchScorecard from './MatchScorecard';
import MatchOvers from './MatchOvers';
import MatchCommentary from './MatchCommentary';
import ImpactPlayerModal from './ImpactPlayerModal';
import TeamDetailsPage from './TeamDetailsPage';
import { getRequiredSquadSize, getMaxPlayers } from '../utils/matchConfig';
import { canEnableSetToss } from '../utils/validation';

export interface MatchDetailsHubProps {
    match: Match;
    team1: Team;
    team2: Team;
    tournament?: Tournament;
    teams: Team[];
    setManOfTheMatch: (matchId: string, playerId: string) => void;
    onBack: () => void;
    onEditMatch?: (match: Match) => void;
    onSetToss?: (match: Match) => void;
    onStartMatch?: (match: Match) => void;
    onContinueMatch?: (match: Match) => void;
    isMatchLive?: boolean;
    updateTeam?: (team: Team) => void;
    addPlayerReplacement?: (matchId: string, teamId: string, outgoingPlayerId: string, incomingPlayerId: string, reason?: string) => void;
    addPlayer?: (teamId: string, player: Player) => void;
    deletePlayer?: (teamId: string, playerId: string) => void;
    getTournamentById?: (id: string) => Tournament | undefined;
    matches?: Match[];
    onFixSquad?: (match: Match, teamId: string) => void;
}

const MatchDetailsHub: React.FC<MatchDetailsHubProps> = ({ 
    match,
    team1, 
    team2, 
    tournament,
    teams,
    setManOfTheMatch,
    onBack,
    onEditMatch,
    onSetToss,
    onStartMatch,
    onContinueMatch,
    isMatchLive = false,
    updateTeam,
    addPlayerReplacement,
    addPlayer,
    deletePlayer,
    getTournamentById,
    matches,
    onFixSquad
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'matchCenter' | 'scorecard' | 'overs' | 'commentary'>(
        match.status === 'completed' && match.isQuickMatch ? 'scorecard' : 'overview'
    );
    const [activeInningsTab, setActiveInningsTab] = useState<'innings1' | 'innings2'>('innings1');

    const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
    const [impactModalTeamId, setImpactModalTeamId] = useState<string | null>(null);
    const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);

    const getMatchDisplayState = (m: Match) => {
        const matchDateObj = new Date(m.date.replace(/-/g, '/'));
        matchDateObj.setHours(0, 0, 0, 0);
        const todayNoTime = new Date();
        todayNoTime.setHours(0, 0, 0, 0);
        
        const isToday = matchDateObj.getTime() === todayNoTime.getTime();
        const isFuture = matchDateObj.getTime() > todayNoTime.getTime();

        if (m.status === 'completed') return { type: 'completed', label: m.winnerId === 'draw' ? 'Match Drawn / Tied' : 'Completed' };
        if (m.wasAbandoned) return { type: 'abandoned', label: 'Match Abandoned' };
        if (m.status === 'live') return { type: 'live', label: 'Live Match' };
        if (m.isDraft) return { type: 'draft', label: 'Setup Pending' };
        
        if (isToday) {
            if (!m.toss) return { type: 'readyToToss', label: 'Ready for Toss' };
            return { type: 'readyToStart', label: 'Ready to Start' };
        }
        
        if (isFuture) return { type: 'upcoming', label: 'Upcoming Match' };
        
        return { type: 'pastUnplayed', label: 'Not Started' };
    };

    const displayState = getMatchDisplayState(match);

    const getPlayerName = (playerId?: string): string => {
        if (!playerId) return 'Unknown Player';
        const allPlayers = teams.flatMap(t => t.players);
        return allPlayers.find(p => p.id === playerId)?.name || 'Unknown Player';
    };

    const matchTypeLabel = match.isQuickMatch ? 'Quick Match' 
        : tournament ? `${tournament.name}${match.knockoutType ? ` • ${match.knockoutType.replace('semi', 'Semi ').replace('final', 'Final')}` : ' • League Match'}`
        : 'League Match';

    const renderTossInfo = () => {
        if (!match.toss) return "Toss not set yet";
        const tossWinner = match.toss.winner === team1.id ? team1 : match.toss.winner === team2.id ? team2 : null;
        if (!tossWinner) return "Toss winner unknown";
        return `${tossWinner.name} won the toss and chose to ${match.toss.decision}`;
    };

    const renderMatchActions = () => {
        if (displayState.type === 'completed' || displayState.type === 'abandoned' || displayState.type === 'pastUnplayed') return null;

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

        if (displayState.type === 'live' && onContinueMatch) {
            return (
                <button 
                    onClick={() => onContinueMatch(match)}
                    className="w-full mt-4 py-4 bg-brand-blue text-white rounded-xl font-bold uppercase tracking-wide shadow-md hover:bg-brand-blue/90 transition-colors"
                >
                    Continue Scoring
                </button>
            );
        }

        if (displayState.type === 'draft' && onEditMatch) {
            return (
                <button 
                    onClick={() => onEditMatch(match)}
                    className="w-full mt-4 py-4 bg-brand-blue text-white rounded-xl font-bold uppercase tracking-wide shadow-md hover:bg-brand-blue/90 transition-colors"
                >
                    Continue Setup
                </button>
            );
        }

        if (displayState.type === 'upcoming' && onEditMatch) {
            return (
                <button 
                    onClick={() => onEditMatch(match)}
                    className="w-full mt-4 py-4 bg-gray-100 text-gray-900 border border-gray-200 rounded-xl font-bold uppercase tracking-wide hover:bg-gray-200 transition-colors"
                >
                    Edit Match
                </button>
            );
        }

        if (displayState.type === 'readyToToss' && onSetToss) {
            return (
                <div className="mt-4 space-y-3">
                    <button 
                        disabled={isMatchLive || !canToss}
                        onClick={() => onSetToss(match)}
                        title={!canToss ? playerMismatchTitle : (isMatchLive ? 'Another match is currently live' : 'Set Toss')}
                        className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold uppercase tracking-wide shadow-md hover:bg-brand-blue/90 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                    >
                        {isMatchLive ? 'Another Match is Live' : (canToss ? 'Set Toss' : 'Squads Incomplete')}
                    </button>
                    {!canToss && !isMatchLive && onFixSquad && (
                        <div className="flex flex-col items-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">Match Squad must have exactly {requiredSquadSize} selected.</span>
                            <span className="text-xs text-red-500 dark:text-red-400 text-center mb-1">{playerMismatchTitle}</span>
                            <button
                                onClick={() => onFixSquad(match, ((match.team1SquadIds || []).length !== requiredSquadSize) ? team1.id : team2.id)}
                                className="px-6 py-2 bg-red-600 text-white font-bold text-sm uppercase tracking-wide rounded-lg shadow hover:bg-red-700 transition"
                            >
                                Fix Squad
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        if (displayState.type === 'readyToStart' && onStartMatch) {
            return (
                <button 
                    onClick={() => onStartMatch(match)}
                    className="w-full mt-4 py-4 bg-brand-blue text-white rounded-xl font-bold uppercase tracking-wide shadow-md hover:bg-brand-blue/90 transition-colors"
                >
                    Start Match
                </button>
            );
        }

        return null;
    };

    const getWinnerMessage = () => {
        if (match.winnerId === 'draw') return 'Match Drawn / Tied';
        if (!match.winnerId) return '';
        const winner = [team1, team2].find(t => t.id === match.winnerId);
        if (!winner) return 'Winner unknown';
    
        if (match.innings2 && winner.id === match.innings2.battingTeamId) {
            const maxPlayers = getMaxPlayers(match);
            const squadIds = match.team1Id === winner.id ? (match.team1SquadIds || []) : (match.team2SquadIds || []);
            const totalPlayers = squadIds.length > 0 ? squadIds.length : maxPlayers;
            const wicketsLeft = totalPlayers - 1 - (match.innings2.wickets || 0);
            return `${winner.name} won by ${wicketsLeft} wickets`;
        } else if (match.innings1 && winner.id === match.innings1.battingTeamId) {
            const runMargin = (match.innings1.score || 0) - (match.innings2?.score || 0);
            return `${winner.name} won by ${runMargin} runs`;
        }
        return `${winner.name} won`;
    };

    const getScoreString = (innings?: typeof match.innings1) => {
        if (!innings) return 'Yet to bat';
        return `${innings.score}/${innings.wickets} (${innings.overs} ov)`;
    };

    const team1Score = match.innings1?.battingTeamId === team1.id ? match.innings1 : match.innings2?.battingTeamId === team1.id ? match.innings2 : undefined;
    const team2Score = match.innings1?.battingTeamId === team2.id ? match.innings1 : match.innings2?.battingTeamId === team2.id ? match.innings2 : undefined;

    const currentInnings = match.innings2 ? match.innings2 : match.innings1;
    const target = match.innings1 && match.innings2 ? (match.innings1.score || 0) + 1 : undefined;
    const battingTeam = currentInnings ? (currentInnings.battingTeamId === team1.id ? team1 : team2) : null;

    // For live match target and required run rate
    const renderLiveTargetInfo = () => {
        if (!match.innings2 || !battingTeam || displayState.type !== 'live') return null;
        
        if (!target) return null;
        const runsRequired = target - (match.innings2.score || 0);
        const maxOvers = match.oversPerInnings;
        
        // Calculate balls left using legal deliveries
        const legalBalls = (match.innings2.balls || []).filter(b => !b.isWide && !b.isNoBall).length;
        const ballsLeft = (maxOvers * 6) - legalBalls;
        
        if (runsRequired <= 0 || ballsLeft <= 0) return null; // Shouldn't happen in live state usually

        return (
            <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-700 font-medium text-center">
                    {battingTeam.name} needs {runsRequired} runs from {ballsLeft} balls
                </p>
            </div>
        );
    };

    const isWinner = (t: Team) => match.winnerId === t.id;

    if (viewingTeamId !== null) {
        const viewingTeam = teams.find(t => t.id === viewingTeamId);
        if (viewingTeam) {
            return (
                <TeamDetailsPage
                    team={viewingTeam}
                    match={match}
                    opponentTeam={viewingTeam.id === team1.id ? team2 : team1}
                    tournament={tournament}
                    teamId={viewingTeam.id}
                    matchId={match.id}
                    tournamentId={match.tournamentId}
                    isQuickMatch={match.isQuickMatch}
                    isMatchLive={isMatchLive}
                    updateTeam={updateTeam}
                    addPlayerReplacement={addPlayerReplacement}
                    addPlayer={addPlayer}
                    deletePlayer={deletePlayer}
                    getTournamentById={getTournamentById}
                    matches={matches}
                    teams={teams}
                    onBack={() => setViewingTeamId(null)}
                />
            );
        }
    }

    return (
        <div className="flex flex-col h-full bg-body-bg relative">
            {/* Header Area */}
            <div className="bg-brand-blue text-white pt-10 pb-6 px-4 md:px-6 shadow-md rounded-b-3xl relative z-10 flex-shrink-0">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button 
                        onClick={onBack} 
                        className="text-white hover:text-gray-200 transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
                        title="Back"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    
                    <div className="flex-grow text-center px-4">
                        <h2 className="text-xl md:text-2xl font-bold truncate">
                            {team1.name} vs {team2.name}
                        </h2>
                        <div className="text-sm text-theme-blue/80 font-medium mt-1 uppercase tracking-wider">
                            Match Center
                        </div>
                    </div>
                    
                    <div className="w-10"></div> {/* Spacer to keep title centered */}
                </div>
                
                {/* Tabs */}
                <div className="max-w-4xl mx-auto flex mt-6 bg-white/10 rounded-xl p-1 gap-1 overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 min-w-[max-content] px-3 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
                            activeTab === 'overview' 
                                ? 'bg-white text-brand-blue shadow-sm' 
                                : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('matchCenter')}
                        className={`flex-1 min-w-[max-content] px-3 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
                            activeTab === 'matchCenter' 
                                ? 'bg-white text-brand-blue shadow-sm' 
                                : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Match Center
                    </button>
                    <button 
                        onClick={() => setActiveTab('scorecard')}
                        className={`flex-1 min-w-[max-content] px-3 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
                            activeTab === 'scorecard' 
                                ? 'bg-white text-brand-blue shadow-sm' 
                                : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Scorecard
                    </button>
                    <button 
                        onClick={() => setActiveTab('overs')}
                        className={`flex-1 min-w-[max-content] px-3 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
                            activeTab === 'overs' 
                                ? 'bg-white text-brand-blue shadow-sm' 
                                : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Overs
                    </button>
                    <button 
                        onClick={() => setActiveTab('commentary')}
                        className={`flex-1 min-w-[max-content] px-3 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${
                            activeTab === 'commentary' 
                                ? 'bg-white text-brand-blue shadow-sm' 
                                : 'text-white/80 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Commentary
                    </button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto w-full relative">
                {activeTab === 'overview' ? (
                    <div className="p-4 md:p-6 pb-24 max-w-4xl mx-auto space-y-6">
                        
                        {/* Lineups Card */}
                        <CrickIQCard className="p-0 overflow-hidden shadow-sm bg-white rounded-xl">
                            <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 border-l-4 border-brand-blue pl-3 text-sm uppercase tracking-wider">Lineups</h3>
                            </div>
                            <div className="divide-y divide-gray-100 p-0">
                                {/* Team 1 */}
                                <div className="p-4 flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors justify-between cursor-pointer" onClick={() => setViewingTeamId(team1.id)}>
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden" style={{ backgroundColor: team1.logo || '#3b82f6' }}>
                                            {team1.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                                {team1.name}
                                                <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                                            </h4>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">{team1.players.length} Players</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Team 2 */}
                                <div className="p-4 flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors justify-between cursor-pointer" onClick={() => setViewingTeamId(team2.id)}>
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden" style={{ backgroundColor: team2.logo || '#ef4444' }}>
                                            {team2.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
                                                {team2.name}
                                                <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                                            </h4>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">{team2.players.length} Players</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CrickIQCard>

                        {/* Match Info Card */}
                        <CrickIQCard className="p-0 overflow-hidden shadow-sm bg-white rounded-xl">
                            <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 border-l-4 border-brand-blue pl-3 text-sm uppercase tracking-wider">Match Info</h3>
                            </div>
                            <div className="p-0">
                                <div className="divide-y divide-gray-100">
                                    {(tournament?.name || match.isQuickMatch) && (
                                        <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-500 font-medium text-sm">Tournament Name</span>
                                            <span className="text-gray-900 font-bold text-sm">{match.isQuickMatch ? 'Quick Match' : tournament?.name}</span>
                                        </div>
                                    )}
                                    {match.tournamentId && match.tournamentId !== 't_quick_matches' && (
                                        <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-500 font-medium text-sm">Match Number</span>
                                            <span className="text-gray-900 font-bold text-sm">
                                                {match.matchNumber !== undefined && match.matchNumber !== null 
                                                    ? `Match ${match.matchNumber}` 
                                                    : 'Not assigned'}
                                            </span>
                                        </div>
                                    )}
                                    {(match.isQuickMatch || match.tournamentId === 't_quick_matches') && match.rivalryMatchNumber !== undefined && match.rivalryMatchNumber !== null && (
                                        <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-500 font-medium text-sm">Match Number</span>
                                            <span className="text-gray-900 font-bold text-sm">
                                                Match - {match.rivalryMatchNumber}
                                            </span>
                                        </div>
                                    )}
                                    {tournament?.location && (
                                        <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-500 font-medium text-sm">Ground / Venue</span>
                                            <span className="text-gray-900 font-bold text-sm">{tournament.location}</span>
                                        </div>
                                    )}
                                    <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                        <span className="text-gray-500 font-medium text-sm">Match Type</span>
                                        <span className="text-gray-900 font-bold text-sm">{matchTypeLabel}</span>
                                    </div>
                                    <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                        <span className="text-gray-500 font-medium text-sm">Overs</span>
                                        <span className="text-gray-900 font-bold text-sm">{match.oversPerInnings} per innings</span>
                                    </div>
                                    <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                        <span className="text-gray-500 font-medium text-sm">Date</span>
                                        <span className="text-gray-900 font-bold text-sm">{new Date(match.date).toLocaleDateString()}</span>
                                    </div>
                                    {match.time && (
                                        <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-500 font-medium text-sm">Time</span>
                                            <span className="text-gray-900 font-bold text-sm">{match.time}</span>
                                        </div>
                                    )}
                                    {match.toss && (
                                        <div className="p-3 px-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-500 font-medium text-sm">Toss</span>
                                            <span className="text-gray-900 font-bold text-sm text-right max-w-[200px]">{renderTossInfo()}</span>
                                        </div>
                                    )}
                                    {match.replacements && match.replacements.length > 0 && (
                                        <div className="p-3 px-4 bg-white hover:bg-gray-50 transition-colors border-t border-gray-100">
                                            <span className="text-gray-500 font-medium text-sm block mb-2">Match Notes</span>
                                            <div className="space-y-2">
                                                {match.replacements.map((r, idx) => {
                                                    const incomingPlayer = getPlayerName(r.incomingPlayerId);
                                                    const outgoingPlayer = getPlayerName(r.outgoingPlayerId);
                                                    const isImpactPlayer = r.reason === 'Impact Player';
                                                    return (
                                                        <div key={idx} className="flex gap-2 items-start text-sm text-gray-900 border-l-2 pl-2 border-gray-200">
                                                            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isImpactPlayer ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                                                            <span>
                                                                <strong className="font-bold">{r.reason || 'Substitute'}:</strong> {incomingPlayer} replaced {outgoingPlayer}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CrickIQCard>

                    </div>
                ) : activeTab === 'matchCenter' ? (
                    <div className="p-4 md:p-6 pb-24 max-w-4xl mx-auto space-y-6">
                        
                        {/* Match Info Card */}
                    <CrickIQCard className="p-0 overflow-hidden shadow-sm bg-white rounded-xl">
                        <div className="p-5 flex flex-col gap-4">
                            
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{matchTypeLabel}</h3>
                                    <div className="flex items-center text-gray-500 text-sm mt-1 gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(match.date).toLocaleDateString()} {match.time ? `• ${match.time}` : ''}</span>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    displayState.type === 'live' ? 'bg-orange-100 text-orange-600' : 
                                    displayState.type === 'completed' ? 'bg-green-100 text-green-700' :
                                    displayState.type === 'abandoned' ? 'bg-red-100 text-red-600' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {displayState.label}
                                </span>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-center text-center">
                                <p className="text-sm font-medium text-gray-600">
                                    {renderTossInfo()}
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="text-center p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overs</p>
                                    <p className="font-bold text-lg text-gray-900">{match.oversPerInnings}</p>
                                </div>
                                <div className="text-center p-4 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Max Overs/Bowler</p>
                                    <p className="font-bold text-lg text-gray-900">{match.maxOversPerBowler || Math.ceil(match.oversPerInnings / 5)}</p>
                                </div>
                            </div>
                            
                            {renderMatchActions()}

                        </div>
                    </CrickIQCard>

                    {/* Result / Score Summary */}
                    {(displayState.type === 'completed' || displayState.type === 'abandoned' || displayState.type === 'live') && (
                        <CrickIQCard className="p-0 overflow-hidden shadow-sm bg-white rounded-xl">
                            <div className="p-5">
                                <div className="flex items-center gap-2 mb-6">
                                    {displayState.type === 'live' ? (
                                        <Activity className="w-5 h-5 text-orange-500" />
                                    ) : (
                                        <Trophy className={`w-5 h-5 ${displayState.type === 'abandoned' ? 'text-red-500' : 'text-brand-yellow'}`} />
                                    )}
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        {displayState.type === 'live' ? 'Live Score' : 'Final Score'}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    {/* Team 1 Score */}
                                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3 font-semibold">
                                            <div className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team1.logo }}>
                                                {team1.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className={`text-base ${isWinner(team1) ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>{team1.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-lg text-gray-900">{getScoreString(team1Score)}</span>
                                    </div>

                                    {/* Team 2 Score */}
                                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3 font-semibold">
                                            <div className="w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team2.logo }}>
                                                {team2.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className={`text-base ${isWinner(team2) ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>{team2.name}</span>
                                        </div>
                                        <span className="font-mono font-bold text-lg text-gray-900">{getScoreString(team2Score)}</span>
                                    </div>
                                </div>

                                {displayState.type === 'live' && renderLiveTargetInfo()}

                                {displayState.type === 'completed' && (
                                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                                        <p className="font-bold text-brand-blue text-lg mb-1">{getWinnerMessage()}</p>
                                        {match.manOfTheMatchId && (
                                            <p className="text-sm text-gray-600 flex items-center justify-center gap-1">
                                                <Target className="w-4 h-4" />
                                                MOM: {[...team1.players, ...team2.players].find(p => p.id === match.manOfTheMatchId)?.name || 'Unknown'}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {displayState.type === 'abandoned' && (
                                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                                        <p className="font-bold text-red-500 text-lg">Match Abandoned</p>
                                    </div>
                                )}
                            </div>
                        </CrickIQCard>
                    )}

                </div>
                ) : activeTab === 'scorecard' ? (
                    <div className="h-full w-full pb-8">
                        {displayState.type === 'upcoming' || displayState.type === 'draft' || displayState.type === 'readyToStart' || displayState.type === 'readyToToss' || displayState.type === 'pastUnplayed' ? (
                             <div className="flex flex-col items-center justify-center p-8 text-center h-[300px]">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Scorecard not available</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    Scorecard will appear after the match starts.
                                </p>
                            </div>
                        ) : (
                            <MatchScorecard
                                match={match}
                                tournament={tournament || { name: 'Quick Match', location: '', format: 'League' } as Tournament}
                                teams={teams}
                                onClose={onBack}
                                setManOfTheMatch={setManOfTheMatch}
                                hideHeader={true}
                            />
                        )}
                    </div>
                ) : activeTab === 'overs' || activeTab === 'commentary' ? (
                     <div className="h-full w-full pb-8">
                        {displayState.type === 'upcoming' || displayState.type === 'draft' || displayState.type === 'readyToStart' || displayState.type === 'readyToToss' || displayState.type === 'pastUnplayed' ? (
                             <div className="flex flex-col items-center justify-center p-8 text-center h-[300px]">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                    <Activity className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{activeTab === 'overs' ? 'Overs' : 'Commentary'} not available</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    Data will appear after the match starts.
                                </p>
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto p-4 md:p-6 pb-24 space-y-6">
                                {match.innings2 && match.innings1 && (
                                     <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-4">
                                        <button 
                                            onClick={() => setActiveInningsTab('innings1')}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                                                activeInningsTab === 'innings1' 
                                                    ? 'bg-white text-brand-blue shadow-sm' 
                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                                            }`}
                                        >
                                            Innings 1 ({teams.find(t => t.id === match.innings1!.battingTeamId)?.name})
                                        </button>
                                        <button 
                                            onClick={() => setActiveInningsTab('innings2')}
                                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                                                activeInningsTab === 'innings2' 
                                                    ? 'bg-white text-brand-blue shadow-sm' 
                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                                            }`}
                                        >
                                            Innings 2 ({teams.find(t => t.id === match.innings2!.battingTeamId)?.name})
                                        </button>
                                    </div>
                                )}
                                
                                {activeInningsTab === 'innings1' && match.innings1 ? (
                                    activeTab === 'overs' ? (
                                        <MatchOvers 
                                            innings={match.innings1} 
                                            battingTeam={teams.find(t => t.id === match.innings1!.battingTeamId)!} 
                                        />
                                    ) : (
                                        <MatchCommentary 
                                            innings={match.innings1} 
                                            battingTeam={teams.find(t => t.id === match.innings1!.battingTeamId)!} 
                                            bowlingTeam={teams.find(t => t.id === match.innings1!.bowlingTeamId)!}
                                            match={match}
                                            teams={teams}
                                        />
                                    )
                                ) : match.innings2 ? (
                                    activeTab === 'overs' ? (
                                        <MatchOvers 
                                            innings={match.innings2} 
                                            battingTeam={teams.find(t => t.id === match.innings2!.battingTeamId)!} 
                                        />
                                    ) : (
                                        <MatchCommentary 
                                            innings={match.innings2} 
                                            battingTeam={teams.find(t => t.id === match.innings2!.battingTeamId)!} 
                                            bowlingTeam={teams.find(t => t.id === match.innings2!.bowlingTeamId)!}
                                            match={match}
                                            teams={teams}
                                        />
                                    )
                                ) : null}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
            
            <ImpactPlayerModal
                isOpen={isImpactModalOpen}
                onClose={() => {
                    setIsImpactModalOpen(false);
                    setImpactModalTeamId(null);
                }}
                match={match}
                team={impactModalTeamId ? (impactModalTeamId === team1.id ? team1 : team2) : undefined}
                teams={teams}
                updateTeam={updateTeam!}
                addPlayerReplacement={addPlayerReplacement!}
            />
        </div>
    );
};

export default MatchDetailsHub;
