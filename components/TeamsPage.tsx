import React, { useState, useMemo } from 'react';
import { Search, Plus, ChevronRight, Users, Trophy, Award, Filter } from 'lucide-react';
import CrickIQCard from './CrickIQCard';
import type { Team, Match, Tournament } from '../types';
import { normalizeTeam } from '../utils/teamNormalization';
import { CreateTeamSheet } from './CreateTeamSheet';
import { useNotification } from '../hooks/useNotification';

export interface TeamsPageProps {
    teams: Team[];
    matches: Match[];
    tournaments: Tournament[];
    onOpenMatchHub?: (matchId: string) => void;
    onOpenTeamDetails?: (teamId: string) => void;
    createGlobalTeam?: (input: {
        name: string;
        shortName?: string;
        teamType?: Team["teamType"];
        logoColor?: string;
        logoUrl?: string;
        homeGround?: string;
        city?: string;
        state?: string;
        country?: string;
    }) => Team | null;
}

const TEAMS_FILTER_CHIPS = [
    { id: 'all', label: 'All' },
    { id: 'community', label: 'Community' },
    { id: 'education', label: 'Education' },
    { id: 'professional', label: 'Professional' },
    { id: 'national', label: 'National' },
    { id: 'archived', label: 'Archived' }
];

const TeamsSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="teams-skeleton-container">
            {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-primary border border-brand-blue/10 dark:border-brand-blue/20 p-5 rounded-3xl flex flex-col justify-between h-[166px]">
                    <div className="flex items-start gap-4">
                        {/* Avatar badge placeholder */}
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                        
                        {/* Title and metadata lines */}
                        <div className="flex-grow space-y-2.5">
                            <div className="h-4 bg-gray-150 dark:bg-white/5 rounded-full w-2/3" />
                            <div className="flex gap-2">
                                <div className="h-3 bg-gray-150 dark:bg-white/5 rounded w-1/4" />
                                <div className="h-3 bg-gray-150 dark:bg-white/5 rounded w-1/4" />
                            </div>
                        </div>
                    </div>
                    {/* Bottom stats row */}
                    <div className="mt-5 pt-3 border-t border-brand-blue/5 flex items-center justify-between">
                        <div className="h-3 bg-gray-150 dark:bg-white/5 rounded w-1/5" />
                        <div className="h-3 bg-gray-150 dark:bg-white/5 rounded w-1/5" />
                        <div className="h-3 bg-gray-150 dark:bg-white/5 rounded w-1/5" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const TeamsPage: React.FC<TeamsPageProps> = ({ teams, matches, tournaments, onOpenTeamDetails, createGlobalTeam }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'players'>('recent');
    const [alertModal, setAlertModal] = useState<{ title: string; message: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { showNotification } = useNotification();

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 400); // 400ms delay for high-quality skeleton presentation
        return () => clearTimeout(timer);
    }, []);

    // Derive match played count dynamically
    const matchesPlayedMap = useMemo(() => {
        const counts: Record<string, number> = {};
        matches.forEach(m => {
            if (m.team1Id) counts[m.team1Id] = (counts[m.team1Id] || 0) + 1;
            if (m.team2Id) counts[m.team2Id] = (counts[m.team2Id] || 0) + 1;
        });
        return counts;
    }, [matches]);

    // Derive tournament participation count dynamically
    const tournamentsMap = useMemo(() => {
        const counts: Record<string, number> = {};
        tournaments.forEach(t => {
            if (Array.isArray(t.teamIds)) {
                t.teamIds.forEach(teamId => {
                    counts[teamId] = (counts[teamId] || 0) + 1;
                });
            }
        });
        return counts;
    }, [tournaments]);

    // Safe normalized team selector/filter mapping
    const processedTeams = useMemo(() => {
        return teams.map(t => normalizeTeam(t));
    }, [teams]);

    const filteredTeams = useMemo(() => {
        return processedTeams.filter(team => {
            // Apply Search Filtering (name, short name, initials)
            const query = searchQuery.trim().toLowerCase();
            const matchesSearch = !query || 
                team.name.toLowerCase().includes(query) ||
                (team.shortName && team.shortName.toLowerCase().includes(query)) ||
                (team.teamInitials && team.teamInitials.toLowerCase().includes(query));

            if (!matchesSearch) return false;

            // Apply Chip Category Filtering
            if (activeFilter === 'all') {
                return !team.isArchived;
            } else if (activeFilter === 'archived') {
                return team.isArchived;
            } else if (activeFilter === 'community') {
                const type = (team.teamType || 'custom').toLowerCase();
                return !team.isArchived && (type === 'local' || type === 'club' || type === 'custom');
            } else if (activeFilter === 'education') {
                const type = (team.teamType || '').toLowerCase();
                return !team.isArchived && (type === 'school' || type === 'college' || type === 'academy');
            } else if (activeFilter === 'professional') {
                const type = (team.teamType || '').toLowerCase();
                return !team.isArchived && (type === 'corporate' || type === 'domestic' || type === 'franchise');
            } else if (activeFilter === 'national') {
                return !team.isArchived && (team.teamType || '').toLowerCase() === 'national';
            }
            return !team.isArchived;
        });
    }, [processedTeams, searchQuery, activeFilter]);

    // Sorting implementation
    const sortedTeams = useMemo(() => {
        const result = [...filteredTeams];
        if (sortBy === 'recent') {
            result.sort((a, b) => {
                const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                if (da !== db) return db - da;
                return a.name.localeCompare(b.name);
            });
        } else if (sortBy === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'players') {
            result.sort((a, b) => (b.players?.length || 0) - (a.players?.length || 0));
        }
        return result;
    }, [filteredTeams, sortBy]);

    const handleAddTeamPlaceholder = () => {
        if (createGlobalTeam) {
            setIsCreateOpen(true);
        } else {
            setAlertModal({
                title: 'Add Team Flow',
                message: 'Creating and customization of squads, logos, types, and home grounds will be fully unlocked in Phase 3. Stay tuned!'
            });
        }
    };

    const handleCreateSuccess = (newTeam: Team) => {
        showNotification(`Team "${newTeam.name}" created successfully.`, 'success');
        setActiveFilter('all');
    };

    const handleCardClickPlaceholder = (teamName: string) => {
        setAlertModal({
            title: `${teamName} Details`,
            message: 'The Team Details Hub with real-time stats overview, matches lineup, player records, and full management will be fully unlocked in Phase 3.'
        });
    };

    return (
        <div className="space-y-6 pb-24 md:pb-8 relative">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 id="teams-page-title" className="text-h2 font-bold text-text-primary tracking-tight">Teams</h2>
                    <p className="text-sm text-text-secondary mt-1">Manage your cricket teams, squads, and history</p>
                </div>
                <button
                    id="add-team-btn"
                    onClick={handleAddTeamPlaceholder}
                    className="hidden md:flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-2xl text-button font-bold transition-all shadow-md active:scale-98"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Team</span>
                </button>
            </div>

            {/* Filter and Search Bar Row */}
            <CrickIQCard className="p-4 bg-primary rounded-3xl border border-brand-blue/10 dark:border-brand-blue/20">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                            id="team-search-input"
                            type="text"
                            placeholder="Search teams by name, short name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-primary text-text-primary border border-brand-blue/15 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                    </div>

                    {/* Sorting Dropdown */}
                    <div className="w-full md:w-60 flex items-center gap-2 relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 shrink-0 pointer-events-none" />
                        <select
                            id="team-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'players')}
                            className="w-full h-12 pl-10 pr-10 bg-primary text-text-primary border border-brand-blue/15 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/40 transition-all cursor-pointer"
                        >
                            <option value="recent">Sort: Recent</option>
                            <option value="name">Sort: Name (A-Z)</option>
                            <option value="players">Sort: Player Count</option>
                        </select>
                    </div>
                </div>

                {/* Horizontal Scroll Filter Chips Container */}
                <div className="mt-4 flex items-center overflow-x-auto no-scrollbar gap-2 pb-1">
                    {TEAMS_FILTER_CHIPS.map(chip => {
                        const isSelected = activeFilter === chip.id;
                        return (
                            <button
                                key={chip.id}
                                id={`filter-chip-${chip.id}`}
                                onClick={() => setActiveFilter(chip.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap tracking-wide uppercase transition-all duration-200 border cursor-pointer ${
                                    isSelected
                                        ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                                        : 'bg-primary border-brand-blue/15 text-text-secondary hover:bg-brand-blue/5'
                                }`}
                            >
                                {chip.label}
                            </button>
                        );
                    })}
                </div>
            </CrickIQCard>

            {/* Skeleton Loading or Teams List */}
            {isLoading ? (
                <TeamsSkeleton />
            ) : sortedTeams.length > 0 ? (
                <div id="teams-grid-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedTeams.map(team => {
                        const countMatches = matchesPlayedMap[team.id] || 0;
                        const countTournaments = tournamentsMap[team.id] || 0;
                        
                        return (
                            <div 
                                key={team.id} 
                                id={`team-card-${team.id}`}
                                onClick={() => onOpenTeamDetails ? onOpenTeamDetails(team.id) : handleCardClickPlaceholder(team.name)}
                                className="cursor-pointer group block"
                            >
                                <CrickIQCard 
                                    accentColor={team.logoColor || team.logo}
                                    className="p-5 h-full relative flex flex-col justify-between hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl"
                                >
                                    {/* Card Content Header */}
                                    <div className="flex items-start gap-4 h-full">
                                        {/* Colored Badge */}
                                        <div 
                                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white uppercase tracking-wider shrink-0 text-button shadow-inner"
                                            style={{ backgroundColor: team.logoColor || team.logo || '#3B82F6' }}
                                        >
                                            {team.teamInitials || 'TM'}
                                        </div>

                                        {/* Info Block */}
                                        <div className="flex-grow space-y-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="font-sans font-bold text-base text-text-primary group-hover:text-brand-blue transition-colors leading-tight">
                                                    {team.name}
                                                </h3>
                                                {team.shortName && team.shortName !== team.name && (
                                                    <span className="text-xs bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-bold uppercase">
                                                        {team.shortName}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Attributes / Badges */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[11px] font-extrabold tracking-wider uppercase text-text-secondary bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                    {team.teamType || 'Custom'}
                                                </span>
                                                <span className="text-[11px] font-extrabold tracking-wider uppercase text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-md">
                                                    Scope: {team.scope || 'Global'}
                                                </span>
                                                {team.isArchived && (
                                                    <span className="text-[11px] font-extrabold tracking-wider uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md">
                                                        Archived
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Arrow */}
                                        <div className="text-gray-400 group-hover:text-brand-blue group-hover:translate-x-1 transition-all">
                                            <ChevronRight className="w-5 h-5 shrink-0" />
                                        </div>
                                    </div>

                                    {/* Card Bottom Meta Data */}
                                    <div className="mt-5 pt-3 border-t border-brand-blue/5 flex items-center justify-between text-xs text-text-secondary">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            <strong>{team.players?.length || 0}</strong> Players
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Award className="w-3.5 h-3.5" />
                                            <strong>{countMatches}</strong> Matches
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Trophy className="w-3.5 h-3.5" />
                                            <strong>{countTournaments}</strong> Tournaments
                                        </span>
                                    </div>
                                </CrickIQCard>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Pure Clean Elegant Empty State */
                <CrickIQCard className="p-12 text-center border border-brand-blue/10 dark:border-brand-blue/20 flex flex-col items-center justify-center space-y-4 max-w-xl mx-auto rounded-3xl bg-primary">
                    <div className="w-16 h-16 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                        <Users className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold text-text-primary">No Teams Found</h3>
                        <p className="text-sm text-text-secondary max-w-md">
                            No teams match the selected filter. Try switching filter tabs or create a new team to manage players.
                        </p>
                    </div>
                    <button
                        onClick={handleAddTeamPlaceholder}
                        className="mt-3 inline-flex items-center justify-center gap-2 px-5 py-2 text-button font-bold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-2xl shadow-md transition-all active:scale-98"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Team</span>
                    </button>
                </CrickIQCard>
            )}

            {/* Mobile Floating Action Button (FAB) for Add Team */}
            <button
                id="mobile-add-team-fab"
                onClick={handleAddTeamPlaceholder}
                className="fixed bottom-24 right-6 z-40 md:hidden flex items-center justify-center gap-2 px-5 h-14 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-full font-bold shadow-lg shadow-brand-blue/20 transition-all active:scale-95 border border-brand-blue/10"
                aria-label="Add Team"
            >
                <Plus className="w-6 h-6 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">Add Team</span>
            </button>

            {/* Custom Interactive Alert Modal Dialog Box for Premium look */}
            {alertModal && (
                <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-primary border border-brand-blue/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary leading-none">{alertModal.title}</h3>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">{alertModal.message}</p>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setAlertModal(null)}
                                className="px-5 py-2.5 bg-brand-blue text-white rounded-2xl font-bold text-xs transition-all tracking-wider uppercase active:scale-98"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {createGlobalTeam && isCreateOpen && (
                <CreateTeamSheet
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    teams={teams}
                    createGlobalTeam={createGlobalTeam}
                    onOpenTeamDetails={onOpenTeamDetails}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default TeamsPage;
