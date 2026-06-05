import React, { useState, useMemo } from 'react';
import { 
    ChevronLeft, Users, Trophy, Activity, Award, Settings, 
    Layers, MapPin, ShieldAlert, Sparkles, AlertTriangle, Calendar,
    Search, ChevronRight, CheckCircle2, GitMerge, Archive, Info, Lock
} from 'lucide-react';
import CrickIQCard from './CrickIQCard';
import type { Team, Match, Tournament, Player } from '../types';
import { normalizeTeam } from '../utils/teamNormalization';
import { usePlayerNavigation } from '../contexts/PlayerNavigationContext';
import { calculatePointsTable } from '../utils/cricketLogic';

interface ExtendedPlayer extends Player {
    isWicketKeeper?: boolean;
    isWicketkeeper?: boolean;
    battingStyle?: string;
    bowlingStyle?: string;
}

export interface TeamDetailsHubProps {
    teamId: string;
    teams: Team[];
    matches: Match[];
    tournaments: Tournament[];
    onBack: () => void;
    onOpenMatchHub?: (matchId: string, returnLocation?: Record<string, unknown>) => void;
    onViewTournament?: (
        tournamentId: string,
        returnContext?: {
            source: 'team_details';
            teamId: string;
            teamDetailsTab: 'tournaments';
            tournamentSearchQuery?: string;
            tournamentSelectedFilter?: string;
            tournamentSortOrder?: 'recent' | 'name' | 'status' | 'matches';
            visibleTournamentCount?: number;
        }
    ) => void;
    initialTab?: string;
    initialMatchSearchQuery?: string;
    initialMatchSelectedFilter?: string;
    initialMatchSortOrder?: 'recent' | 'oldest' | 'status';
    initialVisibleMatchCount?: number;
    initialTournamentSearchQuery?: string;
    initialTournamentSelectedFilter?: string;
    initialTournamentSortOrder?: 'recent' | 'name' | 'status' | 'matches';
    initialVisibleTournamentCount?: number;
}

const TABS = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'players', label: 'Players', icon: <Users className="w-4 h-4" /> },
    { id: 'matches', label: 'Matches', icon: <Activity className="w-4 h-4" /> },
    { id: 'tournaments', label: 'Tournaments', icon: <Trophy className="w-4 h-4" /> },
    { id: 'stats', label: 'Stats', icon: <Award className="w-4 h-4" /> },
    { id: 'records', label: 'Records', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
];

/**
 * Safely fetches recent matches for a team.
 * Optimized to be lightweight and avoid expensive Date instance construction
 * inside the sort comparator. Recalculates dynamically with absolute safety.
 */
function getRecentTeamMatches(matches: Match[], teamId: string, limit: number = 3): Match[] {
    if (!teamId) return [];

    // Filter first in O(N) to keep the working set small before parsing date strings
    const filtered: Match[] = [];
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        if (m.team1Id === teamId || m.team2Id === teamId) {
            filtered.push(m);
        }
    }

    // Pre-calculate timestamps of the filtered subset to avoid redundant date parsing
    const matchWithTimestamp = filtered.map(m => {
        let ts = 0;
        if (m.createdAt) {
            ts = Date.parse(m.createdAt);
        } else if (m.date) {
            ts = Date.parse(m.date);
        }
        if (isNaN(ts)) {
            ts = 0;
        }
        return { match: m, ts };
    });

    // Sort descending by timestamp
    matchWithTimestamp.sort((a, b) => b.ts - a.ts);

    // Limit outputs precisely
    const result: Match[] = [];
    const actualLimit = Math.min(matchWithTimestamp.length, limit);
    for (let i = 0; i < actualLimit; i++) {
        result.push(matchWithTimestamp[i].match);
    }

    return result;
}

