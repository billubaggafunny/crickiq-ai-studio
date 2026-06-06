import React, { useState, useMemo } from 'react';
import { X, AlertCircle, ChevronDown, ChevronUp, Users, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PlayerRole, Player } from '../types';
import { findExistingPlayerCandidates } from '../utils/playerLinking';

interface AddPlayerSheetProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
    existingPlayers?: Player[];
    teams?: import('../types').Team[];
    onAddPlayer: (teamId: string, input: {
        name: string;
        role: PlayerRole;
        jerseyNumber?: number;
        battingStyle?: string;
        bowlingStyle?: string;
        isCaptain?: boolean;
        isViceCaptain?: boolean;
        isWicketKeeper?: boolean;
        globalPlayerId?: string;
    }) => void;
}

export const AddPlayerSheet: React.FC<AddPlayerSheetProps> = ({
    isOpen,
    onClose,
    teamId,
    existingPlayers = [],
    teams = [],
    onAddPlayer
}) => {
    const [name, setName] = useState('');
    const [jerseyNumber, setJerseyNumber] = useState('');
    const [role, setRole] = useState<PlayerRole>('Batsman' as PlayerRole);
    const [battingStyle, setBattingStyle] = useState('Right Hand Bat');
    const [bowlingStyle, setBowlingStyle] = useState('None');
    const [isCaptain, setIsCaptain] = useState(false);
    const [isViceCaptain, setIsViceCaptain] = useState(false);
    const [isWicketKeeper, setIsWicketKeeper] = useState(false);
    
    // Cross-team candidate player
    const [selectedExistingPlayer, setSelectedExistingPlayer] = useState<import('../utils/playerLinking').PlayerCandidate | null>(null);

    const [showDetails, setShowDetails] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Same-team duplicates check
    const sameTeamDuplicates = useMemo(() => {
        const trimmedName = name.trim().toLowerCase();
        if (trimmedName.length >= 2) {
            return existingPlayers.filter(p => p.name.trim().toLowerCase() === trimmedName);
        }
        return [];
    }, [name, existingPlayers]);

    // Cross-team candidates search using findExistingPlayerCandidates
    const crossTeamCandidates = useMemo(() => {
        if (!teams.length) return [];
        return findExistingPlayerCandidates(name, teams, teamId);
    }, [name, teams, teamId]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const trimmedName = name.trim();

        if (!trimmedName) {
            newErrors.name = 'Player name is required';
        } else if (trimmedName.length < 2) {
            newErrors.name = 'Player name must be at least 2 characters';
        } else if (trimmedName.length > 50) {
            newErrors.name = 'Player name cannot exceed 50 characters';
        }

        if (isCaptain && isViceCaptain) {
            newErrors.leadership = 'A player cannot be both Captain and Vice Captain';
        }

        if (jerseyNumber.trim()) {
            const parsedJersey = parseInt(jerseyNumber, 10);
            if (isNaN(parsedJersey) || parsedJersey < 0) {
                newErrors.jerseyNumber = 'Must be a valid positive number';
            } else if (existingPlayers.some(p => p.number === parsedJersey)) {
                newErrors.jerseyNumber = `Jersey number ${parsedJersey} is already taken by another player`;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUseExisting = (candidate: import('../utils/playerLinking').PlayerCandidate) => {
        const p = candidate.player;
        setSelectedExistingPlayer(candidate);
        setName(p.name);
        setRole(p.role);
        setJerseyNumber(p.number !== undefined && p.number !== -1 ? String(p.number) : '');
        if (p.battingStyle) setBattingStyle(p.battingStyle);
        if (p.bowlingStyle) setBowlingStyle(p.bowlingStyle);
        setIsWicketKeeper(!!p.isWicketKeeper);
        setErrors({});
    };

    const handleCreateNewAnyway = () => {
        setSelectedExistingPlayer(null);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // If candidates exist but user hasn't selected an option and there are no same-team warnings showing
        // Let them just click "Create New Anyway" visually or just proceed if they click Add Player
        if (!validateForm()) {
            if (errors.jerseyNumber || errors.battingStyle || errors.bowlingStyle) {
                setShowDetails(true);
            }
            return;
        }

        let parsedJersey: number | undefined = undefined;
        if (jerseyNumber.trim()) {
            parsedJersey = parseInt(jerseyNumber, 10);
        }

        onAddPlayer(teamId, {
            name: name.trim(),
            role,
            jerseyNumber: parsedJersey,
            battingStyle,
            bowlingStyle: bowlingStyle === 'None' ? undefined : bowlingStyle,
            isCaptain,
            isViceCaptain,
            isWicketKeeper,
            globalPlayerId: selectedExistingPlayer?.player.globalPlayerId
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-0 md:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm cursor-pointer"
                    />

                    {/* Form Container */}
                    <motion.div
                        id="add-player-sheet-container"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="relative bg-primary border-t md:border border-brand-blue/15 w-full md:max-w-xl md:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh]"
                        style={{ contentVisibility: 'auto' }}
                    >
                        {/* Drag Handle on Mobile */}
                        <div className="flex md:hidden justify-center py-2.5">
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-white/10 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-brand-blue/5 flex items-center justify-between shrink-0 bg-primary z-10">
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-bold text-text-primary tracking-tight">Add Player</h3>
                                <p className="text-xs text-text-secondary">Create a player profile for this team.</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-secondary rounded-full transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body - Scrollable */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                            {/* General Errors */}
                            {errors.leadership && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm font-medium">
                                    {errors.leadership}
                                </div>
                            )}

                            {/* Same-team Duplicates Warning segment */}
                            {sameTeamDuplicates.length > 0 && !selectedExistingPlayer && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-3 dark:bg-red-500/5">
                                    <div className="flex items-start gap-2.5">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-red-500">Player already exists in this team</h4>
                                            <p className="text-xs text-text-secondary mt-0.5">
                                                A player named &ldquo;<span className="font-semibold text-text-primary">{sameTeamDuplicates[0].name}</span>&rdquo; is already in this team. Are you sure you want to add another?
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cross-team Candidates Warning segment */}
                            {crossTeamCandidates.length > 0 && !selectedExistingPlayer && sameTeamDuplicates.length === 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-3 dark:bg-amber-500/5">
                                    <div className="flex items-start gap-2.5">
                                        <Users className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-500">Similar player found in another team</h4>
                                            <p className="text-xs text-text-secondary mt-0.5">
                                                Would you like to link to an existing profile to share stats?
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 mt-1">
                                        {crossTeamCandidates.slice(0, 3).map((candidate, idx) => {
                                            const isArchived = "isArchived" in candidate.player && typeof (candidate.player as {isArchived?: boolean}).isArchived === "boolean" ? (candidate.player as {isArchived?: boolean}).isArchived : false;
                                            return (
                                                <div key={`${candidate.player.id}-${idx}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-secondary rounded-xl border border-brand-blue/5">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-text-primary">{candidate.player.name}</span>
                                                            {isArchived && <span className="text-[10px] uppercase font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">Archived</span>}
                                                        </div>
                                                        <p className="text-xs text-text-secondary mt-0.5 font-medium">
                                                            {candidate.team.name} &bull; {candidate.player.role} {candidate.player.number !== undefined && candidate.player.number !== -1 ? `• #${candidate.player.number}` : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-row gap-2 shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUseExisting(candidate)}
                                                            className="px-3.5 py-1.5 bg-brand-blue text-white rounded-xl text-xs font-bold transition-all hover:bg-brand-blue/90 cursor-pointer shadow-sm"
                                                        >
                                                            Use Existing
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {crossTeamCandidates.length > 3 && (
                                            <p className="text-xs text-text-secondary text-center italic mt-2">
                                                + {crossTeamCandidates.length - 3} more match(es)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Selected Existing Player Banner */}
                            {selectedExistingPlayer && (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:bg-green-500/5">
                                    <div className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-green-600 dark:text-green-400">Linked to existing profile</h4>
                                            <p className="text-xs text-text-secondary mt-0.5">
                                                <span className="font-semibold text-text-primary">{selectedExistingPlayer.player.name}</span> from {selectedExistingPlayer.team.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCreateNewAnyway}
                                        className="px-3 py-1.5 bg-secondary text-text-secondary rounded-xl text-xs font-bold transition-all hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer shrink-0"
                                    >
                                        Unlink
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/* Name Input */}
                                <div className="space-y-1.5">
                                    <label htmlFor="player-name-input" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Player Name *
                                    </label>
                                    <input
                                        id="player-name-input"
                                        type="text"
                                        placeholder="Enter player name"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (errors.name) {
                                                const updated = { ...errors };
                                                delete updated.name;
                                                setErrors(updated);
                                            }
                                        }}
                                        className={`w-full px-4 py-3 bg-secondary text-text-primary border ${errors.name ? 'border-red-500 ring-1 ring-red-500/20' : 'border-brand-blue/15'} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all`}
                                        autoComplete="off"
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-500 font-semibold">{errors.name}</p>
                                    )}
                                </div>

                                {/* Role Dropdown */}
                                <div className="space-y-1.5">
                                    <label htmlFor="player-role-select" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                        Role
                                    </label>
                                    <select
                                        id="player-role-select"
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as PlayerRole)}
                                        className="w-full h-11 px-4 bg-secondary text-text-primary border border-brand-blue/15 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all cursor-pointer"
                                    >
                                        <option value="Batsman">Batsman</option>
                                        <option value="Bowler">Bowler</option>
                                        <option value="All-Rounder">All-Rounder</option>
                                        <option value="Wicket Keeper">Wicket Keeper</option>
                                    </select>
                                </div>

                                {/* Expandable Playing Details */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowDetails(!showDetails)}
                                        className="flex items-center justify-between w-full pb-1 mb-3 cursor-pointer group"
                                    >
                                        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-brand-blue/5 border-transparent transition-colors group-hover:text-text-primary">
                                            Playing Details (Optional)
                                        </h4>
                                        {showDetails ? (
                                            <ChevronUp className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-text-secondary group-hover:text-text-primary transition-colors" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {showDetails && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 pt-1">
                                                    {/* Jersey Number */}
                                                    <div className="space-y-1.5 sm:col-span-2">
                                                        <label htmlFor="player-jersey" className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                                                            Jersey Number
                                                        </label>
                                                        <input
                                                            id="player-jersey"
                                                            type="number"
                                                            placeholder="e.g. 18"
                                                            value={jerseyNumber}
                                                            onChange={(e) => {
                                                                setJerseyNumber(e.target.value);
                                                                if (errors.jerseyNumber) {
                                                                    const updated = { ...errors };
                                                                    delete updated.jerseyNumber;
                                                                    setErrors(updated);
                                                                }
                                                            }}
                                                            className={`w-full px-4 py-3 bg-secondary text-text-primary border ${errors.jerseyNumber ? 'border-red-500' : 'border-brand-blue/15'} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all`}
                                                        />
                                                        {errors.jerseyNumber && (
                                                            <p className="text-xs text-red-500 font-semibold">{errors.jerseyNumber}</p>
                                                        )}
                                                    </div>

                                                    {/* Batting Style */}
                                                    <div className="space-y-1.5">
                                                        <label htmlFor="player-batting-style" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                                            Batting Style
                                                        </label>
                                                        <select
                                                            id="player-batting-style"
                                                            value={battingStyle}
                                                            onChange={(e) => {
                                                                setBattingStyle(e.target.value);
                                                            }}
                                                            className="w-full px-3 py-2.5 bg-secondary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all cursor-pointer"
                                                        >
                                                            <option value="Right Hand Bat">Right Hand Bat</option>
                                                            <option value="Left Hand Bat">Left Hand Bat</option>
                                                        </select>
                                                    </div>

                                                    {/* Bowling Style */}
                                                    <div className="space-y-1.5">
                                                        <label htmlFor="player-bowling-style" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                                                            Bowling Style
                                                        </label>
                                                        <select
                                                            id="player-bowling-style"
                                                            value={bowlingStyle}
                                                            onChange={(e) => {
                                                                setBowlingStyle(e.target.value);
                                                            }}
                                                            className="w-full px-3 py-2.5 bg-secondary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all cursor-pointer"
                                                        >
                                                            <option value="None">None</option>
                                                            <option value="Right Arm Fast">Right Arm Fast</option>
                                                            <option value="Right Arm Medium">Right Arm Medium</option>
                                                            <option value="Right Arm Off Spin">Right Arm Off Spin</option>
                                                            <option value="Right Arm Leg Spin">Right Arm Leg Spin</option>
                                                            <option value="Left Arm Fast">Left Arm Fast</option>
                                                            <option value="Left Arm Medium">Left Arm Medium</option>
                                                            <option value="Left Arm Orthodox">Left Arm Orthodox</option>
                                                            <option value="Left Arm Wrist Spin">Left Arm Wrist Spin</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                
                                {/* Leadership Roles */}
                                <div className="pt-2">
                                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-brand-blue/5 pb-1 mb-3">
                                        Leadership
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label className="flex items-center gap-3 p-3 bg-secondary border border-brand-blue/15 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={isCaptain}
                                                onChange={(e) => setIsCaptain(e.target.checked)}
                                                className="w-5 h-5 rounded text-brand-blue focus:ring-brand-blue/50"
                                            />
                                            <span className="text-sm font-semibold text-text-primary">Captain</span>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 bg-secondary border border-brand-blue/15 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={isViceCaptain}
                                                onChange={(e) => setIsViceCaptain(e.target.checked)}
                                                className="w-5 h-5 rounded text-brand-blue focus:ring-brand-blue/50"
                                            />
                                            <span className="text-sm font-semibold text-text-primary">Vice Captain</span>
                                        </label>

                                        <label className="flex items-center gap-3 p-3 bg-secondary border border-brand-blue/15 rounded-xl cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors sm:col-span-2">
                                            <input
                                                type="checkbox"
                                                checked={isWicketKeeper}
                                                onChange={(e) => setIsWicketKeeper(e.target.checked)}
                                                className="w-5 h-5 rounded text-brand-blue focus:ring-brand-blue/50"
                                            />
                                            <span className="text-sm font-semibold text-text-primary">Wicketkeeper</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Footer Options */}
                        <div className="px-6 py-4 bg-secondary border-t border-brand-blue/5 flex items-center justify-end gap-3 safe-pad-b shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 border border-brand-blue/15 hover:bg-gray-100 dark:hover:bg-white/5 text-text-secondary rounded-2xl font-bold text-sm transition-all focus:outline-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit()}
                                disabled={name.trim().length < 2}
                                className={`px-6 py-2.5 bg-brand-blue text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-98 focus:outline-none cursor-pointer ${
                                    name.trim().length < 2 ? 'opacity-40 cursor-not-allowed shadow-none' : 'hover:bg-brand-blue/90'
                                }`}
                            >
                                Add Player
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
