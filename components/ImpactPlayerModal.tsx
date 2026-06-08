import React, { useState, useMemo } from 'react';
import type { Match, Team, Player } from '../types';
import { PlayerRole as PlayerRoleEnum } from '../types';
import CrickIQCard from './CrickIQCard';
import { useCrickIQState } from '../hooks/useCrickIQState';
import { PLAYER_ROLES, getShortRoleName, getRoleEmoji } from '../constants';
import { useNotification } from '../hooks/useNotification';
import { getEffectiveSquadIds, getEffectiveSquadPlayers } from '../utils/matchConfig';
import { generateGlobalPlayerId } from '../utils/idGenerator';
import { getPlayerDuplicateWarnings } from '../utils/playerLinking';

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'blue' }> = ({ children, className, variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses =
        variant === 'secondary' ? ' text-gray-800 bg-white dark:text-text-primary hover:brightness-105 border border-gray-300 focus:ring-gray-300'
        : variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600'
        : 'bg-brand-blue text-white focus:ring-brand-blue';

    return <button {...props} className={`${baseClasses} ${variantClasses} ${className || ''}`}>{children}</button>
}

function canReplacePlayer(match: Match, outgoingPlayerId: string): boolean {
    if (match.status === 'completed' || match.wasAbandoned) return false;
    
    // Check if player batted
    if (match.innings1?.batsmanScores[outgoingPlayerId] || match.innings2?.batsmanScores[outgoingPlayerId]) {
        return false;
    }
    
    // Check if player bowled
    if (match.innings1?.bowlerScores[outgoingPlayerId] || match.innings2?.bowlerScores[outgoingPlayerId]) {
        return false;
    }
    
    // Check if currently batting
    if (match.innings1?.currentBatsmen.includes(outgoingPlayerId) || match.innings2?.currentBatsmen.includes(outgoingPlayerId)) return false;

    // Check if currently bowling
    if (match.innings1?.currentBowler === outgoingPlayerId || match.innings2?.currentBowler === outgoingPlayerId) return false;

    return true;
}

interface ImpactPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: Match;
    team: Team | undefined;
    teams?: Team[];
    updateTeam: (team: Team) => void;
    addPlayerReplacement: ReturnType<typeof useCrickIQState>['addPlayerReplacement'];
}

