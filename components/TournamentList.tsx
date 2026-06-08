import CrickIQCard from './CrickIQCard';
import React, { useState } from 'react';
import type { Team, Match, Tournament } from '../types';
import { TrashIcon, TrophyIcon, EditIcon } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../hooks/useNotification';
import { CreateTournamentSheet } from './CreateTournamentSheet';
import { Plus } from 'lucide-react';

interface TournamentListProps {
    tournaments: Tournament[];
    teams: Team[];
    matches: Match[];
    isMatchLive: boolean;
    updateTournament: (tournamentId: string, updatedDetails: Partial<Pick<Tournament, 'name' | 'location' | 'defaultOvers' | 'numberOfPlayers' | 'startDate' | 'endDate' | 'format'>>) => void;
    deleteTournament: (tournamentId: string) => void;
    onViewTournament: (tournamentId: string) => void;
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

const TournamentList: React.FC<TournamentListProps> = ({ tournaments, teams, matches, isMatchLive, deleteTournament, updateTournament, onViewTournament, addTournament }) => {
    const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
    const { showNotification } = useNotification();
    
    // Unified panel state
    const [tournamentPanelOpen, setTournamentPanelOpen] = useState(false);
    const [tournamentPanelMode, setTournamentPanelMode] = useState<'create' | 'edit' | 'readonly'>('create');
    const [selectedTournamentForPanel, setSelectedTournamentForPanel] = useState<Tournament | null>(null);

    const openCreateTournamentPanel = () => {
        setSelectedTournamentForPanel(null);
        setTournamentPanelMode('create');
        setTournamentPanelOpen(true);
    };

    const openTournamentSettingsPanel = (e: React.MouseEvent, tournament: Tournament) => {
        e.stopPropagation();
        const hasTeams = (tournament.teamIds?.length ?? 0) > 0;
        setSelectedTournamentForPanel(tournament);
        setTournamentPanelMode(hasTeams ? 'readonly' : 'edit');
        setTournamentPanelOpen(true);
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
        <div className="space-y-6 flex flex-col relative min-h-[50vh]">
            <CreateTournamentSheet
                isOpen={tournamentPanelOpen}
                onClose={() => setTournamentPanelOpen(false)}
                mode={tournamentPanelMode}
                initialTournament={selectedTournamentForPanel}
                addTournament={addTournament}
                updateTournament={updateTournament}
            />
            
            {/* Mobile/Global Floating Action Button (FAB) for Add Tournament */}
            {addTournament && (
                <button
                    onClick={openCreateTournamentPanel}
                    className="fixed bottom-24 right-6 z-40 flex items-center justify-center gap-2 px-5 h-14 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-full font-bold shadow-lg shadow-brand-blue/20 transition-all active:scale-95 border border-brand-blue/10"
                    aria-label="Create Tournament"
                >
                    <Plus className="w-6 h-6 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider md:inline-block">Tournament</span>
                </button>
            )}
            
            {tournaments.filter(t => t.id !== 't_quick_matches').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pb-20">
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
                            <div 
                                key={tournament.id} 
                                onClick={() => onViewTournament(tournament.id)}
                                className="bg-white dark:bg-secondary rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-brand-blue/10 p-4 flex flex-col relative transition-transform hover:-translate-y-1 duration-300 cursor-pointer overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 bottom-0 w-1.5 opacity-80" style={{ backgroundColor: tournament.theme || '#4285F4' }}></div>
                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <div className="pr-2 overflow-hidden flex-1">
                                        <h4 className="font-semibold text-[15px] sm:text-[17px] text-text-primary tracking-tight truncate">{tournament.name}</h4>
                                        <p className="text-[10px] sm:text-[11px] text-text-secondary font-bold tracking-wider uppercase mt-1 truncate">
                                           {tournament.organizerName ? `${tournament.organizerName} • ` : ''} {tournament.tournamentType || 'LOCAL TOURNAMENT'}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 shrink-0 -mr-2 relative z-10">
                                        <button
                                            onClick={(e) => openTournamentSettingsPanel(e, tournament)}
                                            title="Edit Tournament"
                                            className="p-1.5 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                        >
                                            <EditIcon className="w-4 h-4" style={{ color: tournament.theme || '#4285F4' }} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTournament(tournament.id);
                                            }}
                                            disabled={isMatchLive || hasDependencies}
                                            title={isMatchLive ? "Cannot delete while a match is live" : (hasDependencies ? "Cannot delete: Tournament has teams or matches." : "Delete Tournament")}
                                            className="p-1.5 rounded-full flex items-center justify-center text-text-secondary hover:text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-1.5 mt-1 pl-2 relative z-10">
                                    <div className="flex items-center text-[12px] sm:text-[13px]">
                                        <span className="w-[70px] font-semibold text-text-secondary">Ground</span>
                                        <span className="opacity-40 text-text-secondary mx-1.5">-</span>
                                        <span className="text-text-primary font-medium truncate">{tournament.location}</span>
                                    </div>
                                    <div className="flex items-center text-[12px] sm:text-[13px]">
                                        <span className="w-[70px] font-semibold text-text-secondary">Dates</span>
                                        <span className="opacity-40 text-text-secondary mx-1.5">-</span>
                                        <span className="text-text-primary font-medium truncate">
                                            {`${tournament.startDate ? new Date(tournament.startDate.replace(/-/g, '/')).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'} - ${tournament.endDate ? new Date(tournament.endDate.replace(/-/g, '/')).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD'}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-[12px] sm:text-[13px]">
                                        <span className="w-[70px] font-semibold text-text-secondary">Overview</span>
                                        <span className="opacity-40 text-text-secondary mx-1.5">-</span>
                                        <span className="text-text-primary font-medium truncate">{tournament.defaultOvers || 'N/A'} Overs • {tournament.numberOfPlayers || 'N/A'}/team</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-brand-blue/5 grid grid-cols-3 gap-2 pl-2 relative z-10">
                                    <div className="flex flex-col items-center justify-center">
                                        <span className="text-[9px] uppercase font-bold text-text-secondary tracking-widest">Teams</span>
                                        <span className="text-[13px] font-bold text-text-primary mt-0.5">{tournamentTeams}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center border-l border-brand-blue/5">
                                        <span className="text-[9px] uppercase font-bold text-text-secondary tracking-widest">Matches</span>
                                        <span className="text-[13px] font-bold text-text-primary mt-0.5">{tournamentMatchesCount}</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center border-l border-brand-blue/5">
                                        <span className="text-[9px] uppercase font-bold text-text-secondary tracking-widest">Status</span>
                                        <span className={`text-[9px] sm:text-[10px] mt-1 font-bold px-2 py-0.5 rounded-full uppercase border ${
                                            tournamentWinner ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : 
                                            (tournamentMatchesCount > 0 ? 'bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30' : 
                                            'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30')
                                        }`}>
                                            {tournamentWinner ? 'Completed' : (tournamentMatchesCount > 0 ? 'Active' : 'Pending')}
                                        </span>
                                    </div>
                                </div>

                                {tournamentWinner && (
                                    <div className="mt-4 ml-2 px-3 py-2 rounded-lg border border-brand-blue/10 bg-brand-blue/5 flex items-center justify-center gap-2 relative z-10">
                                        <TrophyIcon className="w-3.5 h-3.5 text-brand-blue" />
                                        <span className="text-[12px] font-bold uppercase tracking-wider text-text-primary">Winner: {tournamentWinner.name}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <CrickIQCard className="flex flex-col items-center justify-center py-12 text-center my-auto">
                    <h3 className="text-xl font-bold text-text-primary mb-2">No Tournaments Yet</h3>
                    <p className="text-text-secondary text-sm">Tap + Tournament to create your first tournament.</p>
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
        </div>
    );
};
export default TournamentList;