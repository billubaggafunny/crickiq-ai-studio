import React, { useState, useMemo } from 'react';
import { Player, Team, Match, PlayerRole, Tournament, Innings } from '../types';
import { ChevronLeft, Edit2, X, Info } from 'lucide-react';
import { getRoleIcon, PLAYER_ROLES } from '../constants';
import { validatePlayer } from '../utils/validation';
import { useNotification } from '../hooks/useNotification';

interface PlayerDetailsPageProps {
    player: Player;
    team: Team;
    match: Match;
    opponentTeam?: Team;
    tournament?: Tournament;
    matches?: Match[];
    tournamentId?: string;
    isMatchLive?: boolean;
    updateTeam?: (team: Team) => void;
    onBack: () => void;
}

const PlayerDetailsPage: React.FC<PlayerDetailsPageProps> = ({
    player,
    team,
    match,
    opponentTeam,
    tournament,
    matches = [],
    tournamentId,
    isMatchLive = false,
    updateTeam,
    onBack
}) => {
    const { showNotification } = useNotification();
    const isCaptain = player?.id === team?.captainId;
    const isViceCaptain = player?.id === team?.viceCaptainId;
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    // Form state
    const [editName, setEditName] = useState(player?.name || '');
    const [editNumber, setEditNumber] = useState<number | string>(player?.number !== undefined ? player.number : '');
    const [editRole, setEditRole] = useState(player?.role || '');
    const [editIsCaptain, setEditIsCaptain] = useState(isCaptain);
    const [editIsViceCaptain, setEditIsViceCaptain] = useState(isViceCaptain);
    const [errors, setErrors] = useState<{name: string | null, number: string | null, role: string | null}>({name: null, number: null, role: null});

    // Check if player editing should be locked
    const activeMatchForLock = useMemo(() => {
        if (isMatchLive) {
            return matches.find(m => m.status === 'live');
        }
        return matches.find(m => 
            m.tournamentId === tournamentId && 
            (m.team1Id === team.id || m.team2Id === team.id) &&
            (
                m.status === 'live' || 
                m.status === 'completed' || 
                m.wasAbandoned === true || 
                m.toss !== undefined ||
                (m.innings1 !== undefined && m.innings1.overs && m.innings1.overs.length > 0)
            )
        );
    }, [matches, tournamentId, team.id, isMatchLive]);

    const isEditingLocked = !!activeMatchForLock;

    const handleOpenEdit = () => {
        // Reset form state to current player
        setEditName(player?.name || '');
        setEditNumber(player?.number !== undefined ? player.number : '');
        setEditRole(player?.role || '');
        setEditIsCaptain(player?.id === team?.captainId);
        setEditIsViceCaptain(player?.id === team?.viceCaptainId);
        setErrors({name: null, number: null, role: null});
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (!player || !team || !updateTeam) return;

        if (isEditingLocked) {
            showNotification('Player editing is locked because the match has started or toss has been completed.', 'error');
            return;
        }

        const filteredPlayers = team.players.filter(p => p.id !== player.id);
        const validation = validatePlayer(editName, editNumber, editRole, filteredPlayers);
        
        if (!validation.valid) {
            setErrors(validation.errors as {name: string | null, number: string | null, role: string | null});
            showNotification('Please fix errors before saving.', 'error');
            return;
        }

        const updatedPlayer = {
            ...player,
            name: editName.trim(),
            number: Number(editNumber),
            role: editRole as PlayerRole
        };

        const updatedTeam = {
            ...team,
            players: team.players.map(p => p.id === player.id ? updatedPlayer : p)
        };

        // Handle Captaincy logic (ensure a player isn't both captain and vice captain)
        if (editIsCaptain && updatedTeam.viceCaptainId === player.id) {
            updatedTeam.viceCaptainId = null;
        }
        if (editIsViceCaptain && updatedTeam.captainId === player.id) {
            updatedTeam.captainId = null;
        }

        if (editIsCaptain) {
            updatedTeam.captainId = player.id;
        } else if (updatedTeam.captainId === player.id) {
            updatedTeam.captainId = null;
        }

        if (editIsViceCaptain) {
            updatedTeam.viceCaptainId = player.id;
        } else if (updatedTeam.viceCaptainId === player.id) {
            updatedTeam.viceCaptainId = null;
        }

        updateTeam(updatedTeam);
        showNotification('Player updated successfully.', 'success');
        setIsEditModalOpen(false);
    };

    // Derived Match Context
    const matchName = opponentTeam ? `${team.name} vs ${opponentTeam.name}` : `Match vs Opponent`;

    // Derived Participation Snapshot
    let hasBatted = false;
    let hasBowled = false;
    let isCurrentBatter = false;
    let isCurrentBowler = false;
    let isOut = false;
    
    let retiredNote: string | null = null;
    let replacementNote: string | null = null;
    
    const checkInnings = (innings: Innings | undefined) => {
        if (!innings) return;
        if (innings.batsmanScores?.[player.id]) {
            hasBatted = true;
            if (innings.batsmanScores[player.id].status === 'Out') isOut = true;
            if (innings.batsmanScores[player.id].status === 'Retired Hurt') {
                isOut = true;
                retiredNote = 'Retired Hurt';
            }
        }
        if (innings.bowlerScores?.[player.id]) {
            hasBowled = true;
        }
        if (innings.currentBatsmen?.includes(player.id)) {
            isCurrentBatter = true;
        }
        if (innings.currentBowler === player.id) {
            isCurrentBowler = true;
        }
    };
    
    checkInnings(match.innings1);
    checkInnings(match.innings2);
    
    if (match.replacements) {
        const outRep = match.replacements.find(r => r.outgoingPlayerId === player.id);
        const inRep = match.replacements.find(r => r.incomingPlayerId === player.id);
        
        if (outRep) {
            const inPlayer = team?.players?.find(p => p.id === outRep.incomingPlayerId);
            replacementNote = `Replaced by ${inPlayer?.name || 'another player'}${outRep.reason ? ` - ${outRep.reason}` : ''}`;
        }
        if (inRep) {
            const outPlayer = team?.players?.find(p => p.id === inRep.outgoingPlayerId);
            replacementNote = `Replacement for ${outPlayer?.name || 'another player'}${inRep.reason ? ` - ${inRep.reason}` : ''}`;
        }
    }
    
    return (
        <div className="absolute inset-0 z-50 bg-secondary flex flex-col h-full w-full select-none safe-pad-t safe-pad-r safe-pad-l">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-primary text-text-primary border-b border-brand-blue/15 relative">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
                    aria-label="Go back"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="absolute inset-0 flex items-center justify-center space-x-2 pointer-events-none">
                    <span className="font-bold text-lg text-text-primary truncate max-w-[200px]">{player?.name || 'Unknown Player'}</span>
                </div>
                <div className="w-10 flex justify-end">
                    {updateTeam && (
                        <button
                            onClick={handleOpenEdit}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors z-10 text-brand-blue"
                            aria-label="Edit player"
                        >
                            <Edit2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 bg-primary border-b border-brand-blue/15">
                    <div className="flex flex-col items-center justify-center mb-6 mt-4">
                        <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-secondary text-text-primary overflow-hidden shadow-inner border border-brand-blue/10 mb-4">
                            <div className="w-full h-full flex flex-col items-center justify-center scale-150">
                                {getRoleIcon(player?.role)}
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary text-center">
                            {player?.name || 'Unknown Player'}
                        </h2>
                        <p className="text-sm text-text-secondary mt-1 text-center">
                            {team?.name || 'Unknown Team'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-secondary p-4 rounded-xl border border-brand-blue/10 flex flex-col">
                            <span className="text-xs text-text-secondary block font-medium mb-1">Role</span>
                            <span className="text-sm text-text-primary font-bold">{player?.role || 'Role not set'}</span>
                        </div>
                        {player?.number !== undefined && (
                            <div className="bg-secondary p-4 rounded-xl border border-brand-blue/10 flex flex-col">
                                <span className="text-xs text-text-secondary block font-medium mb-1">Jersey Number</span>
                                <span className="text-sm text-text-primary font-bold">{player.number}</span>
                            </div>
                        )}
                        {(isCaptain || isViceCaptain || player?.role === 'Wicket Keeper') && (
                            <div className="bg-secondary p-4 rounded-xl border border-brand-blue/10 flex flex-col min-w-0">
                                <span className="text-xs text-text-secondary block font-medium mb-1">Tags</span>
                                <div className="flex gap-2">
                                    {isCaptain && <span className="inline-block text-[10px] font-bold text-warning bg-warning/100/20 px-2 py-0.5 rounded-2xl border border-warning/30">C</span>}
                                    {isViceCaptain && <span className="inline-block text-[10px] font-bold text-slate-600 bg-gray-500/20 px-2 py-0.5 rounded-2xl border border-gray-400">VC</span>}
                                    {player?.role === 'Wicket Keeper' && <span className="inline-block text-[10px] font-bold text-purple-600 bg-purple-500/20 px-2 py-0.5 rounded-2xl border border-purple-400">WK</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* Match Context */}
                    <div className="bg-primary rounded-xl border border-brand-blue/10 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-brand-blue/10 bg-brand-blue/5 flex items-center gap-2">
                            <Info size={16} className="text-brand-blue" />
                            <h3 className="font-bold text-sm text-brand-blue">Match Context</h3>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-text-secondary">Match Name</span>
                                <span className="text-sm font-medium text-text-primary text-right">{matchName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-text-secondary">Match Type</span>
                                <span className="text-sm font-medium text-text-primary">{match.isQuickMatch ? 'Quick Match' : 'Tournament Match'}</span>
                            </div>
                            {tournament?.name && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-text-secondary">Tournament</span>
                                    <span className="text-sm font-medium text-text-primary text-right">{tournament.name}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-sm text-text-secondary">Status</span>
                                <span className="text-sm font-medium text-text-primary capitalize">{match.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Participation Snapshot */}
                    <div className="bg-primary rounded-xl border border-brand-blue/10 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-brand-blue/10 bg-brand-blue/5 flex items-center gap-2">
                            <Info size={16} className="text-brand-blue" />
                            <h3 className="font-bold text-sm text-brand-blue">Participation Snapshot</h3>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
                            <div className="p-3 flex justify-between items-center bg-primary">
                                <span className="text-xs text-text-secondary">Has Batted</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${hasBatted ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{hasBatted ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="p-3 flex justify-between items-center bg-primary">
                                <span className="text-xs text-text-secondary">Has Bowled</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${hasBowled ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{hasBowled ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="p-3 flex justify-between items-center bg-primary">
                                <span className="text-xs text-text-secondary">Is Out</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isOut ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{isOut ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="p-3 flex justify-between items-center bg-primary">
                                <span className="text-xs text-text-secondary">Current Batter</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isCurrentBatter ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{isCurrentBatter ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="p-3 flex justify-between items-center bg-primary">
                                <span className="text-xs text-text-secondary">Current Bowler</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isCurrentBowler ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{isCurrentBowler ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {(retiredNote || replacementNote) && (
                        <div className="bg-primary rounded-xl border border-brand-blue/10 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-brand-blue/10 bg-brand-blue/5 flex items-center gap-2">
                                <Info size={16} className="text-brand-blue" />
                                <h3 className="font-bold text-sm text-brand-blue">Notes</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {retiredNote && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200/50 dark:border-yellow-900/30">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Retired: {retiredNote}</p>
                                    </div>
                                )}
                                {replacementNote && (
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200/50 dark:border-blue-900/30">
                                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{replacementNote}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {updateTeam && (
                        <div className="pt-4 pb-8 flex justify-center">
                            <button
                                onClick={handleOpenEdit}
                                className="bg-brand-blue/10 text-brand-blue font-bold px-6 py-3 rounded-xl text-sm hover:bg-brand-blue/20 transition-colors flex items-center gap-2"
                            >
                                <Edit2 size={16} /> Edit Player
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide up panel for Edit Player */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[60] flex flex-col justify-end">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsEditModalOpen(false)}
                    />
                    
                    {/* Panel */}
                    <div className="bg-primary rounded-t-3xl w-full max-w-md mx-auto relative z-10 animate-slide-up pb-safe shadow-2xl border-t border-brand-blue/15 flex flex-col max-h-[85vh]">
                        <div className="flex-shrink-0 w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto my-3" />
                        
                        <div className="flex-shrink-0 p-4 pb-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-text-primary">Edit Player</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 -mr-2 text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-95 touch-manipulation">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {isEditingLocked ? (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-xl text-sm flex items-start gap-3 border border-yellow-200 dark:border-yellow-800/50">
                                    Player editing is locked because the match has started or toss has been completed.
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-secondary border border-brand-blue/15 rounded-xl px-4 py-3 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-text-primary transition-all text-base"
                                            placeholder="Player Name"
                                        />
                                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Jersey Number</label>
                                        <input
                                            type="number"
                                            value={editNumber}
                                            onChange={(e) => setEditNumber(e.target.value)}
                                            className="w-full bg-secondary border border-brand-blue/15 rounded-xl px-4 py-3 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-text-primary transition-all text-base"
                                            placeholder="Jersey #"
                                        />
                                        {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PLAYER_ROLES.map(role => (
                                                <button
                                                    key={role}
                                                    onClick={() => setEditRole(role)}
                                                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                                                        editRole === role 
                                                            ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                                                            : 'bg-secondary border-brand-blue/15 text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                        {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                                        <label className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-brand-blue/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={editIsCaptain}
                                                onChange={(e) => {
                                                    setEditIsCaptain(e.target.checked);
                                                    if (e.target.checked) setEditIsViceCaptain(false);
                                                }}
                                                className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                                            />
                                            <span className="text-text-primary font-medium">Captain</span>
                                        </label>
                                        
                                        <label className="flex items-center gap-3 p-3 bg-secondary rounded-xl border border-brand-blue/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={editIsViceCaptain}
                                                onChange={(e) => {
                                                    setEditIsViceCaptain(e.target.checked);
                                                    if (e.target.checked) setEditIsCaptain(false);
                                                }}
                                                className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                                            />
                                            <span className="text-text-primary font-medium">Vice Captain</span>
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="flex-shrink-0 p-4 pt-2">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-secondary text-text-primary border border-gray-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {isEditingLocked ? 'Close' : 'Cancel'}
                                </button>
                                {!isEditingLocked && (
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 py-3 px-4 rounded-xl font-bold bg-brand-blue text-white hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20"
                                    >
                                        Save Changes
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerDetailsPage;