export const ImpactPlayerModal: React.FC<ImpactPlayerModalProps> = ({ isOpen, onClose, match, team, teams = [], updateTeam, addPlayerReplacement }) => {
    const { showNotification } = useNotification();
    const [selectedOutgoingPlayer, setSelectedOutgoingPlayer] = useState<string>('');
    const [selectedIncomingPlayer, setSelectedIncomingPlayer] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isAddingNewPlayer, setIsAddingNewPlayer] = useState<boolean>(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

    // New Player form state
    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState<number | ''>('');
    const [newRole, setNewRole] = useState<PlayerRoleEnum | ''>('');
    const [acknowledgedWarning, setAcknowledgedWarning] = useState<boolean>(false);

    const duplicateWarnings = useMemo(() => {
        if (!team) return null;
        return getPlayerDuplicateWarnings({
            player: {
                name: newName,
            },
            currentTeam: team,
            allTeams: teams,
            mode: 'add'
        });
    }, [newName, team, teams]);

    // Existing replaced players
    const replacedPlayerIds = useMemo(() => match.replacements?.map(r => r.outgoingPlayerId) || [], [match.replacements]);

    const effectiveSquadPlayers = useMemo(() => {
        return getEffectiveSquadPlayers(team, match);
    }, [team, match]);

    const eligibleOutgoingPlayers = useMemo(() => {
        return effectiveSquadPlayers.filter(p => !replacedPlayerIds.includes(p.id) && canReplacePlayer(match, p.id));
    }, [effectiveSquadPlayers, match, replacedPlayerIds]);

    const unusedIncomingPlayers = useMemo(() => {
        if (!team || !match) return [];
        const effectiveSquadIds = getEffectiveSquadIds(match, team.id);
        const alreadyIncomingIds = match.replacements?.map(r => r.incomingPlayerId) || [];
        const alreadyOutgoingIds = match.replacements?.map(r => r.outgoingPlayerId) || [];
        
        return team.players.filter(p => 
            !p.isArchived &&
            !effectiveSquadIds.includes(p.id) && 
            !alreadyIncomingIds.includes(p.id) &&
            !alreadyOutgoingIds.includes(p.id)
        );
    }, [team, match]);

    const filteredIncomingPlayers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return unusedIncomingPlayers;
        return unusedIncomingPlayers.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.number.toString().includes(query)
        );
    }, [unusedIncomingPlayers, searchQuery]);

    const outgoingPlayerObj = useMemo(() => {
        if (!team) return null;
        return team.players.find(p => p.id === selectedOutgoingPlayer);
    }, [team, selectedOutgoingPlayer]);

    const incomingPlayerObj = useMemo(() => {
        if (!team) return null;
        return team.players.find(p => p.id === selectedIncomingPlayer);
    }, [team, selectedIncomingPlayer]);

    if (!isOpen || !team) return null;

    if (eligibleOutgoingPlayers.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <CrickIQCard className="max-w-md w-full">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Player Replacement</h3>
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                        No eligible replacement available for {team.name}. Only players who have not benched, batted or bowled can be replaced.
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </CrickIQCard>
            </div>
        );
    }

    const handleSaveNewPlayer = () => {
        if (!newName.trim() || !newNumber || !newRole) {
            showNotification("Please fill all new player details", "error");
            return;
        }
        if (team.players.some(p => p.number === Number(newNumber))) {
            showNotification("Player number already exists in team", "error");
            return;
        }

        if (duplicateWarnings?.hasBlockingDuplicate) {
            showNotification(duplicateWarnings.warnings[0] || 'Player already exists.', 'error');
            return;
        }

        if (duplicateWarnings && duplicateWarnings.warnings.length > 0 && !acknowledgedWarning) {
            // we will let the UI handle showing the warning before they click again or something,
            // but just in case:
            setAcknowledgedWarning(true);
            return;
        }

        const newPlayer: Player = {
            id: `p_${Date.now()}`,
            globalPlayerId: generateGlobalPlayerId(),
            name: newName.trim(),
            number: Number(newNumber),
            role: newRole as PlayerRoleEnum,
        };

        updateTeam({
            ...team,
            players: [...team.players, newPlayer]
        });

        setSelectedIncomingPlayer(newPlayer.id);
        setIsAddingNewPlayer(false);
        setNewName('');
        setNewNumber('');
        setNewRole('');

        showNotification(`Player ${newPlayer.name} added to ${team.name} and selected as incoming`, "success");
    };

    const handleUseExisting = (p: Player) => {
        if (!unusedIncomingPlayers.some(ip => ip.id === p.id)) {
            showNotification("This player is not eligible as replacement.", "error");
            return;
        }
        setIsAddingNewPlayer(false);
        setSelectedIncomingPlayer(p.id);
        setNewName('');
        setNewNumber('');
        setNewRole('');
    };

    const handleConfirmClick = () => {
        if (!selectedOutgoingPlayer) {
            showNotification("Please select an outgoing player", "error");
            return;
        }
        if (!selectedIncomingPlayer) {
            showNotification("Please select an incoming player", "error");
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleExecuteReplacement = () => {
        if (!selectedOutgoingPlayer || !selectedIncomingPlayer) return;

        addPlayerReplacement(match.id, team.id, selectedOutgoingPlayer, selectedIncomingPlayer, "Impact Player");
        showNotification("Player replaced successfully", "success");
        
        setSelectedOutgoingPlayer('');
        setSelectedIncomingPlayer('');
        setShowConfirmDialog(false);
        onClose();
    };

    const handleCancelAll = () => {
        setSelectedOutgoingPlayer('');
        setSelectedIncomingPlayer('');
        setIsAddingNewPlayer(false);
        setShowConfirmDialog(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <CrickIQCard className="max-w-md w-full relative">
                <button onClick={handleCancelAll} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {showConfirmDialog ? (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Replacement?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Are you sure you want to perform this replacement for <span className="font-bold text-gray-955 dark:text-white">{team.name}</span>?
                        </p>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800/80 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Leaving (Outgoing):</span>
                                <span className="font-bold text-red-600">#{outgoingPlayerObj?.number} {outgoingPlayerObj?.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Entering (Incoming):</span>
                                <span className="font-bold text-green-600">#{incomingPlayerObj?.number} {incomingPlayerObj?.name}</span>
                            </div>
                        </div>

                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            This will replace {outgoingPlayerObj?.name} with {incomingPlayerObj?.name} for this match only. Existing scorecard data will not be modified.
                        </p>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button onClick={() => setShowConfirmDialog(false)} variant="secondary" className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleExecuteReplacement} variant="danger" className="flex-1">
                                Confirm
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Replace Player</h3>
                            <div className="flex items-center gap-2 mt-1 mb-2">
                                <span className="text-xs px-2 py-0.5 font-bold rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-450 uppercase">Team</span>
                                <span className="text-sm font-bold text-brand-blue">{team.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 pb-3 border-b border-gray-100 dark:border-gray-800">
                                Substitute a player who has not participated yet.
                            </p>
                        </div>

                        {/* Outgoing Player Section */}
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Outgoing Player</label>
                            <select 
                                value={selectedOutgoingPlayer} 
                                onChange={e => setSelectedOutgoingPlayer(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm dark:text-white"
                            >
                                <option value="">Select player leaving...</option>
                                {eligibleOutgoingPlayers.map(p => (
                                    <option key={p.id} value={p.id}>
                                        #{p.number} {p.name} ({getShortRoleName(p.role)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Incoming Player Section */}
                        <div className="space-y-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Incoming Player</label>
                            
                            {isAddingNewPlayer ? (
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-750 dark:text-gray-300">New Player Details</span>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsAddingNewPlayer(false);
                                                setNewName('');
                                                setNewNumber('');
                                                setNewRole('');
                                            }}
                                            className="text-xs text-red-650 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input 
                                            type="number" 
                                            placeholder="Jersey Number" 
                                            value={newNumber} 
                                            onChange={e => setNewNumber(e.target.value ? Number(e.target.value) : '')}
                                            className="p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm rounded-lg"
                                        />
                                        <select 
                                            value={newRole} 
                                            onChange={e => setNewRole(e.target.value as PlayerRoleEnum)}
                                            className="p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm rounded-lg"
                                        >
                                            <option value="">Select Role</option>
                                            {PLAYER_ROLES.map(role => <option key={role} value={role}>{getRoleEmoji(role)} {getShortRoleName(role)}</option>)}
                                        </select>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Player Name" 
                                        value={newName} 
                                        onChange={e => { setNewName(e.target.value); setAcknowledgedWarning(false); }}
                                        className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white text-sm rounded-lg"
                                    />
                                    
                                    {duplicateWarnings && duplicateWarnings.warnings.length > 0 && (
                                        <div className={`p-3 rounded-lg border text-xs space-y-2 ${duplicateWarnings.hasBlockingDuplicate ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:bg-red-500/5 dark:text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:bg-amber-500/5 dark:text-amber-400'}`}>
                                            <div className="font-bold">
                                                {duplicateWarnings.hasBlockingDuplicate ? 'Exact Duplicate Detected' : 'Similar Player Detected'}
                                            </div>
                                            <div>
                                                {duplicateWarnings.warnings.map((w, i) => <div key={i}>{w}</div>)}
                                            </div>
                                            
                                            {duplicateWarnings.sameTeamDuplicates.length > 0 && (
                                                <div className="pt-2 flex flex-col gap-2">
                                                    {duplicateWarnings.sameTeamDuplicates.map(dp => (
                                                        <div key={dp.id} className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-2 rounded">
                                                            <span className="font-semibold text-gray-800 dark:text-gray-200">#{dp.number} {dp.name}</span>
                                                            <Button type="button" onClick={() => handleUseExisting(dp)} className="py-1 px-2 text-[10px]">
                                                                Use Existing
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!duplicateWarnings?.hasBlockingDuplicate && (
                                        <Button 
                                            type="button" 
                                            onClick={handleSaveNewPlayer}
                                            variant={duplicateWarnings && duplicateWarnings.warnings.length > 0 && !acknowledgedWarning ? 'danger' : 'blue'}
                                            className="w-full py-1.5 text-xs font-bold rounded-lg"
                                        >
                                            {duplicateWarnings && duplicateWarnings.warnings.length > 0 && !acknowledgedWarning ? 'Create Anyway (Confirm)' : 'Save New Player'}
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            placeholder="Search team pool..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingNewPlayer(true)}
                                            className="px-3 py-2 bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue text-xs font-bold rounded-lg hover:bg-brand-blue hover:text-white transition-colors shrink-0"
                                        >
                                            + Add New Player
                                        </button>
                                    </div>
                                    
                                    {filteredIncomingPlayers.length > 0 ? (
                                        <select
                                            value={selectedIncomingPlayer}
                                            onChange={e => setSelectedIncomingPlayer(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl text-sm bg-white"
                                        >
                                            <option value="">Select incoming player...</option>
                                            {filteredIncomingPlayers.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    #{p.number} {p.name} ({getShortRoleName(p.role)})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm text-center rounded-xl border border-gray-200 dark:border-gray-700">
                                            No matching replacement player found.<br/>
                                            You can add a new replacement player if allowed.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Summary View */}
                        {outgoingPlayerObj && incomingPlayerObj && (
                            <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                                <div className="text-[10px] uppercase tracking-wider text-blue-500 font-bold mb-1">Replacement Summary</div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        #{outgoingPlayerObj.number} {outgoingPlayerObj.name}
                                    </span>
                                    <span className="text-blue-500 font-bold">➔</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        #{incomingPlayerObj.number} {incomingPlayerObj.name}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-between gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                            <Button onClick={handleCancelAll} variant="secondary" className="flex-1">
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirmClick} 
                                disabled={!selectedOutgoingPlayer || !selectedIncomingPlayer}
                                variant="danger" 
                                className="flex-1"
                            >
                                Confirm Replacement
                            </Button>
                        </div>
                    </div>
                )}
            </CrickIQCard>
        </div>
    );
}

export default ImpactPlayerModal;