const TeamDetailsHub: React.FC<TeamDetailsHubProps> = ({ 
    teamId, 
    teams, 
    matches, 
    tournaments, 
    onBack, 
    onOpenMatchHub,
    onViewTournament,
    initialTab,
    initialMatchSearchQuery,
    initialMatchSelectedFilter,
    initialMatchSortOrder,
    initialVisibleMatchCount,
    initialTournamentSearchQuery,
    initialTournamentSelectedFilter,
    initialTournamentSortOrder,
    initialVisibleTournamentCount
}) => {
    const [activeTab, setActiveTab] = useState(initialTab || 'overview');
    const [playerSearchQuery, setPlayerSearchQuery] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
    
    // Matches Tab State
    const [matchSearchQuery, setMatchSearchQuery] = useState(initialMatchSearchQuery || '');
    const [matchSelectedFilter, setMatchSelectedFilter] = useState(initialMatchSelectedFilter || 'all');
    const [matchSortOrder, setMatchSortOrder] = useState<'recent' | 'oldest' | 'status'>(initialMatchSortOrder || 'recent');
    const [visibleMatchCount, setVisibleMatchCount] = useState(initialVisibleMatchCount ?? 25);

    // Tournaments Tab State
    const [tournamentSearchQuery, setTournamentSearchQuery] = useState(initialTournamentSearchQuery || '');
    const [tournamentSelectedFilter, setTournamentSelectedFilter] = useState(initialTournamentSelectedFilter || 'all');
    const [tournamentSortOrder, setTournamentSortOrder] = useState<'recent' | 'name' | 'status' | 'matches'>(initialTournamentSortOrder || 'recent');
    const [visibleTournamentCount, setVisibleTournamentCount] = useState(initialVisibleTournamentCount ?? 20);
    
    // Team Settings Toast/Notice States
    const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
    const [settingsNoticeType, setSettingsNoticeType] = useState<'info' | 'warning' | 'success'>('info');
    
    // Resolve global player navigation context
    const { openPlayerDetails } = usePlayerNavigation();

    // Resolve team safely by ID only
    const teamRaw = useMemo(() => {
        return teams.find(t => t.id === teamId);
    }, [teams, teamId]);

    // Keep read-only normalized representation
    const team = useMemo(() => {
        return teamRaw ? normalizeTeam(teamRaw) : null;
    }, [teamRaw]);

    // Gather participated tournaments safely
    const participatedTournaments = useMemo(() => {
        if (!teamId) return [];
        return tournaments.filter(t => {
            // direct check
            const isDirectMember = t.teamIds && Array.isArray(t.teamIds) && t.teamIds.includes(teamId);
            if (isDirectMember) return true;

            // fallback checking if any matches played inside this tournament involve this team
            const hasMatches = matches.some(m => 
                m.tournamentId === t.id && (m.team1Id === teamId || m.team2Id === teamId)
            );
            return hasMatches;
        });
    }, [tournaments, matches, teamId]);

    // Compute metrics for each participated tournament
    const tournamentListWithMetrics = useMemo(() => {
        if (!teamId) return [];
        
        return participatedTournaments.map(t => {
            const tMatches = matches.filter(m => m.tournamentId === t.id && (m.team1Id === teamId || m.team2Id === teamId));
            
            let playedCount = 0;
            let winsCount = 0;
            let lossesCount = 0;
            let drawnCount = 0;
            const totalCount = tMatches.length;

            tMatches.forEach(m => {
                if (m.status === 'completed' || m.status === 'live') {
                    playedCount++;
                }
                if (m.status === 'completed') {
                    if (m.winnerId === teamId) {
                        winsCount++;
                    } else if (m.winnerId === 'draw' || m.winnerId === 'tie' || !m.winnerId || m.wasAbandoned) {
                        drawnCount++;
                    } else {
                        lossesCount++;
                    }
                }
            });

            // Derive result / position
            let resultText = 'Participated';

            // Find if there is a final match
            const finalMatch = tMatches.find(m => m.knockoutType === 'final');
            const semiMatch = tMatches.find(m => m.knockoutType === 'semifinal');

            if (finalMatch && finalMatch.status === 'completed') {
                if (finalMatch.winnerId === teamId) {
                    resultText = '🏆 Champion';
                } else if (finalMatch.winnerId && finalMatch.winnerId !== 'draw') {
                    resultText = '🥈 Runner-up';
                }
            } else if (semiMatch && semiMatch.status === 'completed' && semiMatch.winnerId !== teamId && semiMatch.winnerId !== 'draw' && semiMatch.winnerId) {
                resultText = '🥉 Semi-finalist';
            } else {
                // Let's compute rank
                const matchedTeamIds = new Set(
                    matches
                        .filter(m => m.tournamentId === t.id)
                        .map(m => m.team1Id)
                        .concat(matches.filter(m => m.tournamentId === t.id).map(m => m.team2Id))
                );
                const tournamentTeams = teams.filter(theTeam => {
                    return (t.teamIds && t.teamIds.includes(theTeam.id)) || matchedTeamIds.has(theTeam.id);
                });
                const allTournamentMatches = matches.filter(m => m.tournamentId === t.id);
                
                if (tournamentTeams.length > 0 && allTournamentMatches.length > 0) {
                    try {
                        const pTable = calculatePointsTable(tournamentTeams, allTournamentMatches);
                        const rankIndex = pTable.findIndex(row => row.teamId === teamId);
                        if (rankIndex !== -1) {
                            const rank = rankIndex + 1;
                            const total = pTable.length;
                            resultText = `#${rank} of ${total} in Group`;
                        }
                    } catch (e) {
                        console.error('Error calculating rank for team', teamId, e);
                    }
                }
            }

            // Derive status
            let status: 'upcoming' | 'active' | 'completed' = 'active';
            const now = new Date();
            const startVal = t.startDate ? new Date(t.startDate) : null;
            const endVal = t.endDate ? new Date(t.endDate) : null;

            if (endVal && endVal < now) {
                status = 'completed';
            } else if (startVal && startVal > now) {
                status = 'upcoming';
            } else {
                // Check match statuses
                const hasLive = tMatches.some(m => m.status === 'live');
                const allCompleted = tMatches.length > 0 && tMatches.every(m => m.status === 'completed');
                const hasStarted = tMatches.some(m => m.status !== 'scheduled' && m.status !== 'draft');

                if (hasLive) {
                    status = 'active';
                } else if (tMatches.length > 0 && allCompleted) {
                    status = 'completed';
                } else if (hasStarted) {
                    status = 'active';
                } else {
                    status = 'upcoming';
                }
            }

            return {
                tournament: t,
                playedCount,
                winsCount,
                lossesCount,
                drawnCount,
                totalCount,
                resultText,
                status
            };
        });
    }, [participatedTournaments, matches, teamId, teams]);

    // Apply tournament filters and sorting
    const filteredAndSortedTournaments = useMemo(() => {
        let list = tournamentListWithMetrics;

        // Apply Search
        if (tournamentSearchQuery.trim()) {
            const query = tournamentSearchQuery.toLowerCase().trim();
            list = list.filter(item => {
                const nameMatch = item.tournament.name.toLowerCase().includes(query);
                const formatMatch = (item.tournament.format || '').toLowerCase().includes(query);
                const locMatch = (item.tournament.location || '').toLowerCase().includes(query);
                const statusMatch = item.status.toLowerCase().includes(query);
                return nameMatch || formatMatch || locMatch || statusMatch;
            });
        }

        // Apply Filter Chips
        if (tournamentSelectedFilter !== 'all') {
            list = list.filter(item => {
                if (tournamentSelectedFilter === 'active') {
                    return item.status === 'active';
                }
                if (tournamentSelectedFilter === 'upcoming') {
                    return item.status === 'upcoming';
                }
                if (tournamentSelectedFilter === 'completed') {
                    return item.status === 'completed';
                }
                if (tournamentSelectedFilter === 'won') {
                    return item.resultText.includes('Champion');
                }
                if (tournamentSelectedFilter === 'knockouts') {
                    const tMatches = matches.filter(m => m.tournamentId === item.tournament.id && (m.team1Id === teamId || m.team2Id === teamId));
                    return tMatches.some(m => !!m.knockoutType) || item.tournament.format === 'Knockout' || item.tournament.format === 'Round Robin + Knockout';
                }
                return true;
            });
        }

        // Apply Sorting
        return [...list].sort((a, b) => {
            if (tournamentSortOrder === 'recent') {
                const dateA = a.tournament.startDate ? Date.parse(a.tournament.startDate) : (a.tournament.createdAt ? Date.parse(a.tournament.createdAt) : 0);
                const dateB = b.tournament.startDate ? Date.parse(b.tournament.startDate) : (b.tournament.createdAt ? Date.parse(b.tournament.createdAt) : 0);
                return dateB - dateA;
            }
            if (tournamentSortOrder === 'name') {
                return a.tournament.name.localeCompare(b.tournament.name);
            }
            if (tournamentSortOrder === 'status') {
                const statusWeights = { completed: 3, active: 2, upcoming: 1 };
                return statusWeights[b.status] - statusWeights[a.status];
            }
            if (tournamentSortOrder === 'matches') {
                return b.playedCount - a.playedCount;
            }
            return 0;
        });
    }, [tournamentListWithMetrics, tournamentSearchQuery, tournamentSelectedFilter, tournamentSortOrder, matches, teamId]);

    // Paginated subsets as guided
    const paginatedTournaments = useMemo(() => {
        return filteredAndSortedTournaments.slice(0, visibleTournamentCount);
    }, [filteredAndSortedTournaments, visibleTournamentCount]);

    // Filter and search players roster list with maximum speed and useMemo
    const filteredPlayers = useMemo(() => {
        const roster = team?.players || [];
        if (!playerSearchQuery && selectedRoleFilter === 'all') {
            return roster;
        }

        const query = playerSearchQuery.toLowerCase().trim();
        
        return roster.filter(player => {
            // Match Role Filter
            if (selectedRoleFilter !== 'all') {
                const roleVal = (player.role || '').toLowerCase();
                const filterMap: Record<string, string[]> = {
                    batsman: ['batsman', 'batter'],
                    bowler: ['bowler'],
                    all_rounder: ['all-rounder', 'all_rounder', 'all rounder'],
                    wicket_keeper: ['wicket keeper', 'wicketkeeper', 'wk', 'keeper']
                };
                const targets = filterMap[selectedRoleFilter] || [];
                const roleMatches = targets.some(tgt => roleVal.includes(tgt));
                if (!roleMatches) return false;
            }

            // Match Search Query
            if (query) {
                const nameMatches = (player.name || '').toLowerCase().includes(query);
                const roleMatches = (player.role || '').toLowerCase().includes(query);
                const jerseyMatches = player.number !== undefined && String(player.number).includes(query);
                return nameMatches || roleMatches || jerseyMatches;
            }

            return true;
        });
    }, [team?.players, playerSearchQuery, selectedRoleFilter]);

    // Player details click navigation logic
    const handlePlayerClick = (p: Player) => {
        openPlayerDetails({
            sourceScreen: 'TeamDetailsPage',
            teamId: teamId,
            playerId: p.id,
            returnTo: 'team_details',
            mode: 'view'
        });
    };

    // Derive detailed match and tournament analytics for this team
    const teamStats = useMemo(() => {
        if (!teamId) {
            return { 
                matchesPlayed: 0, 
                quickMatches: 0, 
                tournamentMatches: 0, 
                tournamentsParticipated: 0, 
                recentMatches: [] 
            };
        }

        let matchesPlayed = 0;
        let quickMatches = 0;
        let tournamentMatches = 0;

        // Perform counts in a single O(N) scan over the matches array
        for (let i = 0; i < matches.length; i++) {
            const m = matches[i];
            if (m.team1Id === teamId || m.team2Id === teamId) {
                matchesPlayed++;
                if (m.tournamentId) {
                    tournamentMatches++;
                } else {
                    quickMatches++;
                }
            }
        }

        // Tournaments count mapping
        const participatedTourneys = tournaments.filter(t => {
            return Array.isArray(t.teamIds) && t.teamIds.includes(teamId);
        }).length;

        // Fetch up to 3 recent matches safely with optimized calculation
        const recentMatches = getRecentTeamMatches(matches, teamId, 3);

        return {
            matchesPlayed,
            quickMatches,
            tournamentMatches,
            tournamentsParticipated: participatedTourneys,
            recentMatches
        };
    }, [matches, tournaments, teamId]);

    // Resolve captain, vice captain, and wicketkeeper safely from players list
    const teamLeadership = useMemo(() => {
        if (!team) return { captain: null, viceCaptain: null, wicketKeeper: null };
        const playersList = team.players || [];
        
        const captain = playersList.find(p => p.id === team.captainId);
        const viceCaptain = playersList.find(p => p.id === team.viceCaptainId);
        
        // Find wicketkeeper by role text/tag
        const wicketKeeper = playersList.find(p => {
            const roleStr = (p.role || '').toLowerCase();
            return roleStr.includes('keeper') || roleStr.includes('wk') || roleStr.includes('wicket');
        });

        return { captain, viceCaptain, wicketKeeper };
    }, [team]);

    // Helper to extract styled match status and badge classes
    const getMatchStatusInfo = (m: Match) => {
        if (m.wasAbandoned) {
            return { id: 'abandoned', label: 'Abandoned', colorClass: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400' };
        }
        if (m.status === 'live') {
            return { id: 'live', label: 'Live', colorClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/15 animate-pulse' };
        }
        if (m.status === 'completed') {
            return { id: 'completed', label: 'Completed', colorClass: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/15' };
        }
        if (m.isDraft) {
            return { id: 'draft', label: 'Setup Pending', colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15' };
        }
        
        // Date parsing to identify upcoming / ready status
        const matchDateObj = new Date(m.date.replace(/-/g, '/'));
        matchDateObj.setHours(0, 0, 0, 0);
        const todayNoTime = new Date();
        todayNoTime.setHours(0, 0, 0, 0);
        
        const isToday = matchDateObj.getTime() === todayNoTime.getTime();
        if (isToday) {
            if (!m.toss) {
                return { id: 'readyToToss', label: 'Ready for Toss', colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15' };
            }
            return { id: 'readyToStart', label: 'Ready to Start', colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15' };
        }
        
        return { id: 'upcoming', label: 'Upcoming', colorClass: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-slate-400' };
    };

    // Sorted and filtered matches list implementation (Read-Only)
    const sortedMatches = useMemo(() => {
        const filtered = matches.filter(m => {
            // Identity Check: Must belong to this team by ID only
            if (m.team1Id !== team.id && m.team2Id !== team.id) return false;
            
            // Status/Type Filter Chips
            if (matchSelectedFilter !== 'all') {
                const statusInfo = getMatchStatusInfo(m);
                if (matchSelectedFilter === 'live') {
                    if (m.status !== 'live') return false;
                } else if (matchSelectedFilter === 'upcoming') {
                    const isUpcoming = m.status === 'scheduled' || m.isDraft || statusInfo.id === 'upcoming' || statusInfo.id === 'readyToToss' || statusInfo.id === 'readyToStart';
                    if (!isUpcoming) return false;
                } else if (matchSelectedFilter === 'completed') {
                    if (m.status !== 'completed') return false;
                } else if (matchSelectedFilter === 'tournament') {
                    if (!m.tournamentId || m.tournamentId === 't_quick_matches') return false;
                } else if (matchSelectedFilter === 'quick') {
                    if (m.tournamentId && m.tournamentId !== 't_quick_matches') return false;
                } else if (matchSelectedFilter === 'abandoned') {
                    if (!m.wasAbandoned) return false;
                }
            }
            
            // Text Search filter
            if (matchSearchQuery) {
                const query = matchSearchQuery.toLowerCase().trim();
                const opponentId = m.team1Id === team.id ? m.team2Id : m.team1Id;
                const opponent = teams.find(t => t.id === opponentId);
                const opponentName = opponent ? opponent.name.toLowerCase() : '';
                
                const tournament = tournaments.find(t => t.id === m.tournamentId);
                const tournamentName = tournament ? tournament.name.toLowerCase() : '';
                
                const statusInfo = getMatchStatusInfo(m);
                const statusText = statusInfo.label.toLowerCase();
                
                const matchesOpponent = opponentName.includes(query);
                const matchesTournament = tournamentName.includes(query);
                const matchesStatus = statusText.includes(query);
                
                if (!matchesOpponent && !matchesTournament && !matchesStatus) {
                    return false;
                }
            }
            
            return true;
        });

        // Copy array to do the sorting safely without mutation
        const result = [...filtered];

        // Retrieve raw timestamp
        const getMatchTimestamp = (m: Match) => {
            let ts = 0;
            if (m.createdAt) ts = Date.parse(m.createdAt);
            else if (m.date) ts = Date.parse(m.date);
            return isNaN(ts) ? 0 : ts;
        };

        if (matchSortOrder === 'recent') {
            result.sort((a, b) => getMatchTimestamp(b) - getMatchTimestamp(a));
        } else if (matchSortOrder === 'oldest') {
            result.sort((a, b) => getMatchTimestamp(a) - getMatchTimestamp(b));
        } else if (matchSortOrder === 'status') {
            const getStatusWeight = (m: Match) => {
                if (m.status === 'live') return 1;
                const statusInfo = getMatchStatusInfo(m);
                if (statusInfo.id === 'readyToToss' || statusInfo.id === 'readyToStart') return 2;
                if (statusInfo.id === 'upcoming') return 3;
                if (m.status === 'completed') return 4;
                return 5; // draft / abandoned
            };
            result.sort((a, b) => {
                const wA = getStatusWeight(a);
                const wB = getStatusWeight(b);
                if (wA !== wB) return wA - wB;
                return getMatchTimestamp(b) - getMatchTimestamp(a);
            });
        }

        return result;
    }, [matches, team.id, teams, tournaments, matchSelectedFilter, matchSearchQuery, matchSortOrder]);

    // Paginated subset of sorted matches
    const paginatedMatches = useMemo(() => {
        return sortedMatches.slice(0, visibleMatchCount);
    }, [sortedMatches, visibleMatchCount]);

    // Derived counts for Team Settings view
    const completedMatchesCount = useMemo(() => {
        if (!teamId) return 0;
        return matches.filter(m => 
            (m.status === 'completed' || m.status === 'live') && 
            (m.team1Id === teamId || m.team2Id === teamId)
        ).length;
    }, [matches, teamId]);

    const tournamentCount = useMemo(() => {
        return participatedTournaments.length;
    }, [participatedTournaments]);

    const teamPlayersCount = useMemo(() => {
        return team?.players?.length || 0;
    }, [team]);

    // Derived statistical data for Team Stats tab (Phase 8)
    const teamMatches = useMemo(() => {
        if (!teamId) return [];
        return matches.filter(m => m.team1Id === teamId || m.team2Id === teamId);
    }, [matches, teamId]);

    const teamOverviewStats = useMemo(() => {
        let matchesPlayed = 0;
        let matchesWon = 0;
        let matchesLost = 0;
        let matchesTied = 0;
        let noResultCount = 0;

        teamMatches.forEach(m => {
            if (m.wasAbandoned) {
                noResultCount++;
                matchesPlayed++;
            } else if (m.status === 'live') {
                matchesPlayed++;
            } else if (m.status === 'completed') {
                matchesPlayed++;
                if (m.winnerId === teamId) {
                    matchesWon++;
                } else if (m.winnerId === 'draw' || m.winnerId === 'tie') {
                    matchesTied++;
                } else if (m.winnerId && m.winnerId !== 'draw' && m.winnerId !== 'tie') {
                    matchesLost++;
                } else {
                    noResultCount++;
                }
            }
        });

        const decisiveMatches = matchesWon + matchesLost;
        const winPercentage = decisiveMatches > 0 ? Math.round((matchesWon / decisiveMatches) * 100) : 0;

        return {
            matchesPlayed,
            matchesWon,
            matchesLost,
            matchesTied,
            noResultCount,
            winPercentage,
            hasDecisive: decisiveMatches > 0
        };
    }, [teamMatches, teamId]);

    const teamBattingStats = useMemo(() => {
        const battingInningsList: { score: number; wickets: number; overs: number }[] = [];
        let count100Plus = 0;
        let count150Plus = 0;
        let count200Plus = 0;
        let totalRuns = 0;

        teamMatches.forEach(m => {
            if (m.status === 'live' || m.status === 'completed') {
                if (m.innings1 && m.innings1.battingTeamId === teamId && typeof m.innings1.score === 'number' && !m.wasAbandoned) {
                    const score = m.innings1.score;
                    const wickets = typeof m.innings1.wickets === 'number' ? m.innings1.wickets : 0;
                    const overs = typeof m.innings1.overs === 'number' ? m.innings1.overs : 0;
                    battingInningsList.push({ score, wickets, overs });
                    totalRuns += score;
                    if (score >= 200) count200Plus++;
                    if (score >= 150) count150Plus++;
                    if (score >= 100) count100Plus++;
                }
                if (m.innings2 && m.innings2.battingTeamId === teamId && typeof m.innings2.score === 'number' && !m.wasAbandoned) {
                    const score = m.innings2.score;
                    const wickets = typeof m.innings2.wickets === 'number' ? m.innings2.wickets : 0;
                    const overs = typeof m.innings2.overs === 'number' ? m.innings2.overs : 0;
                    battingInningsList.push({ score, wickets, overs });
                    totalRuns += score;
                    if (score >= 200) count200Plus++;
                    if (score >= 150) count150Plus++;
                    if (score >= 100) count100Plus++;
                }
            }
        });

        const averageScoreValue = battingInningsList.length > 0 
            ? Math.round(totalRuns / battingInningsList.length) 
            : 0;

        const sortedBattingList = [...battingInningsList].sort((a, b) => b.score - a.score);
        const highestScoreObj = sortedBattingList[0];
        const lowestScoreObj = sortedBattingList[sortedBattingList.length - 1];

        return {
            totalRuns,
            highestScore: highestScoreObj ? `${highestScoreObj.score}/${highestScoreObj.wickets}` : '—',
            lowestScore: lowestScoreObj ? `${lowestScoreObj.score}/${lowestScoreObj.wickets}` : '—',
            averageScore: battingInningsList.length > 0 ? averageScoreValue.toString() : '—',
            count100Plus,
            count150Plus,
            count200Plus,
            hasBattingData: battingInningsList.length > 0
        };
    }, [teamMatches, teamId]);

    const teamBowlingStats = useMemo(() => {
        const bowlingInningsList: { score: number; wickets: number; opponentName: string; maxWickets: number }[] = [];
        let totalWicketsTaken = 0;

        teamMatches.forEach(m => {
            const matchPlayers = m.numberOfPlayers ?? 11;
            const maxWicketsAllowed = matchPlayers - 1; // standard wickets for all-out
            if (m.status === 'live' || m.status === 'completed') {
                if (m.innings1 && m.innings1.bowlingTeamId === teamId && typeof m.innings1.score === 'number' && !m.wasAbandoned) {
                    const opponent = teams.find(t => t.id === m.innings1!.battingTeamId);
                    const wickets = typeof m.innings1.wickets === 'number' ? m.innings1.wickets : 0;
                    bowlingInningsList.push({
                        score: m.innings1.score,
                        wickets,
                        opponentName: opponent ? opponent.name : 'Opponent',
                        maxWickets: maxWicketsAllowed
                    });
                    totalWicketsTaken += wickets;
                }
                if (m.innings2 && m.innings2.bowlingTeamId === teamId && typeof m.innings2.score === 'number' && !m.wasAbandoned) {
                    const opponent = teams.find(t => t.id === m.innings2!.battingTeamId);
                    const wickets = typeof m.innings2.wickets === 'number' ? m.innings2.wickets : 0;
                    bowlingInningsList.push({
                        score: m.innings2.score,
                        wickets,
                        opponentName: opponent ? opponent.name : 'Opponent',
                        maxWickets: maxWicketsAllowed
                    });
                    totalWicketsTaken += wickets;
                }
            }
        });

        const sortedBowlingList = [...bowlingInningsList].sort((a, b) => {
            if (b.wickets !== a.wickets) {
                return b.wickets - a.wickets; // descending by wickets
            }
            return a.score - b.score; // ascending by score (runs conceded)
        });

        const bestBowlingMatch = sortedBowlingList[0];
        const averageWickets = bowlingInningsList.length > 0
            ? (totalWicketsTaken / bowlingInningsList.length).toFixed(1)
            : '—';

        const oppositionAllOutCount = bowlingInningsList.filter(x => x.wickets >= x.maxWickets).length;

        return {
            totalWicketsTaken,
            bestBowling: bestBowlingMatch ? `${bestBowlingMatch.wickets}/${bestBowlingMatch.score} vs ${bestBowlingMatch.opponentName}` : '—',
            averageWicketsPerMatch: averageWickets,
            oppositionAllOutCount,
            hasBowlingData: bowlingInningsList.length > 0
        };
    }, [teamMatches, teamId, teams]);

    const teamFormGuide = useMemo(() => {
        const relevantMatches = matches.filter(m => {
            if (m.team1Id !== teamId && m.team2Id !== teamId) return false;
            return m.status === 'completed' || m.wasAbandoned;
        });

        // Sort by date descending (most recent first)
        const sorted = [...relevantMatches].sort((a, b) => {
            const datetimeA = new Date((a.date || '').replace(/-/g, '/') + ' ' + (a.time || '00:00')).getTime();
            const datetimeB = new Date((b.date || '').replace(/-/g, '/') + ' ' + (b.time || '00:00')).getTime();
            return datetimeB - datetimeA;
        });

        const top10 = sorted.slice(0, 10);

        return top10.map(m => {
            if (m.wasAbandoned) {
                return { result: 'NR' as const, date: m.date, info: 'Abandoned / No Result' };
            }
            if (m.winnerId === teamId) {
                const opponentId = m.team1Id === teamId ? m.team2Id : m.team1Id;
                const opponentName = teams.find(t => t.id === opponentId)?.name || 'Opponent';
                return { result: 'W' as const, date: m.date, info: `Won against ${opponentName}` };
            } else if (m.winnerId === 'draw' || m.winnerId === 'tie') {
                return { result: 'T' as const, date: m.date, info: 'Match Tied' };
            } else if (m.winnerId && m.winnerId !== 'draw' && m.winnerId !== 'tie') {
                const opponentId = m.winnerId;
                const opponentName = teams.find(t => t.id === opponentId)?.name || 'Opponent';
                return { result: 'L' as const, date: m.date, info: `Lost to ${opponentName}` };
            }
            return { result: 'NR' as const, date: m.date, info: 'No Result' };
        });
    }, [matches, teamId, teams]);

    // Helper to format match score line or status result nicely
    const renderMatchResult = (match: Match) => {
        if (match.status === 'live') {
            return <span className="text-red-500 font-bold animate-pulse uppercase tracking-wider text-[11px]">Live Scored</span>;
        }
        if (match.status === 'draft') {
            return <span className="text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider text-[11px]">Draft</span>;
        }
        if (match.resultSummary) {
            return <span className="text-brand-blue font-semibold text-xs">{match.resultSummary}</span>;
        }
        return <span className="text-text-secondary text-xs">Match Finished (No summary)</span>;
    };

    // Safe error screen if team doesn't exist
    if (!team) {
        return (
            <div className="fixed inset-0 bg-background z-55 flex flex-col items-center justify-center p-6 text-center select-none">
                <CrickIQCard className="p-8 max-w-sm w-full border border-brand-blue/15 text-center flex flex-col items-center justify-center space-y-4 rounded-3xl bg-primary">
                    <div className="p-3.5 bg-red-500/10 text-red-500 rounded-2xl">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-text-primary">Team Not Found</h3>
                        <p className="text-sm text-text-secondary">
                            The team detail identifier does not exist or has been deleted.
                        </p>
                    </div>
                    <button
                        onClick={onBack}
                        className="w-full h-11 bg-brand-blue text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-button transition-all shadow-md active:scale-98"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Go Back to Teams</span>
                    </button>
                </CrickIQCard>
            </div>
        );
    }

    // Resolve location info string
    const locationString = [team.homeGround, team.city, team.state, team.country]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="fixed inset-0 bg-secondary select-none z-50 flex flex-col w-full h-full safe-pad-t safe-pad-b overflow-hidden">
            {/* Header section (Compact Sports App Layout) */}
            <div className="bg-primary border-b border-brand-blue/10 dark:border-brand-blue/20 shrink-0">
                <div className="container mx-auto px-4 py-4 flex flex-col space-y-3.5">
                    {/* Top Row: Back button */}
                    <div className="flex items-center">
                        <button 
                            onClick={onBack}
                            className="flex items-center gap-1 text-xs font-bold text-text-secondary hover:text-brand-blue cursor-pointer bg-black/5 dark:bg-white/5 active:scale-95 transition-all px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>BACK TO TEAMS</span>
                        </button>
                    </div>

                    {/* Team Visual details Header row */}
                    <div className="flex items-start gap-4">
                        {/* Dynamic Team initials/color emblem */}
                        <div 
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white uppercase tracking-widest shrink-0 shadow-lg border border-white/10"
                            style={{ backgroundColor: team.logoColor || team.logo || '#3B82F6' }}
                        >
                            {team.teamInitials || 'TM'}
                        </div>

                        {/* Title text hierarchy */}
                        <div className="flex-grow min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl md:text-2xl font-sans font-bold text-text-primary tracking-tight leading-none truncate">
                                    {team.name}
                                </h1>
                                {team.shortName && team.shortName !== team.name && (
                                    <span className="text-xs bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                                        {team.shortName}
                                    </span>
                                )}
                            </div>

                            {/* Tags and Metadata strip */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary">
                                <span className="bg-gray-100 dark:bg-white/5 px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider">
                                    {team.teamType || 'Custom'}
                                </span>
                                <span className="bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider">
                                    {team.scope || 'Global'}
                                </span>
                                <span className="font-bold flex items-center gap-1 shrink-0 ml-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {team.players?.length || 0} Players
                                </span>
                            </div>

                            {/* Location (Ground/City) */}
                            {locationString && (
                                <div className="flex items-center gap-1 text-xs text-text-secondary">
                                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                    <span className="truncate max-w-sm md:max-w-xl">{locationString}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Horizontally scrollable professional tab strip */}
                <div className="border-t border-brand-blue/5 dark:border-brand-blue/15 px-4 overflow-x-auto no-scrollbar">
                    <div className="container mx-auto flex items-center gap-5 h-12">
                        {TABS.map(tab => {
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-1 h-full text-xs font-bold shrink-0 border-b-2 transition-all cursor-pointer ${
                                        isSelected 
                                            ? 'border-brand-blue text-brand-blue' 
                                            : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scrollable Main Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-secondary pb-24 md:pb-8">
                <div className="container mx-auto p-4 max-w-4xl space-y-5">
                    {activeTab === 'overview' ? (
                        /* Interactive Premium Read-Only Overview Deck */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* A. Team Identity Info Box */}
                            <CrickIQCard className="p-5 flex flex-col justify-between border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl h-full">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-text-primary tracking-wide uppercase border-b border-brand-blue/5 pb-2 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-brand-blue shrink-0" />
                                        <span>Team Specifications</span>
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium">Official Name:</span>
                                            <span className="text-text-primary font-bold truncate max-w-44">{team.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium">Abbreviation:</span>
                                            <span className="text-text-primary font-bold">{team.shortName || team.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium">Category / Style:</span>
                                            <span className="text-brand-blue font-bold tracking-wider uppercase bg-brand-blue/5 px-2 py-0.5 rounded">
                                                {team.teamType || 'Custom'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium">Access Scope:</span>
                                            <span className="text-text-primary font-bold uppercase">{team.scope || 'Global'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium">Home Venue:</span>
                                            <span className="text-text-primary font-bold text-right truncate max-w-40">{team.homeGround || 'Not Specified'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium">Territory:</span>
                                            <span className="text-text-primary font-bold text-right truncate max-w-40">
                                                {[team.city, team.country].filter(Boolean).join(', ') || 'Global'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CrickIQCard>

                            {/* B. Squad Summary Info Box */}
                            <CrickIQCard className="p-5 flex flex-col justify-between border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl h-full">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-text-primary tracking-wide uppercase border-b border-brand-blue/5 pb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-brand-blue shrink-0" />
                                        <span>Squad Composition</span>
                                    </h3>

                                    <div className="space-y-3.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-text-secondary font-medium">Total Registered Players:</span>
                                            <span className="font-bold bg-brand-blue text-white px-2.5 py-0.5 rounded-full text-xs">
                                                {team.players?.length || 0}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between p-2.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-extrabold uppercase tracking-wide text-brand-blue">Captain</div>
                                                <div className="text-xs font-bold text-text-primary">
                                                    {teamLeadership.captain ? teamLeadership.captain.name : 'Not Assigned'}
                                                </div>
                                            </div>
                                            <Award className="w-5 h-5 text-yellow-500" />
                                        </div>

                                        <div className="flex items-center justify-between p-2.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-extrabold uppercase tracking-wide text-brand-blue">Vice Captain</div>
                                                <div className="text-xs font-bold text-text-primary">
                                                    {teamLeadership.viceCaptain ? teamLeadership.viceCaptain.name : 'Not Assigned'}
                                                </div>
                                            </div>
                                            <Award className="w-5 h-5 text-gray-400" />
                                        </div>

                                        <div className="flex items-center justify-between p-2.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] font-extrabold uppercase tracking-wide text-brand-blue">Wicketkeeper</div>
                                                <div className="text-xs font-bold text-text-primary">
                                                    {teamLeadership.wicketKeeper ? teamLeadership.wicketKeeper.name : 'Not Designated'}
                                                </div>
                                            </div>
                                            <Users className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </CrickIQCard>

                            {/* C. Activity Stats Box */}
                            <CrickIQCard className="p-5 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl md:col-span-2">
                                <h3 className="text-sm font-bold text-text-primary tracking-wide uppercase border-b border-brand-blue/5 pb-2 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-brand-blue shrink-0" />
                                    <span>Career & Matches Activity Ledger</span>
                                </h3>

                                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <div className="text-xl font-extrabold text-brand-blue">{teamStats.matchesPlayed}</div>
                                        <div className="text-[10px] font-bold text-text-secondary uppercase mt-0.5">Matches Played</div>
                                    </div>

                                    <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <div className="text-xl font-extrabold text-brand-blue">{teamStats.quickMatches}</div>
                                        <div className="text-[10px] font-bold text-text-secondary uppercase mt-0.5">Quick Matches</div>
                                    </div>

                                    <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <div className="text-xl font-extrabold text-brand-blue">{teamStats.tournamentMatches}</div>
                                        <div className="text-[10px] font-bold text-text-secondary uppercase mt-0.5">League Matches</div>
                                    </div>

                                    <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                                        <div className="text-xl font-extrabold text-brand-blue">{teamStats.tournamentsParticipated}</div>
                                        <div className="text-[10px] font-bold text-text-secondary uppercase mt-0.5">Tournaments</div>
                                    </div>
                                </div>
                            </CrickIQCard>

                            {/* D. Recent Matches Box */}
                            <CrickIQCard className="p-5 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl md:col-span-2 space-y-4">
                                <h3 className="text-sm font-bold text-text-primary tracking-wide uppercase border-b border-brand-blue/5 pb-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-brand-blue shrink-0" />
                                    <span>Recent History Ledger (Last 3 Matches)</span>
                                </h3>

                                {teamStats.recentMatches.length > 0 ? (
                                    <div className="space-y-3">
                                        {teamStats.recentMatches.map(match => {
                                            // Identify opponent ID
                                            const opponentId = match.team1Id === teamId ? match.team2Id : match.team1Id;
                                            const opponentRaw = teams.find(t => t.id === opponentId);
                                            const opponent = opponentRaw ? normalizeTeam(opponentRaw) : null;
                                            
                                            return (
                                                <div 
                                                    key={match.id}
                                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 gap-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Color chip representing opponent logo */}
                                                        <div 
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0"
                                                            style={{ backgroundColor: opponent?.logoColor || opponent?.logo || '#A1A1AA' }}
                                                        >
                                                            {opponent?.teamInitials || 'OP'}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="text-xs font-bold text-text-primary">
                                                                vs {opponent?.name || 'Unknown Opponent'}
                                                            </div>
                                                            <div className="text-[10px] text-text-secondary flex items-center gap-1">
                                                                <Calendar className="w-3 h-3 shrink-0 text-gray-400" />
                                                                {match.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'Unknown Date'}
                                                                {match.tournamentId && <span className="text-brand-blue ml-1 font-bold">● League</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right sm:text-right">
                                                        {renderMatchResult(match)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-xs text-text-secondary flex flex-col items-center justify-center gap-2">
                                        <AlertTriangle className="w-6 h-6 text-gray-400 shrink-0" />
                                        <span>No logged matches found in history for this team yet.</span>
                                    </div>
                                )}
                            </CrickIQCard>
                        </div>
                    ) : activeTab === 'players' ? (
                        /* Read-Only Players Tab */
                        <div className="space-y-4">
                            {/* Roster & Leadership Compact Header Card */}
                            <CrickIQCard className="p-4 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary">Roster Overview</div>
                                        <div className="text-2xl font-extrabold text-brand-blue mt-0.5">
                                            {team.players?.length || 0} <span className="text-sm font-semibold text-text-secondary">Players</span>
                                        </div>
                                    </div>
                                    <div className="h-px w-full sm:h-8 sm:w-px bg-brand-blue/10 shrink-0" />
                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-yellow-500/10 text-yellow-600 font-extrabold text-center flex items-center justify-center text-xs border border-yellow-500/15 shrink-0">C</div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] text-text-secondary uppercase font-bold leading-none">Captain</div>
                                                <div className="text-xs font-bold text-text-primary truncate">{teamLeadership.captain ? teamLeadership.captain.name : 'Not set'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-slate-500/10 text-slate-500 font-extrabold text-center flex items-center justify-center text-xs border border-slate-500/15 shrink-0">VC</div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] text-text-secondary uppercase font-bold leading-none">Vice Captain</div>
                                                <div className="text-xs font-bold text-text-primary truncate">{teamLeadership.viceCaptain ? teamLeadership.viceCaptain.name : 'Not set'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-green-500/10 text-green-600 font-extrabold text-center flex items-center justify-center text-xs border border-green-500/15 shrink-0">WK</div>
                                            <div className="min-w-0">
                                                <div className="text-[10px] text-text-secondary uppercase font-bold leading-none">Wicketkeeper</div>
                                                <div className="text-xs font-bold text-text-primary truncate">{teamLeadership.wicketKeeper ? teamLeadership.wicketKeeper.name : 'Not set'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CrickIQCard>

                            {/* Search & Role Filters Bar */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                                    <input 
                                        type="text"
                                        placeholder="Search players by name, role, or jersey..."
                                        value={playerSearchQuery}
                                        onChange={(e) => setPlayerSearchQuery(e.target.value)}
                                        className="w-full h-11 pl-10 pr-16 bg-primary text-text-primary border border-brand-blue/15 rounded-2xl text-sm focus:outline-none focus:border-brand-blue transition-all"
                                    />
                                    {playerSearchQuery && (
                                        <button 
                                            onClick={() => setPlayerSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-text-secondary hover:text-brand-blue uppercase tracking-wider cursor-pointer h-7 px-2.5 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {[
                                        { id: 'all', label: 'All Players' },
                                        { id: 'batsman', label: 'Batters' },
                                        { id: 'bowler', label: 'Bowlers' },
                                        { id: 'all_rounder', label: 'All-Rounders' },
                                        { id: 'wicket_keeper', label: 'Wicketkeepers' }
                                    ].map(chip => {
                                        const isSelected = selectedRoleFilter === chip.id;
                                        return (
                                            <button
                                                key={chip.id}
                                                onClick={() => setSelectedRoleFilter(chip.id)}
                                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap border cursor-pointer transition-all ${
                                                    isSelected 
                                                        ? 'bg-brand-blue text-white border-brand-blue shadow-md' 
                                                        : 'bg-primary text-text-secondary border-brand-blue/10 hover:border-brand-blue/20'
                                                }`}
                                            >
                                                {chip.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Players List rendering */}
                            {!team.players || team.players.length === 0 ? (
                                <CrickIQCard className="p-8 text-center border border-brand-blue/10 dark:border-brand-blue/20 flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto rounded-3xl bg-primary mt-6">
                                    <div className="w-16 h-16 rounded-full bg-brand-blue/5 text-brand-blue flex items-center justify-center">
                                        <Users className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-sm font-bold text-text-primary">No Players Added</h3>
                                        <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                                            This team has no saved roster yet. Player management will be available in the next phase.
                                        </p>
                                    </div>
                                    <button
                                        disabled
                                        className="px-5 py-2.5 text-xs font-bold text-white bg-gray-400 dark:bg-zinc-700 cursor-not-allowed rounded-2xl shadow-sm tracking-wide uppercase"
                                    >
                                        Add Player Coming Soon
                                    </button>
                                </CrickIQCard>
                            ) : filteredPlayers.length === 0 ? (
                                <div className="text-center py-10 bg-primary rounded-3xl border border-brand-blue/10 dark:border-brand-blue/20 p-6 flex flex-col items-center justify-center gap-2">
                                    <AlertTriangle className="w-6 h-6 text-gray-400 shrink-0" />
                                    <span className="text-sm font-bold text-text-primary">No Matching Players</span>
                                    <span className="text-xs text-text-secondary max-w-xs leading-relaxed text-center">No roster players match your search for &ldquo;{playerSearchQuery}&rdquo;.</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2.5">
                                    {filteredPlayers.map(player => {
                                        const extendedPlayer = player as ExtendedPlayer;
                                        const isCaptain = player.id === team.captainId;
                                        const isViceCaptain = player.id === team.viceCaptainId;
                                        
                                        const isWK = extendedPlayer.isWicketKeeper || extendedPlayer.isWicketkeeper || (player.role || '').toLowerCase().includes('keeper') || (player.role || '').toLowerCase().includes('wk') || (player.role || '').toLowerCase().includes('wicket');

                                        const battingStyle = extendedPlayer.battingStyle;
                                        const bowlingStyle = extendedPlayer.bowlingStyle;

                                        const initials = (player.name || '')
                                            .split(' ')
                                            .map(word => word[0])
                                            .slice(0, 2)
                                            .join('')
                                            .toUpperCase();

                                        return (
                                            <div
                                                key={player.id}
                                                onClick={() => handlePlayerClick(player)}
                                                className="flex items-center justify-between p-3.5 bg-primary hover:bg-black/5 dark:hover:bg-white/5 active:scale-99 rounded-2xl border border-brand-blue/10 dark:border-brand-blue/20 transition-all cursor-pointer shadow-sm group"
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="w-11 h-11 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center text-sm font-bold tracking-wider shrink-0 border border-brand-blue/10">
                                                        {initials || 'PL'}
                                                    </div>

                                                    <div className="space-y-0.5 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-sm font-bold text-text-primary truncate max-w-[150px] sm:max-w-xs">{player.name}</span>
                                                            {isCaptain && (
                                                                <span className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-yellow-500/15 leading-none">C</span>
                                                            )}
                                                            {isViceCaptain && (
                                                                <span className="bg-slate-500/10 text-slate-500 dark:text-slate-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-slate-500/15 leading-none">VC</span>
                                                            )}
                                                            {isWK && (
                                                                <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border border-green-500/15 leading-none">WK</span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary font-medium">
                                                            <span className="bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-brand-blue">{player.role}</span>
                                                            {player.number !== undefined && player.number > 0 && (
                                                                <span className="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">#{player.number}</span>
                                                            )}
                                                            {battingStyle && (
                                                                <span className="text-[11px] leading-none text-text-secondary border-l border-brand-blue/15 pl-1.5">{battingStyle}</span>
                                                            )}
                                                            {bowlingStyle && (
                                                                <span className="text-[11px] leading-none text-text-secondary border-l border-brand-blue/15 pl-1.5">{bowlingStyle}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-brand-blue transition-all shrink-0 ml-2" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'matches' ? (
                        /* Read-Only Matches Tab */
                        <div className="space-y-4">
                            {/* Total Match Count & Sort Badge */}
                            <CrickIQCard className="p-4 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary">Matches Analysis</div>
                                        <div className="text-2xl font-extrabold text-brand-blue mt-0.5">
                                            {sortedMatches.length} <span className="text-sm font-semibold text-text-secondary">Match{sortedMatches.length !== 1 ? 'es' : ''} Found</span>
                                        </div>
                                    </div>
                                    <div className="h-px w-full sm:h-8 sm:w-px bg-brand-blue/10 shrink-0" />
                                    <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                                        <div className="flex flex-col gap-1 min-w-[140px]">
                                            <label htmlFor="team-match-sort-select" className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                                                Sort Matches
                                            </label>
                                            <select
                                                id="team-match-sort-select"
                                                value={matchSortOrder}
                                                onChange={(e) => {
                                                    setMatchSortOrder(e.target.value as 'recent' | 'oldest' | 'status');
                                                    setVisibleMatchCount(25); // reset page count
                                                }}
                                                className="py-1.5 px-3 bg-primary text-text-primary border border-brand-blue/15 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                                            >
                                                <option value="recent">Most Recent First</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="status">Group by Status</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </CrickIQCard>

                            {/* Search & Status Filters Bar */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                                    <input 
                                        type="text"
                                        placeholder="Search matches by opponent, tournament, status..."
                                        value={matchSearchQuery}
                                        onChange={(e) => {
                                            setMatchSearchQuery(e.target.value);
                                            setVisibleMatchCount(25); // reset page count
                                        }}
                                        className="w-full h-11 pl-10 pr-16 bg-primary text-text-primary border border-brand-blue/15 rounded-2xl text-sm focus:outline-none focus:border-brand-blue transition-all"
                                    />
                                    {matchSearchQuery && (
                                        <button 
                                            onClick={() => {
                                                setMatchSearchQuery('');
                                                setVisibleMatchCount(25);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-text-secondary hover:text-brand-blue uppercase tracking-wider cursor-pointer h-7 px-2.5 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {/* Filter Chips */}
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {[
                                        { id: 'all', label: 'All Matches' },
                                        { id: 'live', label: 'Live' },
                                        { id: 'upcoming', label: 'Upcoming' },
                                        { id: 'completed', label: 'Completed' },
                                        { id: 'tournament', label: 'Tournament' },
                                        { id: 'quick', label: 'Quick Matches' },
                                        { id: 'abandoned', label: 'Abandoned' }
                                    ].map(chip => {
                                        const isSelected = matchSelectedFilter === chip.id;
                                        return (
                                            <button
                                                key={chip.id}
                                                onClick={() => {
                                                    setMatchSelectedFilter(chip.id);
                                                    setVisibleMatchCount(25); // reset page
                                                }}
                                                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap border cursor-pointer transition-all ${
                                                    isSelected 
                                                        ? 'bg-brand-blue text-white border-brand-blue shadow-md' 
                                                        : 'bg-primary text-text-secondary border-brand-blue/10 hover:border-brand-blue/20'
                                                }`}
                                            >
                                                {chip.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Matches List Rendering */}
                            {sortedMatches.length === 0 ? (
                                <CrickIQCard className="p-8 text-center border border-brand-blue/10 dark:border-brand-blue/20 flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto rounded-3xl bg-primary mt-6">
                                    <div className="w-16 h-16 rounded-full bg-brand-blue/5 text-brand-blue flex items-center justify-center">
                                        <Activity className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-sm font-bold text-text-primary">No Matches Found</h3>
                                        <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                                            {matchSearchQuery || matchSelectedFilter !== 'all' 
                                                ? "Try adjusting your search query or filters to find standard matches." 
                                                : "Matches involving this team will appear here after quick matches or tournament fixtures are created."}
                                        </p>
                                    </div>
                                    {matchSearchQuery || matchSelectedFilter !== 'all' ? (
                                        <button
                                            onClick={() => {
                                                setMatchSearchQuery('');
                                                setMatchSelectedFilter('all');
                                                setVisibleMatchCount(25);
                                            }}
                                            className="px-5 py-2.5 text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-2xl shadow-sm tracking-wide uppercase transition-all"
                                        >
                                            Reset Filters
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="px-5 py-2.5 text-xs font-bold text-white bg-gray-400 dark:bg-zinc-700 cursor-not-allowed rounded-2xl shadow-sm tracking-wide uppercase"
                                        >
                                            Create Match Coming Later
                                        </button>
                                    )}
                                </CrickIQCard>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3">
                                        {paginatedMatches.map(match => {
                                            const opponentId = match.team1Id === team.id ? match.team2Id : match.team1Id;
                                            const opponent = teams.find(t => t.id === opponentId);
                                            const opponentName = opponent ? opponent.name : 'Unknown Opponent';
                                            const opponentInitials = opponent ? (opponent.teamInitials || opponent.name.substring(0, 2).toUpperCase()) : 'OP';
                                            const opponentColor = opponent ? (opponent.logoColor || opponent.logo || '#A1A1AA') : '#A1A1AA';
                                            
                                            const tournament = tournaments.find(t => t.id === match.tournamentId);
                                            const statusInfo = getMatchStatusInfo(match);
                                            
                                            // Handle Tap to Open Match Hub if supported
                                            const hasTapAction = !!onOpenMatchHub && match.status !== 'draft';
                                            
                                            // Scores extracted dynamically
                                            const myInnings = team.id === match.innings1?.battingTeamId ? match.innings1 : (team.id === match.innings2?.battingTeamId ? match.innings2 : null);
                                            const opInnings = opponentId === match.innings1?.battingTeamId ? match.innings1 : (opponentId === match.innings2?.battingTeamId ? match.innings2 : null);
                                            
                                            const hasScores = match.status !== 'scheduled' && !match.isDraft;
                                            
                                            const winnerTeam = teams.find(t => t.id === match.winnerId);
                                            const resultText = match.resultSummary || (match.status === 'completed' ? (match.winnerId === 'draw' ? 'Match Drawn / Tied' : (winnerTeam ? `${winnerTeam.name} won` : 'Match Finished')) : '');

                                            return (
                                                <div
                                                    key={match.id}
                                                    onClick={() => {
                                                        if (hasTapAction && onOpenMatchHub) {
                                                            onOpenMatchHub(match.id, {
                                                                source: 'team_details',
                                                                teamId: teamId,
                                                                teamDetailsTab: 'matches',
                                                                matchSearchQuery,
                                                                matchSelectedFilter,
                                                                matchSortOrder,
                                                                visibleMatchCount
                                                            });
                                                        }
                                                    }}
                                                    className={`p-4 bg-primary rounded-2xl border border-brand-blue/10 dark:border-brand-blue/20 transition-all ${
                                                        hasTapAction 
                                                            ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer hover:border-brand-blue/30 active:scale-99' 
                                                            : 'opacity-95'
                                                    }`}
                                                >
                                                    {/* Top row: Match Type label & Status badge */}
                                                    <div className="flex items-center justify-between gap-2 border-b border-brand-blue/5 dark:border-brand-blue/10 pb-2.5 mb-3">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="text-[10px] font-extrabold uppercase bg-brand-blue/5 text-brand-blue dark:bg-brand-blue/10 px-2 py-0.5 rounded leading-none">
                                                                {tournament ? 'League Match' : 'Quick Match'}
                                                            </span>
                                                            {tournament && (
                                                                <span className="text-xs font-bold text-text-secondary truncate max-w-[120px] sm:max-w-[200px]">
                                                                    {tournament.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${statusInfo.colorClass}`}>
                                                            {statusInfo.label}
                                                        </span>
                                                    </div>

                                                    {/* Middle row: Team vs Opponent name & score comparison */}
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="space-y-2.5 flex-1 min-w-0">
                                                            {/* Our Team Score Row */}
                                                            <div className="flex items-center justify-between gap-2.5">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div 
                                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white uppercase shrink-0 border border-white/10"
                                                                        style={{ backgroundColor: team.logoColor || team.logo || '#3B82F6' }}
                                                                    >
                                                                        {team.teamInitials || 'TM'}
                                                                    </div>
                                                                    <span className="text-sm font-extrabold text-brand-blue truncate">
                                                                        {team.name}
                                                                        <span className="text-[10px] font-bold text-text-secondary ml-1 bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded">Home</span>
                                                                    </span>
                                                                </div>
                                                                {hasScores && myInnings ? (
                                                                    <div className="font-mono text-sm font-bold text-text-primary text-right whitespace-nowrap">
                                                                        {myInnings.score}/{myInnings.wickets} <span className="text-[10px] text-text-secondary font-medium">({myInnings.oversBowled ?? 0})</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">DNB</span>
                                                                )}
                                                            </div>

                                                            {/* Opponent Team Score Row */}
                                                            <div className="flex items-center justify-between gap-2.5">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div 
                                                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white uppercase shrink-0 border border-white/10"
                                                                        style={{ backgroundColor: opponentColor }}
                                                                    >
                                                                        {opponentInitials}
                                                                    </div>
                                                                    <span className="text-sm font-extrabold text-text-primary truncate">
                                                                        {opponentName}
                                                                    </span>
                                                                </div>
                                                                {hasScores && opInnings ? (
                                                                    <div className="font-mono text-sm font-bold text-text-primary text-right whitespace-nowrap">
                                                                        {opInnings.score}/{opInnings.wickets} <span className="text-[10px] text-text-secondary font-medium">({opInnings.oversBowled ?? 0})</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">DNB</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Right Navigation Arrow if safe to open */}
                                                        {hasTapAction && (
                                                            <div className="w-8 h-8 rounded-full bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 border border-brand-blue/10">
                                                                <ChevronRight className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Bottom Row / Date / Summary Ribbon */}
                                                    <div className="mt-3 pt-2.5 border-t border-brand-blue/5 dark:border-brand-blue/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                        <div className="text-[10px] font-semibold text-text-secondary flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                                            <span>
                                                                {new Date(match.date).toLocaleDateString()} {match.time ? `• ${match.time}` : ''}
                                                            </span>
                                                            <span className="mx-1 text-gray-400">•</span>
                                                            <span>
                                                                {match.oversPerInnings} Overs
                                                            </span>
                                                        </div>
                                                        {resultText && (
                                                            <div className="text-xs font-bold text-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 px-2.5 py-1 rounded-xl border border-brand-blue/10">
                                                                {resultText}
                                                            </div>
                                                        )}
                                                        {match.status === 'draft' && (
                                                            <div className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15">
                                                                Match details from Team Hub will be connected later.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Show More Pagination Button */}
                                    {sortedMatches.length > visibleMatchCount && (
                                        <div className="flex justify-center pt-2">
                                            <button
                                                onClick={() => setVisibleMatchCount(prev => prev + 25)}
                                                className="px-5 py-2 text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-2xl shadow-sm transition-all active:scale-95 uppercase tracking-wide"
                                            >
                                                Show More Matches
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'tournaments' ? (
                        /* Read-Only Tournaments Tab (Phase 6) */
                        <div className="space-y-4">
                            {/* Header Stats */}
                            <CrickIQCard className="p-4 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary">Tournament Participation</div>
                                        <div className="text-2xl font-extrabold text-brand-blue mt-0.5">
                                            {filteredAndSortedTournaments.length} <span className="text-sm font-semibold text-text-secondary">Tournament{filteredAndSortedTournaments.length !== 1 ? 's' : ''} Found</span>
                                        </div>
                                    </div>
                                    <div className="h-px w-full sm:h-8 sm:w-px bg-brand-blue/10 shrink-0" />
                                    <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                                        <div className="flex flex-col gap-1 min-w-[140px]">
                                            <label htmlFor="team-tournament-sort-select" className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                                                Sort Tournaments
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="team-tournament-sort-select"
                                                    value={tournamentSortOrder}
                                                    onChange={(e) => setTournamentSortOrder(e.target.value as 'recent' | 'name' | 'status' | 'matches')}
                                                    className="w-full pl-3 pr-8 py-2 text-xs font-bold text-text-primary bg-secondary border border-brand-blue/10 dark:border-brand-blue/20 rounded-xl focus:outline-none focus:border-brand-blue"
                                                >
                                                    <option value="recent">Most Recent</option>
                                                    <option value="name">Tournament Name</option>
                                                    <option value="status">Status</option>
                                                    <option value="matches">Matches Played</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CrickIQCard>

                            {/* Search & Filter Controls */}
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                    <input
                                        type="text"
                                        placeholder="Search tournaments by name, format, venue, or status..."
                                        value={tournamentSearchQuery}
                                        onChange={(e) => setTournamentSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 text-xs bg-primary border border-brand-blue/10 dark:border-brand-blue/20 rounded-2xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-blue transition-all"
                                    />
                                </div>

                                {/* Scrollable Filter Chips */}
                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 scroll-smooth shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'active', label: 'Active' },
                                        { id: 'upcoming', label: 'Upcoming' },
                                        { id: 'completed', label: 'Completed' },
                                        { id: 'won', label: 'Won' },
                                        { id: 'knockouts', label: 'Finals/Knockouts' }
                                    ].map((badge) => {
                                        const isSelected = tournamentSelectedFilter === badge.id;
                                        return (
                                            <button
                                                key={badge.id}
                                                onClick={() => setTournamentSelectedFilter(badge.id)}
                                                className={`px-4.5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm shrink-0 border cursor-pointer border-brand-blue/10 ${
                                                    isSelected
                                                        ? 'bg-brand-blue text-white font-extrabold border-brand-blue'
                                                        : 'bg-primary text-text-secondary hover:text-text-primary hover:bg-secondary'
                                                }`}
                                            >
                                                {badge.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tournament Cards List */}
                            {filteredAndSortedTournaments.length === 0 ? (
                                <CrickIQCard className="p-8 text-center border border-brand-blue/10 dark:border-brand-blue/20 flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto rounded-3xl bg-primary mt-4">
                                    <div className="w-16 h-16 rounded-full bg-brand-blue/5 text-brand-blue flex items-center justify-center">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-lg font-bold text-text-primary">
                                            No Tournaments Yet
                                        </h3>
                                        <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                                            Tournaments involving this team will appear here once the team is added to a tournament.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setTournamentSearchQuery('');
                                            setTournamentSelectedFilter('all');
                                        }}
                                        className="px-4.5 py-2.5 text-xs font-bold text-brand-blue hover:text-white hover:bg-brand-blue border border-brand-blue/20 rounded-2xl shadow-sm transition-all active:scale-95 uppercase tracking-wide cursor-pointer"
                                    >
                                        Reset Filters
                                    </button>
                                </CrickIQCard>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3">
                                        {paginatedTournaments.map((item) => {
                                            const { tournament: t, playedCount, totalCount, winsCount, lossesCount, drawnCount, resultText, status } = item;
                                            
                                            // Format start Date nicely
                                            const formattedDate = t.startDate 
                                                ? new Date(t.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                : 'No start date';

                                            const hasTapAction = !!onViewTournament;

                                            return (
                                                <div
                                                    key={t.id}
                                                    onClick={() => {
                                                        if (hasTapAction && onViewTournament) {
                                                            onViewTournament(t.id, {
                                                                source: 'team_details',
                                                                teamId: teamId,
                                                                teamDetailsTab: 'tournaments',
                                                                tournamentSearchQuery,
                                                                tournamentSelectedFilter,
                                                                tournamentSortOrder,
                                                                visibleTournamentCount
                                                            });
                                                        }
                                                    }}
                                                    className={`p-5 bg-primary rounded-3xl border border-brand-blue/10 dark:border-brand-blue/20 transition-all ${
                                                        hasTapAction 
                                                            ? 'hover:shadow-md hover:border-brand-blue/30 cursor-pointer active:scale-[0.99] group' 
                                                            : ''
                                                    }`}
                                                >
                                                    {/* Top Bar with format and status pill */}
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-blue/5 pb-3">
                                                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-blue px-2.5 py-1 bg-brand-blue/5 rounded-xl border border-brand-blue/10">
                                                            {t.format || 'Custom Format'}
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            {/* Status badge */}
                                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-xl border ${
                                                                status === 'completed'
                                                                    ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/15'
                                                                    : status === 'active'
                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                                                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15'
                                                            }`}>
                                                                {status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Tournament Title & Info */}
                                                    <div className="flex items-start justify-between gap-4 mt-3">
                                                        <div className="space-y-1.5 flex-1 min-w-0">
                                                            <h4 className="text-base font-bold text-text-primary truncate group-hover:text-brand-blue transition-colors">
                                                                {t.name}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                                                                {t.location && (
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin className="w-3 h-3 text-brand-blue" />
                                                                        <span className="truncate max-w-[150px]">{t.location}</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3 text-text-secondary" />
                                                                    <span>{formattedDate}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {hasTapAction && (
                                                            <ChevronRight className="w-5 h-5 text-text-secondary group-hover:translate-x-0.5 group-hover:text-brand-blue transition-all shrink-0 self-center" />
                                                        )}
                                                    </div>

                                                    {/* Derived Metrics Stats Section */}
                                                    <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-secondary/50 rounded-2xl border border-brand-blue/5">
                                                        <div className="text-center">
                                                            <div className="text-[10px] font-extrabold text-text-secondary uppercase">Played</div>
                                                            <div className="text-base font-bold text-text-primary mt-0.5">{playedCount} / {totalCount}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">Won</div>
                                                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{winsCount}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[10px] font-extrabold text-rose-500 uppercase">Lost</div>
                                                            <div className="text-base font-bold text-rose-500 mt-0.5">{lossesCount}</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-[10px] font-extrabold text-text-secondary uppercase">Tied/N.R</div>
                                                            <div className="text-base font-bold text-text-secondary mt-0.5">{drawnCount}</div>
                                                        </div>
                                                    </div>

                                                    {/* Team position and result */}
                                                    <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-brand-blue/5">
                                                        <div className="flex items-center gap-1.5 font-sans">
                                                            <span className="text-xs font-bold text-text-primary font-sans">Result:</span>
                                                            <span className={`text-xs font-extrabold ${
                                                                resultText.includes('🏆') 
                                                                    ? 'text-amber-600 bg-amber-500/10' 
                                                                    : resultText.includes('🥈') 
                                                                    ? 'text-zinc-600 bg-zinc-500/10'
                                                                    : resultText.includes('🥉')
                                                                    ? 'text-amber-800 bg-amber-800/10'
                                                                    : 'text-brand-blue bg-brand-blue/5'
                                                            } px-2.5 py-0.5 rounded-xl border border-brand-blue/10`}>
                                                                {resultText}
                                                            </span>
                                                        </div>
                                                        
                                                        {!hasTapAction && (
                                                            <span className="text-[10px] font-semibold text-text-secondary font-mono">
                                                                Tournament details from Team Hub will be connected later.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    {filteredAndSortedTournaments.length > visibleTournamentCount && (
                                        <div className="flex justify-center pt-2">
                                            <button
                                                onClick={() => setVisibleTournamentCount(prev => prev + 20)}
                                                className="px-5 py-2.5 text-xs font-extrabold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-2xl shadow-sm transition-all active:scale-95 uppercase tracking-wider cursor-pointer font-sans"
                                            >
                                                Show More Tournaments
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'settings' ? (
                        /* Read-Only Settings Tab (Phase 7) */
                        <div className="space-y-6">
                            {/* Header Stats */}
                            <CrickIQCard id="settings-heading-card" className="p-4 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary font-mono">Administrative Controls</div>
                                        <h4 className="text-xl font-extrabold text-brand-blue mt-0.5 font-sans">Team Settings Hub</h4>
                                        <p className="text-xs text-text-secondary mt-1 max-w-md leading-relaxed">
                                            Manage your team profile, archive status, safety guarantees, and duplicate squads tools in one secure diagnostic control center.
                                        </p>
                                    </div>
                                </div>
                            </CrickIQCard>

                            {/* State Notice Notification Banner */}
                            <div id="settings-notice-container" className="scroll-mt-4">
                                {settingsNotice && (
                                    <div className={`p-4 rounded-3xl flex items-start gap-3 border shadow-sm transition-all duration-300 ${
                                        settingsNoticeType === 'success'
                                            ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/20'
                                            : settingsNoticeType === 'warning'
                                            ? 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/20'
                                            : 'bg-brand-blue/5 text-text-primary border-brand-blue/10 dark:bg-brand-blue/10 dark:text-white'
                                    }`}>
                                        <div className="shrink-0 mt-0.5">
                                            {settingsNoticeType === 'success' ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            ) : settingsNoticeType === 'warning' ? (
                                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            ) : (
                                                <Info className="w-5 h-5 text-brand-blue" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-xs font-semibold leading-relaxed">
                                            {settingsNotice}
                                        </div>
                                        <button 
                                            onClick={() => setSettingsNotice(null)}
                                            className="text-text-secondary hover:text-text-primary text-xs font-bold leading-none p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Side: Profile & Status */}
                                <div className="space-y-6">
                                    {/* Team Profile Section */}
                                    <CrickIQCard id="settings-profile-section" className="p-6 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 border-b border-brand-blue/5 pb-3">
                                            <Users className="w-5 h-5 text-brand-blue" />
                                            <div>
                                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary">Team Profile Details</h3>
                                                <p className="text-[11px] text-text-secondary">Core metadata and location registration parameters</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">Team Name</div>
                                                <div className="text-xs font-bold text-text-primary break-words">{team?.name || 'Unnamed Team'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">Short Name / Initials</div>
                                                <div className="text-xs font-bold text-text-primary break-words">{team?.shortName || team?.teamInitials || team?.name || 'Not set'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">Team Type</div>
                                                <div className="text-xs font-bold text-text-primary uppercase tracking-wide">{team?.teamType || 'custom'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">Scope</div>
                                                <div className="text-xs font-bold text-text-primary uppercase tracking-wide">{team?.scope || 'global'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">Home Ground</div>
                                                <div className="text-xs font-bold text-text-primary break-words">{team?.homeGround || 'Not set'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">City</div>
                                                <div className="text-xs font-bold text-text-primary break-words">{team?.city || 'Not set'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">State / Province</div>
                                                <div className="text-xs font-bold text-text-primary break-words">{team?.state || 'Not set'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">Country</div>
                                                <div className="text-xs font-bold text-text-primary break-words">{team?.country || 'Not set'}</div>
                                            </div>
                                            <div className="space-y-1 col-span-2">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">Logo Colors & Accent</div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-3.5 h-3.5 rounded-full inline-block border border-black/10 dark:border-white/10" style={{ backgroundColor: team?.logoColor || team?.logo || '#1e3a8a' }} />
                                                    <span className="text-[10px] font-mono text-text-secondary">{team?.logoColor || team?.logo || 'Default'}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary font-mono">Created Date</div>
                                                <div className="text-xs font-bold text-text-primary font-mono">
                                                    {team?.createdAt 
                                                        ? new Date(team.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'Unknown'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary font-mono">Last Updated</div>
                                                <div className="text-xs font-bold text-text-primary font-mono">
                                                    {team?.updatedAt 
                                                        ? new Date(team.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'Unknown'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-brand-blue/5">
                                            <button
                                                id="settings-edit-profile-btn"
                                                onClick={() => {
                                                    setSettingsNotice("Edit Team Info will be added in a future phase.");
                                                    setSettingsNoticeType('info');
                                                }}
                                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-brand-blue bg-brand-blue/5 hover:bg-brand-blue/10 border border-brand-blue/10 hover:border-brand-blue/25 transition-all text-center flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer active:scale-95 touch-manipulation"
                                            >
                                                Edit Team Info — Coming Soon
                                            </button>
                                        </div>
                                    </CrickIQCard>

                                    {/* Team Status Section */}
                                    <CrickIQCard id="settings-status-section" className="p-6 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 border-b border-brand-blue/5 pb-3">
                                            <Archive className="w-5 h-5 text-brand-blue" />
                                            <div>
                                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary">Team Archival Status</h3>
                                                <p className="text-[11px] text-text-secondary">Deactivate or restore team visibility in list selectors</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-secondary/50 border border-brand-blue/5 rounded-2xl">
                                            <div>
                                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Current State</div>
                                                <span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-extrabold border ${
                                                    team?.isArchived 
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15'
                                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                                                }`}>
                                                    <span className={`w-2 h-2 rounded-full ${team?.isArchived ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                                    {team?.isArchived ? 'ARCHIVED' : 'ACTIVE'}
                                                </span>
                                            </div>
                                            {team?.isArchived && team?.archivedAt && (
                                                <div className="text-right">
                                                    <div className="text-[9px] font-extrabold uppercase tracking-wider text-text-secondary">Archived At</div>
                                                    <div className="text-xs font-mono font-bold text-text-primary">
                                                        {new Date(team.archivedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            Archiving a team hides it from current selector dropdowns and schedules but preserves all historical matches, career statistics, and points table rankings.
                                        </p>

                                        <div className="pt-2">
                                            <button
                                                id="settings-archive-btn"
                                                onClick={() => {
                                                    const mode = team?.isArchived ? "Restore Team" : "Archive Team";
                                                    setSettingsNotice(`${mode} will be added after safety validation.`);
                                                    setSettingsNoticeType('info');
                                                }}
                                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-text-primary bg-secondary hover:bg-slate-100 dark:hover:bg-slate-800 border border-brand-blue/5 hover:border-brand-blue/15 transition-all text-center flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer active:scale-95 touch-manipulation"
                                            >
                                                {team?.isArchived ? 'Restore Team' : 'Archive Team'} — Coming Soon
                                            </button>
                                        </div>
                                    </CrickIQCard>
                                </div>

                                {/* Right Side: Data Safety, Merge Tools, Danger Zone */}
                                <div className="space-y-6">
                                    {/* Data Safety Section */}
                                    <CrickIQCard id="settings-data-safety-section" className="p-6 border border-emerald-500/10 dark:border-emerald-500/20 bg-primary rounded-3xl shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 border-b border-brand-blue/5 pb-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            <div>
                                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Core Data Safety Guarantees</h3>
                                                <p className="text-[11px] text-text-secondary">Protected relationships & database referential rules</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-text-secondary leading-relaxed bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/10">
                                            <strong>Trust-Building Notice:</strong> Editing a team profile in future will not modify completed scorecards, match history, innings data, or tournament results.
                                        </p>

                                        <div className="space-y-3">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Protected Records Directory</div>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div className="p-2.5 bg-secondary/40 border border-emerald-500/5 rounded-2xl">
                                                    <div className="text-[18px] font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{completedMatchesCount}</div>
                                                    <div className="text-[9px] font-extrabold text-text-secondary uppercase">Matches Secure</div>
                                                </div>
                                                <div className="p-2.5 bg-secondary/40 border border-emerald-500/5 rounded-2xl">
                                                    <div className="text-[18px] font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{tournamentCount}</div>
                                                    <div className="text-[9px] font-extrabold text-text-secondary uppercase">Leagues Linked</div>
                                                </div>
                                                <div className="p-2.5 bg-secondary/40 border border-emerald-500/5 rounded-2xl">
                                                    <div className="text-[18px] font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{teamPlayersCount}</div>
                                                    <div className="text-[9px] font-extrabold text-text-secondary uppercase font-mono">Players Bound</div>
                                                </div>
                                            </div>
                                            <ul className="text-[11px] text-text-secondary space-y-1.5 pl-1">
                                                <li className="flex items-center gap-1.5 text-text-secondary">
                                                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>Completed scorecards remain cryptographically protected</span>
                                                </li>
                                                <li className="flex items-center gap-1.5 text-text-secondary">
                                                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>Player career stats remain linked to their original team profile</span>
                                                </li>
                                                <li className="flex items-center gap-1.5 text-text-secondary">
                                                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>Tournament stand-ins are historic and locked against alteration</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </CrickIQCard>

                                    {/* Duplicate / Merge Tools Section */}
                                    <CrickIQCard id="settings-duplicate-merge-section" className="p-6 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 border-b border-brand-blue/5 pb-3">
                                            <GitMerge className="w-5 h-5 text-brand-blue" />
                                            <div>
                                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary font-sans">Duplicate / Merge Tools</h3>
                                                <p className="text-[11px] text-text-secondary">Clean up double-entries and merge squad ledgers safely</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            Use this later to safely merge duplicate teams like <em>India</em>, <em>India XI</em>, or <em>India Team</em> without losing match history. Players and records will be automatically reconciled.
                                        </p>

                                        <div className="pt-2">
                                            <button
                                                id="settings-merge-btn"
                                                onClick={() => {
                                                    setSettingsNotice("Merge tools will be added after duplicate protection is complete.");
                                                    setSettingsNoticeType('warning');
                                                }}
                                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 transition-all text-center flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer active:scale-95 touch-manipulation font-sans"
                                            >
                                                Merge Duplicate Teams — Coming Soon
                                            </button>
                                        </div>
                                    </CrickIQCard>

                                    {/* Danger Zone Section */}
                                    <CrickIQCard id="settings-danger-zone-section" className="p-6 border border-rose-500/20 bg-rose-500/5 rounded-3xl shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 border-b border-rose-500/10 pb-3">
                                            <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                                            <div>
                                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Danger Zone</h3>
                                                <p className="text-[11px] text-rose-500/70">Irreversible administrative actions and protections</p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            Deleting a team can affect navigation, history, and references. CrickIQ will prefer Archive Team instead of permanent delete.
                                        </p>

                                        <div className="bg-primary/50 dark:bg-black/20 p-3 rounded-2xl border border-rose-500/10 text-[11px] text-text-secondary space-y-2">
                                            <div className="font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Protections Active:</div>
                                            <ul className="space-y-1 pl-1">
                                                <li className="flex items-center gap-2 text-text-secondary">
                                                    <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                    <span>Match history will never be deleted automatically.</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-text-secondary">
                                                    <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                    <span>Players will not be deleted automatically.</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-text-secondary">
                                                    <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                    <span>Tournaments will not be deleted automatically.</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-text-secondary">
                                                    <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                                    <span>Completed scorecards will remain protected.</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                id="settings-delete-btn"
                                                disabled
                                                onClick={() => {
                                                    setSettingsNotice("Permanent delete is disabled for data safety.");
                                                    setSettingsNoticeType('warning');
                                                }}
                                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-center flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-not-allowed opacity-50"
                                            >
                                                Delete Team — Disabled / Coming Later
                                            </button>
                                        </div>
                                    </CrickIQCard>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'stats' ? (
                        /* Team Stats Tab (Phase 8) - Read-Only Live Analytics Engine */
                        teamMatches.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center">
                                <CrickIQCard id="stats-empty-state" className="p-8 text-center border border-brand-blue/10 dark:border-brand-blue/20 flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto rounded-3xl bg-primary">
                                    <div className="w-16 h-16 rounded-full bg-brand-blue/5 text-brand-blue flex items-center justify-center">
                                        <Award className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 id="stats-empty-title" className="text-lg font-bold text-text-primary">No Team Stats Yet</h3>
                                        <p id="stats-empty-subtitle" className="text-xs text-text-secondary max-w-xs leading-relaxed">
                                            Stats will appear here after this team has completed matches.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className="px-4.5 py-2.5 text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-2xl shadow-sm transition-all active:scale-95 uppercase tracking-wide cursor-pointer"
                                    >
                                        BACK TO OVERVIEW
                                    </button>
                                </CrickIQCard>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Page Header */}
                                <CrickIQCard id="stats-header" className="p-4 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-text-secondary font-mono">Performance Analytics</div>
                                            <h4 className="text-xl font-extrabold text-brand-blue mt-0.5 font-sans">Team Stat Ledger</h4>
                                            <p className="text-xs text-text-secondary mt-1 max-w-md leading-relaxed">
                                                Review automated match compilations, batting innings profiles, opponent wickets metrics, and recent form indicators.
                                            </p>
                                        </div>
                                    </div>
                                </CrickIQCard>

                                {/* Form Guide Section */}
                                <CrickIQCard id="stats-form-guide" className="p-6 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm space-y-4">
                                    <div>
                                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary">Recent Form Guide</h3>
                                        <p className="text-[11px] text-text-secondary">Chronological outcome guide for the last 10 completed engagements</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {teamFormGuide.map((item, index) => {
                                            const colorClass = 
                                                item.result === 'W' 
                                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                    : item.result === 'L'
                                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                                    : item.result === 'T'
                                                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                                    : 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400 border-zinc-500/20';

                                            return (
                                                <div 
                                                    key={index}
                                                    title={`${item.info} (${new Date(item.date.replace(/-/g, '/')).toLocaleDateString()})`}
                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs border cursor-help hover:scale-105 active:scale-95 transition-all ${colorClass}`}
                                                >
                                                    {item.result}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CrickIQCard>

                                {/* Grid of Analytics */}
                                <div className="space-y-6">
                                    
                                    {/* Team Overview Section */}
                                    <CrickIQCard id="stats-overview-section" className="p-6 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm space-y-4">
                                        <div className="flex items-center gap-2 border-b border-brand-blue/5 pb-3">
                                            <Layers className="w-5 h-5 text-brand-blue" />
                                            <div>
                                                <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary">Team Match Overview</h3>
                                                <p className="text-[11px] text-text-secondary">Comprehensive results summary of started fixtures</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                            <div className="p-4 bg-secondary/40 border border-brand-blue/5 rounded-2xl text-center space-y-1">
                                                <div className="text-[10px] font-extrabold text-text-secondary uppercase">Matches Played</div>
                                                <div className="text-2xl font-black text-text-primary font-mono">{teamOverviewStats.matchesPlayed}</div>
                                            </div>
                                            <div className="p-4 bg-secondary/40 border border-brand-blue/5 rounded-2xl text-center space-y-1">
                                                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">Matches Won</div>
                                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{teamOverviewStats.matchesWon}</div>
                                            </div>
                                            <div className="p-4 bg-secondary/40 border border-brand-blue/5 rounded-2xl text-center space-y-1">
                                                <div className="text-[10px] font-extrabold text-rose-500 uppercase">Matches Lost</div>
                                                <div className="text-2xl font-black text-rose-500 font-mono">{teamOverviewStats.matchesLost}</div>
                                            </div>
                                            <div className="p-4 bg-secondary/40 border border-brand-blue/5 rounded-2xl text-center space-y-1">
                                                <div className="text-[10px] font-extrabold text-blue-500 uppercase">Matches Tied</div>
                                                <div className="text-2xl font-black text-blue-500 font-mono">{teamOverviewStats.matchesTied}</div>
                                            </div>
                                            <div className="p-4 bg-secondary/40 border border-brand-blue/5 rounded-2xl text-center space-y-1">
                                                <div className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase">No Result / Abandoned</div>
                                                <div className="text-2xl font-black text-zinc-500 dark:text-zinc-400 font-mono">{teamOverviewStats.noResultCount}</div>
                                            </div>
                                            <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl text-center space-y-1 col-span-2 sm:col-span-1">
                                                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">Victory Rate</div>
                                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                                    {teamOverviewStats.hasDecisive ? `${teamOverviewStats.winPercentage}%` : '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </CrickIQCard>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Batting Performance Section */}
                                        <CrickIQCard id="stats-batting-section" className="p-6 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm space-y-4">
                                            <div className="flex items-center gap-2 border-b border-brand-blue/5 pb-3">
                                                <Activity className="w-5 h-5 text-brand-blue" />
                                                <div>
                                                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary">Batting Performance</h3>
                                                    <p className="text-[11px] text-text-secondary">Compiled statistics of team batting outings</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3.5 pt-1">
                                                <div className="flex justify-between items-center bg-secondary/15 p-2 rounded-xl">
                                                    <div className="text-[11px] font-extrabold uppercase text-text-secondary">Total Runs Scored</div>
                                                    <div className="text-sm font-black text-text-primary font-mono">{teamBattingStats.totalRuns}</div>
                                                </div>
                                                <div className="flex justify-between items-center bg-secondary/15 p-2 rounded-xl">
                                                    <div className="text-[11px] font-extrabold uppercase text-text-secondary">Highest Innings Score</div>
                                                    <div className="text-sm font-black text-text-primary font-mono">{teamBattingStats.highestScore}</div>
                                                </div>
                                                <div className="flex justify-between items-center bg-secondary/15 p-2 rounded-xl">
                                                    <div className="text-[11px] font-extrabold uppercase text-text-secondary">Lowest Innings Score</div>
                                                    <div className="text-sm font-black text-text-primary font-mono">{teamBattingStats.lowestScore}</div>
                                                </div>
                                                <div className="flex justify-between items-center bg-secondary/15 p-2 rounded-xl">
                                                    <div className="text-[11px] font-extrabold uppercase text-text-secondary">Average Innings Runs</div>
                                                    <div className="text-sm font-black text-text-primary font-mono">{teamBattingStats.averageScore}</div>
                                                </div>
                                                
                                                <div className="pt-2 border-t border-brand-blue/5">
                                                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary mb-2 font-semibold">Milestone Scoreboard Innings</div>
                                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                                        <div className="p-2.5 bg-secondary/40 border border-brand-blue/5 rounded-2xl">
                                                            <div className="font-mono font-black text-text-primary">{teamBattingStats.count100Plus}</div>
                                                            <div className="text-[9px] font-extrabold text-text-secondary uppercase mt-0.5">100+</div>
                                                        </div>
                                                        <div className="p-2.5 bg-secondary/40 border border-brand-blue/5 rounded-2xl">
                                                            <div className="font-mono font-black text-text-primary">{teamBattingStats.count150Plus}</div>
                                                            <div className="text-[9px] font-extrabold text-text-secondary uppercase mt-0.5">150+</div>
                                                        </div>
                                                        <div className="p-2.5 bg-secondary/40 border border-brand-blue/5 rounded-2xl">
                                                            <div className="font-mono font-black text-text-primary">{teamBattingStats.count200Plus}</div>
                                                            <div className="text-[9px] font-extrabold text-text-secondary uppercase mt-0.5">200+</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CrickIQCard>

                                        {/* Bowling Performance Section */}
                                        <CrickIQCard id="stats-bowling-section" className="p-6 border border-brand-blue/10 dark:border-brand-blue/20 bg-primary rounded-3xl shadow-sm space-y-4">
                                            <div className="flex items-center gap-2 border-b border-brand-blue/5 pb-3">
                                                <Trophy className="w-5 h-5 text-brand-blue" />
                                                <div>
                                                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary">Bowling Performance</h3>
                                                    <p className="text-[11px] text-text-secondary">Compiled statistics of opponent wickets fallen</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3.5 pt-1">
                                                <div className="flex justify-between items-center bg-secondary/15 p-2 rounded-xl">
                                                    <div className="text-[11px] font-extrabold uppercase text-text-secondary">Total Wickets Taken</div>
                                                    <div className="text-sm font-black text-text-primary font-mono">{teamBowlingStats.totalWicketsTaken}</div>
                                                </div>
                                                <div className="flex justify-between items-center bg-secondary/15 p-2 rounded-xl">
                                                    <div className="text-[11px] font-extrabold uppercase text-text-secondary">Average Wickets / Match</div>
                                                    <div className="text-sm font-black text-text-primary font-mono">{teamBowlingStats.averageWicketsPerMatch}</div>
                                                </div>
                                                <div className="flex justify-between items-center bg-secondary/15 p-2 rounded-xl">
                                                    <div className="text-[11px] font-extrabold uppercase text-text-secondary">Opposition All-Outs</div>
                                                    <div className="text-sm font-black text-text-primary font-mono">{teamBowlingStats.oppositionAllOutCount}</div>
                                                </div>
                                                <div className="flex justify-between items-start bg-secondary/15 p-2 rounded-xl flex-col sm:flex-row sm:items-center gap-1">
                                                    <div className="text-[11px] font-extrabold uppercase text-text-secondary">Best Bowling Innings</div>
                                                    <div className="text-xs font-black text-text-primary font-sans break-words text-left sm:text-right w-full sm:w-auto">{teamBowlingStats.bestBowling}</div>
                                                </div>
                                            </div>
                                        </CrickIQCard>
                                    </div>

                                </div>
                            </div>
                        )
                    ) : (
                        /* Unified Clean Professional Placeholders for non-overview tabs */
                        <CrickIQCard className="p-8 text-center border border-brand-blue/10 dark:border-brand-blue/20 flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto rounded-3xl bg-primary">
                            <div className="w-16 h-16 rounded-full bg-brand-blue/5 text-brand-blue flex items-center justify-center">
                                {TABS.find(t => t.id === activeTab)?.icon}
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-lg font-bold text-text-primary">
                                    {TABS.find(t => t.id === activeTab)?.label} Hub
                                </h3>
                                <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                                    {activeTab === 'matches' && "Historical detailed scoreboard ledgers, wagon wheels, and ball-by-ball analysis logs are coming in Phase 5."}
                                    {activeTab === 'tournaments' && "Tournament fixture scheduling, points-table history, and league standings will be added later."}
                                    {activeTab === 'stats' && "Advanced visual graphs, career averages, run-rates, strike-rates, and form metrics will be unlocked in later phases."}
                                    {activeTab === 'records' && "Milestone charts, match-defining records, streak trackers, and legacy board logs will be added later."}
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className="px-4.5 py-2.5 text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 rounded-2xl shadow-sm transition-all active:scale-95 uppercase tracking-wide"
                            >
                                BACK TO OVERVIEW
                            </button>
                        </CrickIQCard>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamDetailsHub;
