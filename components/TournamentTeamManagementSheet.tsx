import React, { useState, useMemo } from 'react';
import { X, Search, PlusCircle, Edit3, CheckCircle, ChevronRight, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Team, Tournament } from '../types';

interface TournamentTeamManagementSheetProps {
    isOpen: boolean;
    onClose: () => void;
    tournament: Tournament | null;
    allTeams: Team[];
    onCreateNewTeam: () => void;
    onSelectExistingTeam: (teamId: string) => void;
    onEditTeam: (teamId: string) => void;
}

type Mode = 'menu' | 'select' | 'edit';

export const TournamentTeamManagementSheet: React.FC<TournamentTeamManagementSheetProps> = ({
    isOpen,
    onClose,
    tournament,
    allTeams,
    onCreateNewTeam,
    onSelectExistingTeam,
    onEditTeam
}) => {
    const [mode, setMode] = useState<Mode>('menu');
    const [searchQuery, setSearchQuery] = useState('');

    const handleClose = () => {
        setMode('menu');
        setSearchQuery('');
        onClose();
    };

    const tournamentTeamIds = useMemo(() => tournament?.teamIds || [], [tournament]);

    const availableTeams = useMemo(() => {
        return allTeams.filter(t => !tournamentTeamIds.includes(t.id) && !t.isArchived)
            .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || (t.shortName && t.shortName.toLowerCase().includes(searchQuery.toLowerCase())));
    }, [allTeams, tournamentTeamIds, searchQuery]);

    const currentTournamentTeams = useMemo(() => {
        return allTeams.filter(t => tournamentTeamIds.includes(t.id));
    }, [allTeams, tournamentTeamIds]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[51] bg-secondary border-t border-border rounded-t-3xl shadow-[0_-10px_40px_rgba(0,123,255,0.05)] flex flex-col pt-2 shadow-2xl pb-safe flex-1"
                        style={{ maxHeight: '90vh' }}
                    >
                        <div className="w-12 h-1.5 bg-tertiary rounded-full mx-auto mb-4 opacity-50" />
                        
                        <div className="flex justify-between items-center px-6 pb-4 border-b border-divider">
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {mode === 'menu' && 'Tournament Teams'}
                                {mode === 'select' && 'Select Existing Team'}
                                {mode === 'edit' && 'Edit Tournament Team'}
                            </h2>
                            <button
                                onClick={mode === 'menu' ? handleClose : () => setMode('menu')}
                                className="p-2 -mr-2 bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 pb-12">
                            {mode === 'menu' && (
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => {
                                            handleClose();
                                            onCreateNewTeam();
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-brand-blue/10 hover:bg-brand-blue/20 border border-brand-blue/20 rounded-2xl transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-brand-blue/20 text-brand-blue rounded-xl flex items-center justify-center">
                                                <PlusCircle className="w-6 h-6" />
                                            </div>
                                            <div className="text-left font-bold text-lg text-white">Create New Team</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-text-muted" />
                                    </button>

                                    <button 
                                        onClick={() => setMode('select')}
                                        className="w-full flex items-center justify-between p-4 bg-tertiary/55 hover:bg-tertiary border border-border/50 rounded-2xl transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-tertiary/50 text-text-secondary rounded-xl flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div className="text-left font-bold text-lg text-white">Select Existing Team</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-text-muted" />
                                    </button>

                                    {currentTournamentTeams.length > 0 && (
                                        <button 
                                            onClick={() => setMode('edit')}
                                            className="w-full flex items-center justify-between p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl transition-all mt-4"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center">
                                                    <Edit3 className="w-6 h-6" />
                                                </div>
                                                <div className="text-left font-bold text-lg text-white">Edit Tournament Team</div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-text-muted" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {mode === 'select' && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                        <input
                                            type="text"
                                            placeholder="Search existing teams..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-tertiary border border-border text-white pl-9 pr-4 py-3 rounded-xl focus:outline-none focus:border-brand-blue transition-colors"
                                        />
                                    </div>

                                    {availableTeams.length > 0 ? (
                                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                                            {availableTeams.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => {
                                                        onSelectExistingTeam(t.id);
                                                        handleClose();
                                                    }}
                                                    className="w-full flex items-center justify-between p-3 bg-tertiary/40 hover:bg-tertiary border border-border/50 rounded-xl transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="w-10 h-10 rounded-lg text-white flex items-center justify-center text-sm font-bold font-mono"
                                                            style={{ backgroundColor: t.logoColor || t.logo || '#3B82F6' }}
                                                        >
                                                            {(t.shortName || t.name).slice(0, 3).toUpperCase()}
                                                        </div>
                                                        <div className="text-left flex flex-col">
                                                            <span className="font-bold text-white text-base">{t.name}</span>
                                                            <span className="text-xs text-text-secondary">{t.players.length} Players</span>
                                                        </div>
                                                    </div>
                                                    <Check className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100" />
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center text-text-secondary">
                                            <p className="text-sm">No teams found.</p>
                                            <p className="text-xs mt-1">Create your first team.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {mode === 'edit' && (
                                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                                    {currentTournamentTeams.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                onEditTeam(t.id);
                                                handleClose();
                                            }}
                                            className="w-full flex items-center justify-between p-3 bg-tertiary/40 hover:bg-tertiary border border-border/50 rounded-xl transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-10 h-10 rounded-lg text-white flex items-center justify-center text-sm font-bold font-mono group-hover:scale-105 transition-transform"
                                                    style={{ backgroundColor: t.logoColor || t.logo || '#3B82F6' }}
                                                >
                                                    {(t.shortName || t.name).slice(0, 3).toUpperCase()}
                                                </div>
                                                <div className="text-left flex flex-col">
                                                    <span className="font-bold text-white text-base">{t.name}</span>
                                                    <span className="text-xs text-text-secondary">{t.players.length} Players</span>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                                <Edit3 className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
