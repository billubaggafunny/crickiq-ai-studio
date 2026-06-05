import React, { useState, useMemo } from 'react';
import MatchTable from './MatchTable';
import { Match, Team, Tournament } from '../types';

export interface MatchesViewProps {
    matches: Match[];
    today: Date;
    getTeamById: (id: string) => Team | undefined;
    getTournamentById: (id: string) => Tournament | undefined;
    isMatchLive: boolean;
    handleShareMatch: (match: Match) => void;
    setEditingMatch: (match: Match) => void;
    handleDeleteMatch: (id: string) => void;
    onViewMatchResult: (matchId: string) => void;
    onContinueMatch: (match: Match) => void;
    onStartMatch: (match: Match) => void;
    setTossMatch: (match: Match) => void;
    onOpenMatchHub?: (matchId: string, returnLocation?: Record<string, unknown>) => void;
    initialMatchType?: boolean;
    tournaments?: Tournament[];
}

const MatchesView: React.FC<MatchesViewProps> = ({
    matches,
    today,
    getTeamById,
    getTournamentById,
    isMatchLive,
    handleShareMatch,
    setEditingMatch,
    handleDeleteMatch,
    onViewMatchResult,
    onContinueMatch,
    onStartMatch,
    setTossMatch,
    onOpenMatchHub,
    initialMatchType,
    tournaments
}) => {
    // true: Tournament, false: Single Match (Quick Match)
    const [matchType, setMatchType] = useState(initialMatchType !== undefined ? initialMatchType : true);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');

    const allTournaments = useMemo(() => {
        if (tournaments) return tournaments;
        // Fallback: collect from matches
        const uniqueIds = Array.from(new Set(matches.map(m => m.tournamentId).filter(Boolean)));
        return uniqueIds.map(id => getTournamentById(id as string)).filter(Boolean) as Tournament[];
    }, [tournaments, matches, getTournamentById]);

    const handleOpenMatchHub = (matchId: string) => {
        onOpenMatchHub?.(matchId, { matchType });
    };

    const handleToggleMatchType = () => {
        const newMatchType = !matchType;
        setMatchType(newMatchType);
        if (!newMatchType) {
            setSelectedTournamentId('all');
        }
    };

    const filteredMatches = useMemo(() => {
        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(todayDate);
        dayAfterTomorrow.setDate(todayDate.getDate() + 2);

        return matches.filter(m => {
            if (selectedTournamentId !== 'all') {
                if (m.isQuickMatch || m.tournamentId !== selectedTournamentId) {
                    return false;
                }
            } else {
                const matchesType = matchType ? !m.isQuickMatch : m.isQuickMatch;
                if (!matchesType) return false;
            }

            if (selectedStatus === 'completed') {
                if (m.status !== 'completed') return false;
            } else if (selectedStatus === 'upcoming') {
                if (m.status !== 'scheduled' || m.isDraft) return false;
            } else if (selectedStatus === 'draft') {
                if (!m.isDraft) return false;
            }

            return true;
        }).map(m => {
            let statusDisplay = '';
            if (m.wasAbandoned) statusDisplay = 'Abandoned';
            else if (m.status === 'live') statusDisplay = 'Live';
            else if (m.status === 'completed') statusDisplay = 'Finished';
            else if (m.status === 'scheduled') {
                const matchDate = new Date(m.date);
                matchDate.setHours(0, 0, 0, 0);
                if (matchDate > dayAfterTomorrow) statusDisplay = 'Coming Soon';
                else statusDisplay = 'Scheduled';
            }
            return { ...m, statusDisplay };
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [matches, matchType, today, selectedStatus, selectedTournamentId]);

    const tableTitle = useMemo(() => {
        if (selectedTournamentId !== 'all') {
            const t = allTournaments.find(tournament => tournament.id === selectedTournamentId);
            return t ? `${t.name} Matches` : "Tournament Matches";
        }
        return matchType ? "Tournament Matches" : "Quick Matches";
    }, [selectedTournamentId, matchType, allTournaments]);

    const tableEmptyMessage = useMemo(() => {
        if (selectedTournamentId !== 'all') {
            const t = allTournaments.find(tournament => tournament.id === selectedTournamentId);
            return t ? `No matches in ${t.name}.` : "No matches found.";
        }
        return `No ${matchType ? "Tournament" : "Quick"} matches.`;
    }, [selectedTournamentId, matchType, allTournaments]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-h2 font-bold text-text-primary">Matches</h2>
                <div className="flex items-center gap-2">
                    <span className={`text-sm ${matchType ? 'text-gray-500' : 'text-text-primary'}`}>Single Match</span>
                    <button 
                        onClick={handleToggleMatchType}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${matchType ? 'bg-brand-blue' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${matchType ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm ${matchType ? 'text-text-primary' : 'text-gray-500'}`}>Tournament</span>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 p-3.5 bg-primary rounded-2xl border border-brand-blue/10 dark:border-brand-blue/20">
                <div className="flex-1 flex flex-col gap-1 min-w-[140px]">
                    <label htmlFor="match-status-filter" className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Match Status
                    </label>
                    <select
                        id="match-status-filter"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="py-1.5 px-3 bg-primary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                    >
                        <option value="all">All Matches</option>
                        <option value="completed">Completed</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="draft">Draft / Pending Setup</option>
                    </select>
                </div>

                {matchType && allTournaments.length > 1 && (
                    <div className="flex-1 flex flex-col gap-1 min-w-[140px]">
                        <label htmlFor="match-tournament-filter" className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            Tournament
                        </label>
                        <select
                            id="match-tournament-filter"
                            value={selectedTournamentId}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedTournamentId(val);
                                if (val !== 'all') {
                                    setMatchType(true);
                                }
                            }}
                            className="py-1.5 px-3 bg-primary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                        >
                            <option value="all">All Tournaments</option>
                            {allTournaments.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            
            <MatchTable 
               list={filteredMatches}
               title={tableTitle}
               emptyMessage={tableEmptyMessage}
               today={today}
               getTeamById={getTeamById}
               getTournamentById={getTournamentById}
               isMatchLive={isMatchLive}
               handleShareMatch={handleShareMatch}
               setEditingMatch={setEditingMatch}
               handleDeleteMatch={handleDeleteMatch}
               onViewMatchResult={onViewMatchResult}
               onContinueMatch={onContinueMatch}
               onStartMatch={onStartMatch}
               setTossMatch={setTossMatch}
               onOpenMatchHub={handleOpenMatchHub}
            />
        </div>
    );
};

export default MatchesView;
