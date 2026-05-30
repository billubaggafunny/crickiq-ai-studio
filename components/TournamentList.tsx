import CrickIQCard from './CrickIQCard';
import React, { useState, useMemo, useEffect } from 'react';
import type { Team, Match, Tournament } from '../types';
import { TrashIcon, CalendarIcon, UserGroupIcon, TrophyIcon, BallIcon, EditIcon, ClipboardListIcon, PlusIcon } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../hooks/useNotification';


const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'blue' }> = ({ children, className = '', variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses = variant === 'secondary' ? 'bg-brand-lightblue text-white border-0' : variant === 'blue' ? 'bg-brand-blue text-white border-0' : 'bg-brand-gradient text-white border-0'; // primary

    return <button {...props} className={`${baseClasses} ${variantClasses} ${className}`}>{children}</button>
};

interface TournamentListProps {
    tournaments: Tournament[];
    teams: Team[];
    matches: Match[];
    isMatchLive: boolean;
    updateTournament: (tournamentId: string, updatedDetails: Partial<Pick<Tournament, 'name' | 'location' | 'defaultOvers' | 'numberOfPlayers' | 'startDate' | 'endDate' | 'format'>>) => void;
    deleteTournament: (tournamentId: string) => void;
    onViewTournament: (tournamentId: string) => void;
    addTournament?: (name: string, location: string, defaultOvers: number, numberOfPlayers: number, startDate: string, endDate: string) => void;
}



const IconStatItem: React.FC<{ icon: React.ReactNode, label: string, value: string | number }> = ({ icon, label, value }) => (
    <li className="flex items-center justify-between text-body py-1">
        <div className="flex items-center gap-2 text-text-secondary">
            {icon}
            <span className="font-semibold">{label}</span>
        </div>
        <span className="font-bold text-text-primary text-right">{value}</span>
    </li>
);


const TournamentList: React.FC<TournamentListProps> = ({ tournaments, teams, matches, isMatchLive, deleteTournament, updateTournament, onViewTournament, addTournament }) => {
    const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
    const { showNotification } = useNotification();
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        location: '',
        defaultOvers: '' as number | '',
        numberOfPlayers: '' as number | '',
        startDate: '',
        endDate: '',
    });
    const [editError, setEditError] = useState<string | null>(null);

    // Create Tournament State
    const [newTournamentName, setNewTournamentName] = useState('');
    const [newTournamentLocation, setNewTournamentLocation] = useState('');
    const [defaultOvers, setDefaultOvers] = useState<number | ''>(10);
    const [numberOfPlayers, setNumberOfPlayers] = useState<number | ''>(11);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSubmittingTournament, setIsSubmittingTournament] = useState(false);

    const handleAddTournament = () => {
        if (isSubmittingTournament || !addTournament) return;

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
            showNotification('Tournament location is required.', 'error');
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

        if (selectedStartDate < today) {
            showNotification('Start date cannot be in the past.', 'error');
            return;
        }
        
        if (selectedEndDate < selectedStartDate) {
            showNotification('End date cannot be before the start date.', 'error');
            return;
        }

        setIsSubmittingTournament(true);
        addTournament(newTournamentName.trim(), newTournamentLocation.trim(), overs, players, startDate, endDate);
        setNewTournamentName('');
        setNewTournamentLocation('');
        setDefaultOvers(10);
        setNumberOfPlayers(11);
        setStartDate('');
        setEndDate('');
        showNotification('Tournament created!', 'success');
        
        setTimeout(() => setIsSubmittingTournament(false), 500);
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

    useEffect(() => {
        if (editingTournament) {
            const timeoutId = setTimeout(() => {
                setEditFormData({
                    name: editingTournament.name,
                    location: editingTournament.location,
                    defaultOvers: editingTournament.defaultOvers || '',
                    numberOfPlayers: editingTournament.numberOfPlayers || '',
                    startDate: editingTournament.startDate || '',
                    endDate: editingTournament.endDate || '',
                });
                setEditError(null);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [editingTournament]);

    const isEditFormValid = useMemo(() => {
        const overs = Number(editFormData.defaultOvers);
        const players = Number(editFormData.numberOfPlayers);
        if (!editFormData.name.trim() || !editFormData.location.trim() || !Number.isInteger(overs) || overs <= 0 || !Number.isInteger(players) || players <= 1 || !editFormData.startDate || !editFormData.endDate) {
            return false;
        }
        const selectedStartDate = new Date(editFormData.startDate.replace(/-/g, '/'));
        const selectedEndDate = new Date(editFormData.endDate.replace(/-/g, '/'));
        return selectedEndDate >= selectedStartDate;
    }, [editFormData]);

    const handleUpdateTournament = () => {
        setEditError(null);
        if (!editingTournament) return;
        if (!isEditFormValid) {
            const overs = Number(editFormData.defaultOvers);
            const players = Number(editFormData.numberOfPlayers);
            if (!editFormData.name.trim() || !editFormData.location.trim() || !Number.isInteger(overs) || overs <= 0 || !Number.isInteger(players) || players <= 1 || !editFormData.startDate || !editFormData.endDate) {
                setEditError('Please fill all fields correctly.');
                return;
            }
            const selectedStartDate = new Date(editFormData.startDate.replace(/-/g, '/'));
            const selectedEndDate = new Date(editFormData.endDate.replace(/-/g, '/'));
            if (selectedEndDate < selectedStartDate) {
                setEditError('End date cannot be before the start date.');
                return;
            }
            setEditError('An unknown validation error occurred.');
            return;
        }

        updateTournament(editingTournament.id, {
            name: editFormData.name.trim(),
            location: editFormData.location.trim(),
            defaultOvers: Number(editFormData.defaultOvers),
            numberOfPlayers: Number(editFormData.numberOfPlayers),
            startDate: editFormData.startDate,
            endDate: editFormData.endDate,
        });
        showNotification('Tournament updated successfully!', 'success');
        setEditingTournament(null);
    };
    
    const handleDeleteTournament = (tournamentId: string) => {
        const tournament = tournaments.find(t => t.id === tournamentId);
        if (!tournament) return;

        setConfirmation({
            title: `Delete ${tournament.name}?`,
            message: 'Are you sure you want to delete this tournament? All associated teams and matches will also be deleted. This action cannot be undone.',
            onConfirm: () => {
                deleteTournament(tournamentId);
                showNotification('Tournament deleted', 'delete');
                setConfirmation(null);
            }
        });
    };

    return (
        <div className="space-y-6">
            {addTournament && (
                <div className="space-y-6 animate-fade-in">
                    <CrickIQCard>
                        <h3 className="text-h3 text-text-primary flex items-center gap-2 mb-4">
                            <TrophyIcon className="w-5 h-5" /> Create Tournament
                        </h3>
                        <div className="space-y-4">
                            <input type="text" value={newTournamentName} onChange={e => setNewTournamentName(e.target.value)} placeholder="Tournament Name" className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            <input type="text" value={newTournamentLocation} onChange={e => setNewTournamentLocation(e.target.value)} placeholder="Location" className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start-date" className="text-caption text-text-secondary px-2">Start Date</label>
                                    <input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                </div>
                                <div>
                                    <label htmlFor="end-date" className="text-caption text-text-secondary px-2">End Date</label>
                                    <input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={defaultOvers} onChange={e => setDefaultOvers(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="Default Overs" className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                <input type="number" value={numberOfPlayers} onChange={handleNumberOfPlayersChange} placeholder="Players/Team" className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <Button
                                onClick={handleAddTournament}
                                disabled={!newTournamentName.trim() || !newTournamentLocation.trim() || !defaultOvers || !numberOfPlayers || !startDate || !endDate}
                                variant="primary"
                                className="w-full"
                            >
                                <PlusIcon /> Create
                            </Button>
                        </div>
                    </CrickIQCard>
                </div>
            )}
            
            {tournaments.filter(t => t.id !== 't_quick_matches').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...tournaments].filter(t => t.id !== 't_quick_matches').reverse().map((tournament) => {
                        const tournamentMatchesList = matches.filter(m => m.tournamentId === tournament.id);
                        const tournamentTeams = tournament.teamIds.length;
                        const tournamentMatchesCount = tournamentMatchesList.length;
                        const hasDependencies = tournamentTeams > 0 || tournamentMatchesCount > 0;
                        
                        
                        const finalMatch = tournamentMatchesList.find(m => m.knockoutType === 'final' && m.status === 'completed');
                        let tournamentWinner: Team | null = null;
                        if (finalMatch && finalMatch.winnerId && finalMatch.winnerId !== 'draw') {
                            tournamentWinner = teams.find(t => t.id === finalMatch.winnerId) || null;
                        }

                        return (
                            <div key={tournament.id} className="bg-secondary rounded-2xl shadow-lg overflow-hidden flex flex-col">
                                <div className={`p-4 bg-brand-gradient text-white relative`}>
                                    <h4 className="font-bold text-h2 pr-20 truncate">{tournament.name}</h4>
                                    <p className="text-sm opacity-80 truncate">{tournament.location}</p>
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button
                                            onClick={() => setEditingTournament(tournament)}
                                            title="Edit Tournament"
                                            className="p-2 rounded-2xl bg-black/20 hover:bg-black/40 transition-colors"
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTournament(tournament.id)}
                                            disabled={isMatchLive || hasDependencies}
                                            title={isMatchLive ? "Cannot delete while a match is live" : (hasDependencies ? "Cannot delete: Tournament has teams or matches." : "Delete Tournament")}
                                            className="p-2 rounded-2xl bg-black/20 hover:bg-black/40 disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-grow flex flex-col">
                                    {tournamentWinner && (
                                        <div className="p-4 text-center  text-black shadow-inner">
                                            <div className="flex items-center justify-center gap-2">
                                                <TrophyIcon className="w-5 h-5" />
                                                <span className="text-button uppercase tracking-wider">Winner: {tournamentWinner.name}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-4 flex-grow">
                                        <ul className="divide-y divide-border-color">
                                            {tournament.format && (
                                                <IconStatItem 
                                                    icon={<ClipboardListIcon className="w-5 h-5" />} 
                                                    label="Format" 
                                                    value={tournament.format} 
                                                />
                                            )}
                                            <IconStatItem 
                                                icon={<CalendarIcon className="w-5 h-5" />} 
                                                label="Dates" 
                                                value={`${tournament.startDate ? new Date(tournament.startDate.replace(/-/g, '/')).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'} - ${tournament.endDate ? new Date(tournament.endDate.replace(/-/g, '/')).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}`}
                                            />
                                            <IconStatItem 
                                                icon={<UserGroupIcon className="w-5 h-5" />} 
                                                label="Teams" 
                                                value={tournamentTeams} 
                                            />
                                            <IconStatItem 
                                                icon={<TrophyIcon className="w-5 h-5" />} 
                                                label="Matches" 
                                                value={tournamentMatchesCount} 
                                            />
                                            <IconStatItem 
                                                icon={<BallIcon className="w-5 h-5" />} 
                                                label="Overs" 
                                                value={tournament.defaultOvers || 'N/A'} 
                                            />
                                            <IconStatItem 
                                                icon={<UserGroupIcon className="w-5 h-5" />} 
                                                label="Players/Team" 
                                                value={tournament.numberOfPlayers || 'N/A'} 
                                            />
                                        </ul>
                                    </div>
    
                                    <div className="p-4 border-t border-brand-blue/15">
                                        <Button onClick={() => onViewTournament(tournament.id)} variant="primary" className="w-full">
                                            Manage Tournament
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <CrickIQCard>
                    <p className="text-text-secondary text-center">No tournaments created yet.</p>
                </CrickIQCard>
            )}
            {confirmation && (
                <ConfirmationModal
                    onClose={() => setConfirmation(null)}
                    onConfirm={confirmation.onConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                />
            )}
            {editingTournament && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <CrickIQCard  className="w-full max-w-lg">
                        <h3 className="text-h3 text-text-primary mb-4">Edit Tournament</h3>
                        <div className="space-y-4">
                            <input type="text" value={editFormData.name} onChange={e => setEditFormData(f => ({...f, name: e.target.value}))} placeholder="Tournament Name" className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            <input type="text" value={editFormData.location} onChange={e => setEditFormData(f => ({...f, location: e.target.value}))} placeholder="Location" className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start-date-edit" className="text-caption text-text-secondary px-2">Start Date</label>
                                    <input id="start-date-edit" type="date" value={editFormData.startDate} onChange={e => setEditFormData(f => ({...f, startDate: e.target.value}))} className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                </div>
                                <div>
                                    <label htmlFor="end-date-edit" className="text-caption text-text-secondary px-2">End Date</label>
                                    <input id="end-date-edit" type="date" value={editFormData.endDate} onChange={e => setEditFormData(f => ({...f, endDate: e.target.value}))} className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={editFormData.defaultOvers} onChange={e => setEditFormData(f => ({...f, defaultOvers: e.target.value === '' ? '' : parseInt(e.target.value, 10)}))} placeholder="Default Overs" className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                <input type="number" value={editFormData.numberOfPlayers} onChange={e => setEditFormData(f => ({...f, numberOfPlayers: e.target.value === '' ? '' : parseInt(e.target.value, 10)}))} placeholder="Players/Team" className="w-full p-2 bg-white text-black border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            {editError && <p className="text-highlight text-body text-center">{editError}</p>}
                        </div>
                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={() => setEditingTournament(null)} className="py-1 px-4 bg-primary border border-brand-blue/15 rounded-2xl hover:bg-border-color font-semibold text-body">Cancel</button>
                            <button onClick={handleUpdateTournament} disabled={!isEditFormValid} className="py-1 px-4 bg-brand-blue text-white font-bold rounded-2xl hover:bg-opacity-90 text-body disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400">Update</button>
                        </div>
                    </CrickIQCard>
                </div>
            )}
        </div>
    );
};
export default TournamentList;