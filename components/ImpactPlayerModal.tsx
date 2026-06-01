import React, { useState, useMemo } from 'react';
import type { Match, Team, Player } from '../types';
import { PlayerRole as PlayerRoleEnum } from '../types';
import CrickIQCard from './CrickIQCard';
import { useCrickIQState } from '../hooks/useCrickIQState';
import { PLAYER_ROLES, getShortRoleName, getRoleEmoji } from '../constants';
import { useNotification } from '../hooks/useNotification';

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
    updateTeam: (team: Team) => void;
    addPlayerReplacement: ReturnType<typeof useCrickIQState>['addPlayerReplacement'];
}

export const ImpactPlayerModal: React.FC<ImpactPlayerModalProps> = ({ isOpen, onClose, match, team, updateTeam, addPlayerReplacement }) => {
    const { showNotification } = useNotification();
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedOutgoingPlayer, setSelectedOutgoingPlayer] = useState<string>('');
    const [creationMode, setCreationMode] = useState<boolean>(true);
    const [selectedIncomingPlayer, setSelectedIncomingPlayer] = useState<string>('');

    // New Player info
    const [newName, setNewName] = useState('');
    const [newNumber, setNewNumber] = useState<number | ''>('');
    const [newRole, setNewRole] = useState<PlayerRoleEnum | ''>('');

    // Existing replaced players
    const replacedPlayerIds = useMemo(() => match.replacements?.map(r => r.outgoingPlayerId) || [], [match.replacements]);

    const eligibleOutgoingPlayers = useMemo(() => {
        if (!team) return [];
        return team.players.filter(p => !replacedPlayerIds.includes(p.id) && canReplacePlayer(match, p.id));
    }, [team, match, replacedPlayerIds]);

    const unusedIncomingPlayers = useMemo(() => {
        if (!team) return [];
        // Available to replace IN: players who aren't currently playing in this match. BUT since everyone in team counts as playing basically...
        // We'll just allow any player who hasn't batted/bowled and isn't replaced.
        // Actually, this is highly confusing if no "Squad" vs "XI" exists.
        // Easiest is just force creation of a new player since tournament limits the team anyway.
        return team.players.filter(p => !replacedPlayerIds.includes(p.id) && canReplacePlayer(match, p.id) && p.id !== selectedOutgoingPlayer);
    }, [team, match, replacedPlayerIds, selectedOutgoingPlayer]);

    if (!isOpen || !team) return null;

    if (eligibleOutgoingPlayers.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <CrickIQCard className="max-w-md w-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Impact Player Replacement</h3>
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                        No eligible replacement available. Only players who have not batted or bowled can be replaced.
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </CrickIQCard>
            </div>
        );
    }

    const handleConfirm = () => {
        if (!selectedOutgoingPlayer) return;

        let incomingId = selectedIncomingPlayer;

        if (creationMode) {
            if (!newName.trim() || !newNumber || !newRole) {
                showNotification("Please fill all new player details", "error");
                return;
            }
            if (team.players.some(p => p.number === Number(newNumber))) {
                showNotification("Player number already exists in team", "error");
                return;
            }

            const newPlayer: Player = {
                id: `p_${Date.now()}`,
                name: newName.trim(),
                number: Number(newNumber),
                role: newRole as PlayerRoleEnum,
            };

            updateTeam({
                ...team,
                players: [...team.players, newPlayer]
            });
            
            incomingId = newPlayer.id;
        } else {
            if (!incomingId) {
                showNotification("Please select an incoming player", "error");
                return;
            }
        }

        addPlayerReplacement(match.id, team.id, selectedOutgoingPlayer, incomingId, "Impact Player");
        showNotification("Player replaced successfully", "success");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <CrickIQCard className="max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Emergency Replacement</h3>
                <p className="text-sm text-gray-500 border-b border-gray-100 pb-4 mb-4">
                    Replace a player who hasn't participated yet. This will replace the selected player for the remaining match. Existing scorecard data will not be changed.
                </p>

                {step === 1 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Select Outgoing Player</label>
                            <select 
                                value={selectedOutgoingPlayer} 
                                onChange={e => setSelectedOutgoingPlayer(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                            >
                                <option value="">Select player to replace...</option>
                                {eligibleOutgoingPlayers.map(p => (
                                    <option key={p.id} value={p.id}>
                                        #{p.number} {p.name} ({getShortRoleName(p.role)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button 
                                onClick={() => setStep(2)} 
                                disabled={!selectedOutgoingPlayer}
                                variant="primary"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <div className="flex gap-2 mb-4">
                                <button 
                                    className={`flex-1 py-1 px-2 text-sm font-bold rounded-lg border \${creationMode ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200'}`}
                                    onClick={() => setCreationMode(true)}
                                >
                                    New Player
                                </button>
                                <button 
                                    className={`flex-1 py-1 px-2 text-sm font-bold rounded-lg border \${!creationMode ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-600 border-gray-200'}`}
                                    onClick={() => setCreationMode(false)}
                                >
                                    Existing Player
                                </button>
                            </div>

                            {creationMode ? (
                                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <input 
                                        type="number" placeholder="Jersey Number" 
                                        value={newNumber} onChange={e => setNewNumber(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                    />
                                    <input 
                                        type="text" placeholder="Player Name" 
                                        value={newName} onChange={e => setNewName(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                    />
                                    <select 
                                        value={newRole} onChange={e => setNewRole(e.target.value as PlayerRoleEnum)}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Select Role</option>
                                        {PLAYER_ROLES.map(role => <option key={role} value={role}>{getRoleEmoji(role)} {getShortRoleName(role)}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <select 
                                        value={selectedIncomingPlayer} 
                                        onChange={e => setSelectedIncomingPlayer(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50"
                                    >
                                        <option value="">Select incoming player...</option>
                                        {unusedIncomingPlayers.map(p => (
                                            <option key={p.id} value={p.id}>
                                                #{p.number} {p.name} ({getShortRoleName(p.role)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-between">
                            <Button onClick={() => setStep(1)} variant="secondary">Back</Button>
                            <Button onClick={handleConfirm} variant="danger">Confirm Replacement</Button>
                        </div>
                    </div>
                )}
            </CrickIQCard>
        </div>
    );
}

export default ImpactPlayerModal;
