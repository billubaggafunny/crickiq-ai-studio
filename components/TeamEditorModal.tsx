import { Table, Thead, Tbody, Tr, Th, Td } from './CrickIQTable';
import React, { useState, useMemo } from 'react';
import type { Team, Player } from '../types';
import { PlayerRole } from '../types';
import { validatePlayer } from '../utils/validation';
import { PLAYER_ROLES, PlusIcon, TrashIcon, getRoleEmoji, getShortRoleName } from '../constants';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../hooks/useNotification';
import { calculatePlayerCareerStats } from '../utils/cricketLogic';
import { localStorageAdapter } from '../storage/localStorageAdapter';

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'blue' }> = ({ children, className, variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses =
        variant === 'secondary' ? ' text-gray-800  dark:text-text-primary hover:brightness-105 border border-brand-blue/15'
        : variant === 'blue' ? 'bg-brand-blue text-white'
        : ' text-white';

    return <button {...props} className={`${baseClasses} ${variantClasses} ${className}`}>{children}</button>
}

interface TeamEditorModalProps extends Pick<UseCrickIQStateReturn, 'updateTeam' | 'getTournamentById' | 'addPlayer' | 'deletePlayer' | 'matches'> {
    team: Team;
    tournamentId: string;
    onClose: () => void;
    onDone?: (teamId: string) => void;
    isMatchLive: boolean;
}

export const TeamEditorModal: React.FC<TeamEditorModalProps> = (props) => {
    const { team, onClose, onDone, isMatchLive, updateTeam, getTournamentById, matches, tournamentId } = props;
    const { showNotification } = useNotification();
    const [editedTeam, setEditedTeam] = useState<Team>(() => JSON.parse(JSON.stringify(team)));
    
    const [newPlayerNumber, setNewPlayerNumber] = useState<number | ''>('');
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerRole, setNewPlayerRole] = useState<PlayerRole | ''>('');
    const [playerFormErrors, setPlayerFormErrors] = useState<{ number: string | null; name: string | null; role: string | null }>({ number: null, name: null, role: null });
    const rowErrors = useMemo(() => {
        const errors: Record<string, string> = {};
        const numberCounts = editedTeam.players.reduce((acc, p) => {
            acc[p.number] = (acc[p.number] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        for (const player of editedTeam.players) {
            if (!player.name.trim()) {
                 errors[player.id] = 'Name is required';
            } else if (!Number.isInteger(player.number) || player.number <= 0) {
                errors[player.id] = 'Invalid #';
            } else if (numberCounts[player.number] > 1) {
                if (!errors[player.id]) errors[player.id] = 'In use';
            }
        }
        return errors;
    }, [editedTeam.players]);

    const [confirmDeletePlayer, setConfirmDeletePlayer] = useState<Player | null>(null);
    const [dontAskAgain, setDontAskAgain] = useState(() => localStorageAdapter.load('dontAskDeletePlayer') === 'true');

    const tournament = useMemo(() => getTournamentById(tournamentId), [tournamentId, getTournamentById]);
    const maxPlayers = useMemo(() => tournament?.numberOfPlayers || 11, [tournament]);

    const isTeamFull = editedTeam.players.length >= maxPlayers;

    const isKeeperMissing = useMemo(() => {
        return editedTeam.players.length === maxPlayers && !editedTeam.players.some(p => p.role === PlayerRole.WICKET_KEEPER);
    }, [editedTeam.players, maxPlayers]);

    const isCaptainMissing = useMemo(() => {
        // A Captain is required if the team has any players
        return editedTeam.players.length > 0 && !editedTeam.captainId;
    }, [editedTeam.players, editedTeam.captainId]);

    const isViceCaptainMissing = useMemo(() => {
        // A Vice-Captain is required if the team has any players
        return editedTeam.players.length > 0 && !editedTeam.viceCaptainId;
    }, [editedTeam.players, editedTeam.viceCaptainId]);

    const handleTeamInfoChange = (field: 'name' | 'logo', value: string) => {
        setEditedTeam(prev => ({ ...prev, [field]: value }));
    };

    const handlePlayerChange = (playerId: string, field: keyof Player, value: string | number) => {
        setEditedTeam(prev => ({
            ...prev,
            players: prev.players.map(p => p.id === playerId ? { ...p, [field]: value } : p)
        }));
    };
    
    const handleCaptainChange = (playerId: string, isVice: boolean) => {
        setEditedTeam(prev => {
            const field = isVice ? 'viceCaptainId' : 'captainId';
            const otherField = isVice ? 'captainId' : 'viceCaptainId';
            const updatedTeam = { ...prev, [field]: playerId };
            if (updatedTeam[field] && updatedTeam[field] === updatedTeam[otherField]) {
                updatedTeam[otherField] = null;
            }
            return updatedTeam;
        });
        const playerName = editedTeam.players.find(p => p.id === playerId)?.name || '';
        showNotification(`${isVice ? 'Vice-Captain' : 'Captain'} set to ${playerName}`, 'info');
    };

    const [isSubmittingPlayer, setIsSubmittingPlayer] = useState(false);

    const handleAddPlayerLocal = () => {
        if (isSubmittingPlayer) return;
        if (isTeamFull) return;
        
        setIsSubmittingPlayer(true);
        const validation = validatePlayer(newPlayerName, newPlayerNumber, newPlayerRole, editedTeam.players);
        setPlayerFormErrors(validation.errors);
        
        if (!validation.valid) {
            showNotification('Please fix errors to add player', 'error');
            setTimeout(() => setIsSubmittingPlayer(false), 200);
            return;
        }

        const newPlayer: Player = {
            id: `p_${Date.now()}`,
            number: Number(newPlayerNumber),
            name: newPlayerName.trim(),
            role: newPlayerRole as PlayerRole,
        };
        setEditedTeam(prev => ({ ...prev, players: [...prev.players, newPlayer] }));
        showNotification('Player added', 'success');
        
        setNewPlayerName(''); setNewPlayerNumber(''); setNewPlayerRole('');
        setPlayerFormErrors({ number: null, name: null, role: null });
        
        setTimeout(() => setIsSubmittingPlayer(false), 200);
    };

    const handleDeletePlayerLocal = (playerId: string) => {
        setEditedTeam(prev => {
            const updatedPlayers = prev.players.filter(p => p.id !== playerId);
            const updatedTeam = { ...prev, players: updatedPlayers };
            if (updatedTeam.captainId === playerId) updatedTeam.captainId = null;
            if (updatedTeam.viceCaptainId === playerId) updatedTeam.viceCaptainId = null;
            return updatedTeam;
        });
        showNotification('Player deleted', 'delete');
    };
    
    const requestDeletePlayer = (player: Player) => {
        // Check if player has played any completed matches in this tournament
        const tournamentMatches = matches.filter(m => m.tournamentId === tournamentId && m.status === 'completed');
        if (tournamentMatches.length > 0) {
            const stats = calculatePlayerCareerStats(player.id, tournamentMatches);
            if (stats.matches > 0) {
                showNotification(`${player.name} has stats and cannot be deleted.`, 'error');
                return;
            }
        }

        if (dontAskAgain) {
            handleDeletePlayerLocal(player.id);
        } else {
            setConfirmDeletePlayer(player);
        }
    };
    
    const handleConfirmDelete = () => {
        if (confirmDeletePlayer) {
            handleDeletePlayerLocal(confirmDeletePlayer.id);
            setConfirmDeletePlayer(null);
        }
    };

    const isUpdateDisabled = Object.keys(rowErrors).length > 0 || !editedTeam.name.trim();
    const isSaveDisabled = isUpdateDisabled || isKeeperMissing || isCaptainMissing || isViceCaptainMissing;
    
    const saveButtonTitle = useMemo(() => {
        if (isKeeperMissing) {
            return `A team of ${maxPlayers} must have a Wicket Keeper.`;
        }
        if (isCaptainMissing) {
            return 'Please select a Captain for the team.';
        }
        if (isViceCaptainMissing) {
            return 'Please select a Vice-Captain for the team.';
        }
        if (isUpdateDisabled) {
            return "Fix errors before saving";
        }
        return "";
    }, [isKeeperMissing, isCaptainMissing, isViceCaptainMissing, isUpdateDisabled, maxPlayers]);

    const [isSavingTeam, setIsSavingTeam] = useState(false);

    const handleUpdate = () => {
        if (isSavingTeam) return;

        if (isSaveDisabled) {
             if (isKeeperMissing) {
                showNotification(`A team of ${maxPlayers} must have a Wicket Keeper.`, 'error');
            } else if (isCaptainMissing) {
                showNotification('Please select a Captain.', 'error');
            } else if (isViceCaptainMissing) {
                showNotification('Please select a Vice-Captain.', 'error');
            } else {
                showNotification('Please fix the errors before updating', 'error');
            }
            return;
        }

        if (editedTeam.name.trim().length > 30) {
            showNotification('Team name is too long (max 30 chars).', 'error');
            return;
        }

        setIsSavingTeam(true);

        updateTeam(editedTeam);
        showNotification('Team updated', 'success');
        if (onDone) onDone(team.id);
        onClose();
        
        setTimeout(() => setIsSavingTeam(false), 500);
    };

    const deleteConfirmationMessage = (
        <div>
            Are you sure you want to delete the player "{confirmDeletePlayer?.name}"?
            <div className="mt-4">
                <label className="custom-checkbox highlight">
                    <input type="checkbox" checked={dontAskAgain} onChange={(e) => {
                        setDontAskAgain(e.target.checked);
                        localStorageAdapter.save('dontAskDeletePlayer', String(e.target.checked));
                    }} />
                    <span className="checkmark"></span>
                    <span className="text-sm">Don't ask me again</span>
                </label>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50 md:p-4">
            <div className="bg-secondary w-full h-full md:max-w-4xl md:max-h-[90vh] flex flex-col md:rounded-2xl shadow-xl">
                <div className="relative p-4 md:p-6 text-center border-b border-gray-300 dark:border-gray-700">
                    <div className="flex items-center justify-center gap-4">
                         <div className="relative w-12 h-12 flex-shrink-0">
                            <div
                                className="w-full h-full flex items-center justify-center rounded-lg text-button text-white text-h3"
                                style={{ backgroundColor: editedTeam.logo }}
                            >
                                {editedTeam.name.substring(0, 2).toUpperCase()}
                            </div>
                            <input
                                type="color"
                                value={editedTeam.logo}
                                onChange={e => handleTeamInfoChange('logo', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                title="Change team color"
                            />
                        </div>
                        <input value={editedTeam.name} onChange={e => handleTeamInfoChange('name', e.target.value)} className={`w-full max-w-xs text-h2 font-bold text-center text-text-primary bg-primary/50 p-1.5 rounded-lg focus:outline-none border-2 transition-colors ${!editedTeam.name.trim() ? 'border-highlight focus:border-highlight' : 'border-brand-blue/15 focus:border-brand-blue'}`} placeholder="Team Name" />
                    </div>
                    <button onClick={onClose} className="absolute text-h1 leading-none transform -translate-y-1/2 top-1/2 right-4 md:right-6 text-text-secondary hover:text-text-primary">&times;</button>
                </div>
                <div className="flex-grow p-4 md:p-6 overflow-y-auto no-scrollbar">
                    <p className="text-sm text-center text-text-secondary mb-4 -mt-2">Edit player details directly in the table, or add a new player below.</p>
                    {isKeeperMissing && (
                        <div className="p-2 mb-4 bg-warning/20 dark:bg-warning/20 text-yellow-800 dark:text-yellow-300 text-body font-semibold rounded-md text-center">
                            A team of {maxPlayers} must have one designated Wicket Keeper.
                        </div>
                    )}
                    {(isCaptainMissing || isViceCaptainMissing) && (
                        <div className="p-2 mb-4 bg-warning/20 dark:bg-warning/20 text-yellow-800 dark:text-yellow-300 text-body font-semibold rounded-md text-center">
                            {isCaptainMissing && isViceCaptainMissing ? "A Captain and Vice-Captain must be selected." : (isCaptainMissing ? "A Captain must be selected." : "A Vice-Captain must be selected.")}
                        </div>
                    )}
                     <Table >
                            <Thead className="sticky top-0 bg-secondary z-10">
                                <Tr className="border-b border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-900/75">
                                    <Th className="w-16 text-center tracking-wider">#</Th>
                                    <Th className="w-full tracking-wider">Name</Th>
                                    <Th className="tracking-wider">Role</Th>
                                    <Th className="text-center tracking-wider">C</Th>
                                    <Th className="text-center tracking-wider">VC</Th>
                                    <Th className="w-16 text-center tracking-wider">Del</Th>
                                </Tr>
                            </Thead>
                            <Tbody className="divide-gray-200 dark:divide-gray-700">
                                {editedTeam.players.map(player => (
                                    <Tr key={player.id} className={`${rowErrors[player.id] ? 'bg-highlight/20' : ''}`}>
                                        <Td className="p-1">
                                            <input
                                                type="number"
                                                value={player.number}
                                                onChange={e => handlePlayerChange(player.id, 'number', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                                className={`w-full text-center bg-primary p-1 rounded-md focus:outline-none focus:ring-2 ${rowErrors[player.id] ? 'ring-highlight' : 'ring-brand-blue'}`}
                                                min="1"
                                            />
                                        </Td>
                                        <Td className="p-1">
                                            <input
                                                type="text"
                                                value={player.name}
                                                onChange={e => handlePlayerChange(player.id, 'name', e.target.value)}
                                                className={`w-full bg-primary p-1 rounded-md focus:outline-none focus:ring-2 ${rowErrors[player.id] ? 'ring-highlight' : 'ring-brand-blue'}`}
                                            />
                                        </Td>
                                        <Td className="p-1">
                                            <select
                                                value={player.role}
                                                onChange={e => handlePlayerChange(player.id, 'role', e.target.value)}
                                                className="w-full bg-primary p-1 rounded-md focus:outline-none focus:ring-2 ring-brand-blue appearance-none text-center"
                                            >
                                                {PLAYER_ROLES.map(role => <option key={role} value={role}>{getRoleEmoji(role)} {getShortRoleName(role)}</option>)}
                                            </select>
                                        </Td>
                                        <Td className="p-1 text-center">
                                            <input
                                                type="radio"
                                                name="captain"
                                                checked={editedTeam.captainId === player.id}
                                                onChange={() => handleCaptainChange(player.id, false)}
                                                className="w-5 h-5 accent-brand-blue"
                                                title="Set as Captain"
                                            />
                                        </Td>
                                        <Td className="p-1 text-center">
                                            <input
                                                type="radio"
                                                name="vice-captain"
                                                checked={editedTeam.viceCaptainId === player.id}
                                                onChange={() => handleCaptainChange(player.id, true)}
                                                className="w-5 h-5 accent-warning"
                                                title="Set as Vice-Captain"
                                            />
                                        </Td>
                                        <Td className="p-1 text-center">
                                            <button
                                                onClick={() => requestDeletePlayer(player)}
                                                disabled={isMatchLive}
                                                className="p-2 rounded-2xl text-text-secondary hover:text-highlight hover:bg-highlight/10 disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed"
                                                title={isMatchLive ? "Cannot delete players during a live match" : "Delete Player"}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>

                    {!isTeamFull && (
                        <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-700">
                            <h4 className="font-bold text-text-primary mb-2 text-center">Add New Player</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr_auto] gap-2 items-start">
                                <div>
                                    <input
                                        type="number"
                                        placeholder="#"
                                        value={newPlayerNumber}
                                        onChange={e => setNewPlayerNumber(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                        className={`w-full text-center bg-primary p-2 rounded-lg focus:outline-none border-2 ${playerFormErrors.number ? 'border-highlight focus:border-highlight' : 'border-brand-blue/15 focus:border-brand-blue'}`}
                                    />
                                    {playerFormErrors.number && <p className="text-xs text-highlight mt-1">{playerFormErrors.number}</p>}
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Player Name"
                                        value={newPlayerName}
                                        onChange={e => setNewPlayerName(e.target.value)}
                                        className={`w-full bg-primary p-2 rounded-lg focus:outline-none border-2 ${playerFormErrors.name ? 'border-highlight focus:border-highlight' : 'border-brand-blue/15 focus:border-brand-blue'}`}
                                    />
                                    {playerFormErrors.name && <p className="text-xs text-highlight mt-1">{playerFormErrors.name}</p>}
                                </div>
                                <div>
                                    <select
                                        value={newPlayerRole}
                                        onChange={e => setNewPlayerRole(e.target.value as PlayerRole)}
                                        className={`w-full bg-primary p-2 rounded-lg focus:outline-none border-2 ${playerFormErrors.role ? 'border-highlight focus:border-highlight' : 'border-brand-blue/15 focus:border-brand-blue'}`}
                                    >
                                        <option value="">Role</option>
                                        {PLAYER_ROLES.map(role => <option key={role} value={role}>{getRoleEmoji(role)} {getShortRoleName(role)}</option>)}
                                    </select>
                                    {playerFormErrors.role && <p className="text-xs text-highlight mt-1">{playerFormErrors.role}</p>}
                                </div>
                                <Button onClick={handleAddPlayerLocal} variant="primary" className="!h-11">
                                    <PlusIcon />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 md:p-6 border-t border-gray-300 dark:border-gray-700 flex justify-end items-center gap-4">
                    <button onClick={onClose} className="py-2 px-4 rounded-2xl font-semibold text-body bg-primary/80 border border-brand-blue/15 hover:bg-primary">Cancel</button>
                    <Button onClick={handleUpdate} disabled={isSaveDisabled} title={saveButtonTitle}>
                        {onDone ? 'Save & Set Ready' : 'Save Changes'}
                    </Button>
                </div>

                {confirmDeletePlayer && (
                    <ConfirmationModal
                        title={`Delete ${confirmDeletePlayer.name}?`}
                        message={deleteConfirmationMessage}
                        onClose={() => setConfirmDeletePlayer(null)}
                        onConfirm={handleConfirmDelete}
                    />
                )}
            </div>
        </div>
    );
};