import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PlusIcon } from '../constants';
import { useNotification } from '../hooks/useNotification';
import { LOGO_OPTIONS } from '../utils/initialData';
import type { Tournament } from '../types';

const TOURNAMENT_TYPES = [
    'School', 'College', 'University', 'Corporate', 
    'Local', 'Gully', 'Club', 'Academy'
];

interface CreateTournamentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    mode?: 'create' | 'edit' | 'readonly';
    initialTournament?: Tournament | null;
    updateTournament?: (tournamentId: string, updatedDetails: Partial<Pick<Tournament, 'name' | 'location' | 'defaultOvers' | 'numberOfPlayers' | 'startDate' | 'endDate' | 'format' | 'organizerName' | 'tournamentType' | 'notes' | 'theme'>>) => void;
    addTournament?: (
        name: string, 
        location: string, 
        defaultOvers: number, 
        numberOfPlayers: number, 
        startDate: string, 
        endDate: string, 
        ownerId?: string,
        organizerName?: string,
        tournamentType?: string,
        notes?: string,
        theme?: string
    ) => void;
}

export const CreateTournamentSheet: React.FC<CreateTournamentSheetProps> = ({
    isOpen,
    onClose,
    mode = 'create',
    initialTournament,
    updateTournament,
    addTournament
}) => {
    const { showNotification } = useNotification();
    const [newTournamentName, setNewTournamentName] = useState('');
    const [newTournamentLocation, setNewTournamentLocation] = useState('');
    const [defaultOvers, setDefaultOvers] = useState<number | ''>(10);
    const [numberOfPlayers, setNumberOfPlayers] = useState<number | ''>(11);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [organizerName, setOrganizerName] = useState('');
    const [tournamentType, setTournamentType] = useState('Local');
    const [notes, setNotes] = useState('');
    const [theme, setTheme] = useState(LOGO_OPTIONS[0]);
    const [isSubmittingTournament, setIsSubmittingTournament] = useState(false);

    useEffect(() => {
        if (isOpen && initialTournament && mode !== 'create') {
            const timer = setTimeout(() => {
                setNewTournamentName(initialTournament.name || '');
                setNewTournamentLocation(initialTournament.location || '');
                setDefaultOvers(initialTournament.defaultOvers || 10);
                setNumberOfPlayers(initialTournament.numberOfPlayers || 11);
                setStartDate(initialTournament.startDate || '');
                setEndDate(initialTournament.endDate || '');
                setOrganizerName(initialTournament.organizerName || '');
                setTournamentType(initialTournament.tournamentType || 'Local');
                setNotes(initialTournament.notes || '');
                setTheme(initialTournament.theme || LOGO_OPTIONS[0]);
            }, 0);
            return () => clearTimeout(timer);
        } else if (isOpen && mode === 'create') {
            const timer = setTimeout(() => {
                setNewTournamentName('');
                setNewTournamentLocation('');
                setDefaultOvers(10);
                setNumberOfPlayers(11);
                setStartDate('');
                setEndDate('');
                setOrganizerName('');
                setTournamentType('Local');
                setNotes('');
                setTheme(LOGO_OPTIONS[0]);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialTournament, mode]);

    const handleSaveTournament = () => {
        if (mode === 'readonly') return;
        if (isSubmittingTournament) return;


        const overs = Number(defaultOvers);
        const players = Number(numberOfPlayers);

        if (!newTournamentName.trim()) {
            showNotification('Tournament name is required.', 'error');
            return;
        }

        if (newTournamentName.trim().length > 30) {
            showNotification('Tournament name is too long (max 30 chars).', 'error');
            return;
        }

        if (!newTournamentLocation.trim()) {
            showNotification('Ground name is required.', 'error');
            return;
        }

        if (newTournamentLocation.trim().length > 40) {
            showNotification('Location name is too long (max 40 chars).', 'error');
            return;
        }

        if (!Number.isInteger(overs) || overs <= 0 || overs > 100) {
            showNotification('Overs must be a valid number between 1 and 100.', 'error');
            return;
        }

        if (!Number.isInteger(players) || players < 2 || players > 11) {
            showNotification('Players per team must be between 2 and 11.', 'error');
            return;
        }

        if (!startDate || !endDate) {
            showNotification('Please select both start and end dates.', 'error');
            return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedStartDate = new Date(startDate.replace(/-/g, '/'));
        const selectedEndDate = new Date(endDate.replace(/-/g, '/'));

        if (mode === 'create' && selectedStartDate < today) {
            showNotification('Start date cannot be in the past.', 'error');
            return;
        }
        
        if (selectedEndDate < selectedStartDate) {
            showNotification('End date cannot be before the start date.', 'error');
            return;
        }

        setIsSubmittingTournament(true);
        if (mode === 'edit' && initialTournament && updateTournament) {
            updateTournament(initialTournament.id, {
                name: newTournamentName.trim(),
                location: newTournamentLocation.trim(),
                defaultOvers: overs,
                numberOfPlayers: players,
                startDate,
                endDate,
                organizerName: organizerName.trim(),
                tournamentType,
                notes: notes.trim(),
                theme
            });
            showNotification('Tournament updated!', 'success');
        } else if (mode === 'create' && addTournament) {
            addTournament(
                newTournamentName.trim(), 
                newTournamentLocation.trim(), 
                overs, 
                players, 
                startDate, 
                endDate,
                undefined, // ownerId
                organizerName.trim(),
                tournamentType,
                notes.trim(),
                theme
            );
            showNotification('Tournament created!', 'success');
        }
        
        setTimeout(() => {
            setIsSubmittingTournament(false);
            onClose();
        }, 500);
    };

    const handleNumberOfPlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === '') {
            setNumberOfPlayers('');
            return;
        }
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setNumberOfPlayers(val);
        }
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
                        id="create-tournament-sheet-container"
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
                        <div className="px-6 py-4 border-b border-brand-blue/5 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-bold text-text-primary tracking-tight">
                                    {mode === 'create' ? 'Create Tournament' : mode === 'edit' ? 'Edit Tournament' : 'Tournament Info'}
                                </h3>
                                <p className="text-xs text-text-secondary">
                                    {mode === 'readonly' ? 'Tournament setup is locked after teams are added.' : mode === 'edit' ? 'Update your tournament details.' : 'Set up a new tournament with custom rules.'}
                                </p>
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
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tournament Name</label>
                                <input type="text" value={newTournamentName} onChange={e => setNewTournamentName(e.target.value)} disabled={mode === 'readonly'} placeholder="e.g. Summer Cup 2026" className="w-full px-4 py-3 bg-secondary text-text-primary border border-brand-blue/15 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all disabled:opacity-70" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Organizer Name</label>
                                <input type="text" value={organizerName} onChange={e => setOrganizerName(e.target.value)} disabled={mode === 'readonly'} placeholder="Enter organizer name" className="w-full px-4 py-3 bg-secondary text-text-primary border border-brand-blue/15 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all disabled:opacity-70" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tournament Type</label>
                                <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
                                    {TOURNAMENT_TYPES.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            disabled={mode === 'readonly'}
                                            onClick={() => setTournamentType(type)}
                                            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${mode !== 'readonly' ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'} ${
                                                tournamentType === type 
                                                ? 'bg-brand-blue text-white border-brand-blue shadow-md' 
                                                : 'bg-secondary text-text-secondary border-brand-blue/15 hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Ground Name</label>
                                <input type="text" value={newTournamentLocation} onChange={e => setNewTournamentLocation(e.target.value)} disabled={mode === 'readonly'} placeholder="Enter ground name" className="w-full px-4 py-3 bg-secondary text-text-primary border border-brand-blue/15 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all disabled:opacity-70" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="start-date" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Start Date</label>
                                    <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={mode === 'readonly'} className="w-full px-3 py-2.5 bg-secondary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all disabled:opacity-70" />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="end-date" className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">End Date</label>
                                    <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={mode === 'readonly'} className="w-full px-3 py-2.5 bg-secondary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all disabled:opacity-70" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Default Overs</label>
                                    <input type="number" value={defaultOvers} onChange={e => setDefaultOvers(e.target.value === '' ? '' : parseInt(e.target.value, 10))} disabled={mode === 'readonly'} placeholder="10" className="w-full px-3 py-2.5 bg-secondary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all disabled:opacity-70" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Players / Team</label>
                                    <input 
                                        type="number" 
                                        value={numberOfPlayers} 
                                        onChange={handleNumberOfPlayersChange} 
                                        disabled={mode === 'readonly'} 
                                        placeholder="11" 
                                        className="w-full px-3 py-2.5 bg-tertiary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all disabled:opacity-70" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tournament Theme</label>
                                <div className="flex flex-wrap gap-2.5 p-3 bg-secondary border border-brand-blue/10 rounded-2xl justify-start">
                                    {LOGO_OPTIONS.map((color) => {
                                        const isSelected = theme === color;
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setTheme(color)}
                                                disabled={mode === 'readonly'}
                                                className={`w-7 h-7 rounded-full border-2 transition-all duration-150 transform ${mode !== 'readonly' ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'} ${
                                                    isSelected ? 'border-text-primary scale-110 shadow-md ring-2 ring-brand-blue/30' : 'border-transparent'
                                                }`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Notes</label>
                                <textarea 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)} 
                                    disabled={mode === 'readonly'}
                                    placeholder="Prize money, sponsors, tournament rules, special instructions, contact information, or anything the organizer wants to remember..." 
                                    className="w-full px-4 py-3 bg-secondary text-text-primary border border-brand-blue/15 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all resize-y min-h-[100px] disabled:opacity-70" 
                                />
                            </div>
                        </div>

                         {/* Footer Options */}
                         <div className="px-6 py-4 bg-secondary border-t border-brand-blue/5 flex items-center justify-end gap-3 safe-pad-b">
                            {mode === 'readonly' ? (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-brand-blue text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-98 focus:outline-none cursor-pointer hover:bg-brand-blue/90"
                                >
                                    Close
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 border border-brand-blue/15 hover:bg-gray-100 dark:hover:bg-white/5 text-text-secondary rounded-2xl font-bold text-sm transition-all focus:outline-none cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveTournament}
                                        disabled={!newTournamentName.trim() || !newTournamentLocation.trim() || !defaultOvers || !numberOfPlayers || !startDate || !endDate}
                                        className={`px-6 py-2.5 bg-brand-blue text-white rounded-2xl font-bold text-sm transition-all shadow-md active:scale-98 focus:outline-none cursor-pointer ${
                                            (!newTournamentName.trim() || !newTournamentLocation.trim() || !defaultOvers || !numberOfPlayers || !startDate || !endDate) ? 'opacity-40 cursor-not-allowed shadow-none' : 'hover:bg-brand-blue/90'
                                        }`}
                                    >
                                        {mode === 'edit' ? 'Save Changes' : <><PlusIcon className="w-4 h-4 inline-block mr-1 -mt-1" /> Create</>}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
