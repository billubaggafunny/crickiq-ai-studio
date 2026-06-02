import React, { useState } from 'react';
import { Player, Team, Match, Tournament } from '../types';
import { ChevronLeft } from 'lucide-react';
import { getRoleIcon } from '../constants';
import PlayerDetailsPage from './PlayerDetailsPage';
import { TeamEditorModal } from './TeamEditorModal';

interface TeamDetailsPageProps {
    team: Team;
    match: Match;
    opponentTeam?: Team;
    tournament?: Tournament;
    teamId: string;
    matchId: string;
    tournamentId?: string;
    isQuickMatch?: boolean;
    isMatchLive?: boolean;
    updateTeam?: (team: Team) => void;
    addPlayerReplacement?: (matchId: string, teamId: string, outgoingPlayerId: string, incomingPlayerId: string, reason?: string) => void;
    addPlayer?: (teamId: string, player: Player) => void;
    deletePlayer?: (teamId: string, playerId: string) => void;
    getTournamentById?: (id: string) => Tournament | undefined;
    matches?: Match[];
    teams?: Team[];
    onBack: () => void;
}

const TeamDetailsPage: React.FC<TeamDetailsPageProps> = ({
    team,
    match,
    opponentTeam,
    tournament,
    tournamentId,
    isMatchLive = false,
    updateTeam,
    addPlayerReplacement,
    addPlayer,
    deletePlayer,
    getTournamentById,
    matches,
    teams,
    onBack,
}) => {
    const [viewingPlayerId, setViewingPlayerId] = useState<string | null>(null);
    const [isEditingTeam, setIsEditingTeam] = useState(false);

    if (viewingPlayerId) {
        const viewingPlayer = team?.players?.find(p => p.id === viewingPlayerId);
        if (viewingPlayer) {
            return (
                <PlayerDetailsPage
                    player={viewingPlayer}
                    team={team}
                    match={match}
                    opponentTeam={opponentTeam}
                    tournament={tournament}
                    matches={matches}
                    teams={teams}
                    tournamentId={tournamentId}
                    isMatchLive={isMatchLive}
                    updateTeam={updateTeam}
                    onBack={() => setViewingPlayerId(null)}
                />
            );
        }
    }

    return (
        <div className="absolute inset-0 z-50 bg-secondary flex flex-col h-full w-full select-none safe-pad-t safe-pad-r safe-pad-l">
            {/* Header */}
            <div className="bg-primary px-4 py-4 sticky top-0 z-10 border-b border-brand-blue/15 shadow-sm flex justify-between items-center relative h-16">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 text-text-primary hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95 touch-manipulation z-20"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="absolute inset-0 flex items-center justify-center space-x-2 pointer-events-none">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: team?.logo || '#3b82f6' }}>
                        {(team?.name || 'Unknown Team').substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-lg text-text-primary truncate max-w-[200px]">{team?.name || 'Unknown Team'}</span>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto pb-safe">
                {/* Team Summary */}
                <div className="p-4 bg-primary border-b border-brand-blue/15">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">{team?.name || 'Unknown Team'}</h2>
                            <p className="text-sm text-text-secondary mt-0.5">{(team?.players || []).length} Players</p>
                        </div>
                        <button 
                            onClick={() => setIsEditingTeam(true)}
                            className="bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors font-bold px-4 py-2 rounded-xl text-sm"
                        >
                            Manage Squad
                        </button>
                    </div>
                    <div className="flex gap-4">
                        {team?.captainId && (
                            <div className="bg-secondary px-3 py-1.5 rounded-lg border border-brand-blue/10">
                                <span className="text-xs text-text-secondary block font-medium">Captain</span>
                                <span className="text-sm text-text-primary font-bold">
                                    {(team?.players || []).find(p => p.id === team.captainId)?.name || 'Unknown Player'}
                                </span>
                            </div>
                        )}
                        {team?.viceCaptainId && (
                            <div className="bg-secondary px-3 py-1.5 rounded-lg border border-brand-blue/10">
                                <span className="text-xs text-text-secondary block font-medium">Vice Captain</span>
                                <span className="text-sm text-text-primary font-bold">
                                    {(team?.players || []).find(p => p.id === team.viceCaptainId)?.name || 'Unknown Player'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Players List */}
                <div className="p-4 max-w-3xl mx-auto w-full">
                    <div className="space-y-2">
                        {(team?.players || []).map(player => {
                            const isCaptain = player.id === team?.captainId;
                            const isViceCaptain = player.id === team?.viceCaptainId;
                            
                            const replacement = match?.replacements?.find(r => r.incomingPlayerId === player.id);
                            const replacementTag = replacement ? (
                                <span className={`ml-2 flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${replacement.reason === 'Impact Player' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                                    {replacement.reason === 'Impact Player' ? 'IP' : 'Sub'}
                                </span>
                            ) : null;

                            return (
                                <div 
                                    key={player.id} 
                                    className="flex items-center gap-3 p-3 bg-primary rounded-xl shadow-sm border border-brand-blue/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    onClick={() => setViewingPlayerId(player.id)}
                                >
                                    <div className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg bg-secondary text-text-primary overflow-hidden shadow-inner">
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            {getRoleIcon(player?.role)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <span className="font-bold text-text-primary text-base mr-1 truncate">
                                                {player?.name || 'Unknown Player'}
                                            </span>
                                            {isCaptain && <span className="flex-shrink-0 text-[10px] font-bold text-warning bg-warning/100/20 px-1.5 rounded-2xl border border-warning/30">C</span>}
                                            {isViceCaptain && <span className="flex-shrink-0 text-[10px] font-bold text-slate-600 bg-gray-500/20 px-1.5 rounded-2xl border border-gray-400">VC</span>}
                                            {player?.role === 'Wicket Keeper' && <span className="flex-shrink-0 text-[10px] font-bold text-purple-600 bg-purple-500/20 px-1.5 rounded-2xl border border-purple-400">WK</span>}
                                            {replacementTag}
                                        </div>
                                        <span className="text-xs text-text-secondary mt-0.5 truncate block">{player?.role || 'Role not set'}</span>
                                    </div>
                                    <div className="flex items-center text-brand-blue opacity-50 pr-2">
                                        <ChevronLeft size={20} className="rotate-180" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {isEditingTeam && updateTeam && getTournamentById && addPlayer && deletePlayer && matches && (
                <TeamEditorModal
                    team={team}
                    tournamentId={tournamentId || match.tournamentId || ''}
                    updateTeam={updateTeam}
                    getTournamentById={getTournamentById}
                    addPlayer={addPlayer}
                    deletePlayer={deletePlayer}
                    matches={matches}
                    addPlayerReplacement={addPlayerReplacement}
                    onClose={() => setIsEditingTeam(false)}
                    isMatchLive={isMatchLive}
                />
            )}
        </div>
    );
};

export default TeamDetailsPage;
