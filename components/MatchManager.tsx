import CrickIQCard from './CrickIQCard';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { Match, TossDecision, Team, Tournament, Player } from '../types';
import { PlayerRole } from '../types';
import { PlusIcon, TrophyIcon, ClockIcon, TrashIcon, EditIcon, UserGroupIcon, BallIcon, CalendarIcon, CheckIcon } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import MatchCreationForm from './MatchCreationForm';
import MatchTable from './MatchTable';
import MatchFilters from './MatchFilters';
import { EditMatchModal } from './MatchModals';
import MatchShareCard from './MatchShareCard';
import { useNotification } from '../hooks/useNotification';
import { TeamEditorModal } from './TeamEditorModal';
import TournamentList from './TournamentList';
import Statistics from './Statistics';
import LineupPreview from './LineupPreview';
import ScheduleGenerator from './ScheduleGenerator';
import { calculatePlayerCareerStats } from '../utils/cricketLogic';
import { validateTournamentMatch, validateMaxOversPerBowler } from '../utils/validation';
import { getMaxPlayers } from '../utils/matchConfig';
import TossModal from './TossModal';
import PointsTable from './PointsTable';


const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'blue' }> = ({ children, className, variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses = variant === 'secondary' ? 'bg-brand-lightblue text-white border-0' : variant === 'blue' ? 'bg-brand-blue text-white border-0' : 'bg-brand-gradient text-white border-0'; // primary is default

    return <button {...props} className={`${baseClasses} ${variantClasses} ${className}`}>{children}</button>
}

const adjustColor = (color: string, amount: number) => {
    if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
        return '#4A5568'; 
    }
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}


interface MatchManagerProps extends UseCrickIQStateReturn {
    onStartMatch: (match: Match) => void;
    onContinueMatch: (match: Match) => void;
    isMatchLive: boolean;
    selectedTournamentId: string | null;
    onBack: () => void;
    onViewTournament: (tournamentId: string) => void;
    onViewMatchResult: (matchId: string) => void;
    onOpenMatchHub?: (matchId: string, returnLocation?: Record<string, unknown>) => void;
    initialView?: string;
}

const MatchManager: React.FC<MatchManagerProps> = (props) => {
    const {
        tournaments, teams, matches, addMatch, deleteMatch, updateToss, onStartMatch,
        onContinueMatch, getTeamById, getTournamentById, updateMatch,
        isMatchLive, selectedTournamentId,
        addTeamToTournament, removeTeamFromTournament, onViewTournament, onViewMatchResult,
        onOpenMatchHub,
        initialView,
        addPlayerReplacement
    } = props;
    const { showNotification } = useNotification();
    type View = 'tournaments' | 'schedule' | 'history' | 'teams' | 'stats' | 'points' | 'semifinals' | 'final';
    const [view, setView] = useState<View>((initialView as View) || (selectedTournamentId ? 'teams' : 'tournaments'));

    const handleOpenMatchHub = (matchId: string) => {
        onOpenMatchHub?.(matchId, { matchManagerView: view });
    };
    const [fixtureView, setFixtureView] = useState<'manual' | 'automation'>('manual');
    
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
    const teamAddGuard = useRef(false);

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    

    useEffect(() => {
        if (selectedTournamentId) {
            const timeoutId = setTimeout(() => {
                setView(v => (v === 'tournaments' ? 'teams' : v));
            }, 0);
            return () => clearTimeout(timeoutId);
        } else {
            const timeoutId = setTimeout(() => {
                setView('tournaments');
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [selectedTournamentId]);


    const [selectedTournamentForForm, setSelectedTournamentForForm] = useState(tournaments.filter(t => t.id !== 't_quick_matches')[0]?.id || '');
    const [team1Id, setTeam1Id] = useState('');
    const [team2Id, setTeam2Id] = useState('');
    const [matchDate, setMatchDate] = useState('');
    const [matchTime, setMatchTime] = useState('10:00');
    const [matchOvers, setMatchOvers] = useState<number | ''>(20);
    const [matchMaxOvers, setMatchMaxOvers] = useState<number | ''>(4);
    const [isOversEditable, setIsOversEditable] = useState(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    
    const [tossMatch, setTossMatch] = useState<Match | null>(null);

    const [confirmation, setConfirmation] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; confirmText?: string; confirmVariant?: 'danger' | 'primary'; } | null>(null);
    
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [editFormData, setEditFormData] = useState({
        team1Id: '',
        team2Id: '',
        date: '',
        time: '',
        oversPerInnings: '' as number | '',
        maxOversPerBowler: '' as number | '',
    });
    const [editError, setEditError] = useState<string | null>(null);

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calendarPosition, setCalendarPosition] = useState<'down' | 'up'>('down');
    const calendarContainerRef = useRef<HTMLDivElement>(null);

    const [newTeamName, setNewTeamName] = useState('');
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [previewingTeam, setPreviewingTeam] = useState<Team | null>(null);
    
    const tournament = useMemo(() => getTournamentById(selectedTournamentId || ''), [getTournamentById, selectedTournamentId]);
    const maxPlayers = useMemo(() => getMaxPlayers(undefined, tournament), [tournament]);

    const tournamentMatches = useMemo(() => {
        if (!selectedTournamentId) return [];
        return matches.filter(m => m.tournamentId === selectedTournamentId);
    }, [matches, selectedTournamentId]);

    const getPlayerStatsMap = useCallback((team: Team | null) => {
        const statsMap = new Map<string, { matches: number; runsScored: number; wicketsTaken: number; }>();
        if (team) {
            team.players.forEach(player => {
                const stats = calculatePlayerCareerStats(player.id, tournamentMatches.filter(m => m.status === 'completed'));
                statsMap.set(player.id, {
                    matches: stats.matches,
                    runsScored: stats.runsScored,
                    wicketsTaken: stats.wicketsTaken,
                });
            });
        }
        return statsMap;
    }, [tournamentMatches]);

    const previewingTeamStats = useMemo(() => {
        if (!previewingTeam) return new Map();
        return getPlayerStatsMap(previewingTeam);
    }, [previewingTeam, getPlayerStatsMap]);

    const scheduledMatches = useMemo(() => {
        return tournamentMatches.filter(m => (m.status === 'scheduled' || m.status === 'live') && !m.knockoutType);
    }, [tournamentMatches]);

    const semifinalMatches = useMemo(() => {
        return tournamentMatches.filter(m => m.knockoutType === 'semifinal');
    }, [tournamentMatches]);

    const finalMatches = useMemo(() => {
        return tournamentMatches.filter(m => m.knockoutType === 'final');
    }, [tournamentMatches]);
    
    const completedMatches = useMemo(() => {
        return tournamentMatches.filter(m => m.status === 'completed');
    }, [tournamentMatches]);
    useEffect(() => {
        const val = validateMaxOversPerBowler(matchMaxOvers, matchOvers);
        if (!val.valid) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setScheduleError(val.message || null);
        } else {
             
            setScheduleError(prev => prev && prev.includes('Maximum Overs') ? null : prev);
        }
    }, [matchOvers, matchMaxOvers]);

    useEffect(() => {
        const val = validateMaxOversPerBowler(editFormData.maxOversPerBowler === '' ? undefined : editFormData.maxOversPerBowler, editFormData.oversPerInnings);
        if (!val.valid) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEditError(val.message || null);
        } else {
             
            setEditError(prev => prev && prev.includes('Maximum Overs') ? null : prev);
        }
    }, [editFormData.oversPerInnings, editFormData.maxOversPerBowler]);


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (calendarContainerRef.current && !calendarContainerRef.current.contains(event.target as Node)) {
                setIsCalendarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [calendarContainerRef]);

    useEffect(() => {
        if (editingMatch) {
            const timeoutId = setTimeout(() => {
                setEditFormData({
                    team1Id: editingMatch.team1Id,
                    team2Id: editingMatch.team2Id,
                    date: editingMatch.date,
                    time: editingMatch.time || '10:00',
                    oversPerInnings: editingMatch.oversPerInnings,
                    maxOversPerBowler: editingMatch.maxOversPerBowler || '',
                });
                setEditError(null);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [editingMatch]);

    useEffect(() => {
        const tournamentIdToUse = selectedTournamentId || selectedTournamentForForm;
        if (tournamentIdToUse) {
            const tournament = getTournamentById(tournamentIdToUse);
            const timeoutId = setTimeout(() => {
                if (tournament && tournament.defaultOvers) {
                    setMatchOvers(tournament.defaultOvers);
                    setIsOversEditable(!!selectedTournamentId); 
                } else {
                    setMatchOvers(20);
                    setIsOversEditable(true);
                }
            }, 0);
            return () => clearTimeout(timeoutId);
        } else {
            const timeoutId = setTimeout(() => {
                setIsOversEditable(true);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [selectedTournamentId, selectedTournamentForForm, getTournamentById]);

    const effectiveTournamentId = selectedTournamentId || selectedTournamentForForm;
    const effectiveTournament = useMemo(() => getTournamentById(effectiveTournamentId), [getTournamentById, effectiveTournamentId]);

    const checkTeamReadiness = useCallback((team: Team): boolean => {
        if (!team || !effectiveTournament) return false;
        
        const maxPlayers = getMaxPlayers(undefined, effectiveTournament);

        if (team.players.length !== maxPlayers) return false;
        if (team.players.some(p => !p.name.trim())) return false;
        
        const numbers = team.players.map(p => p.number);
        if (new Set(numbers).size !== numbers.length) return false;

        if (team.players.length === maxPlayers && !team.players.some(p => p.role === PlayerRole.WICKET_KEEPER)) {
            return false;
        }
        
        if (team.players.length > 0 && !team.captainId) return false;
        if (team.players.length > 0 && !team.viceCaptainId) return false;
        
        return true;
    }, [effectiveTournament]);

    const allTournamentTeams = useMemo(() => {
        if (!effectiveTournament) return [];
        return teams.filter(t => effectiveTournament.teamIds.includes(t.id));
    }, [teams, effectiveTournament]);


    const availableTeams = useMemo(() => {
        return allTournamentTeams.filter(checkTeamReadiness);
    }, [allTournamentTeams, checkTeamReadiness]);

    const team1Options = useMemo(() => {
        return allTournamentTeams.filter(t => t.id !== team2Id);
    }, [allTournamentTeams, team2Id]);

    const team2Options = useMemo(() => {
        return allTournamentTeams.filter(t => t.id !== team1Id);
    }, [allTournamentTeams, team1Id]);
    
    const teamsForEditingMatch = useMemo(() => {
        if (!editingMatch) return [];
        const matchTournament = getTournamentById(editingMatch.tournamentId);
        if (!matchTournament) return [];
        return teams.filter(t => matchTournament.teamIds.includes(t.id));
    }, [teams, editingMatch, getTournamentById]);

    const editTeam1Options = useMemo(() => {
        return teamsForEditingMatch.filter(t => t.id !== editFormData.team2Id);
    }, [teamsForEditingMatch, editFormData.team2Id]);

    const editTeam2Options = useMemo(() => {
        return teamsForEditingMatch.filter(t => t.id !== editFormData.team1Id);
    }, [teamsForEditingMatch, editFormData.team1Id]);
    
    const scheduleValidation = useMemo(() => {
        const tournamentId = selectedTournamentId || selectedTournamentForForm;
        return validateTournamentMatch(tournamentId, team1Id, team2Id, matchDate, matchTime, matchOvers, matchMaxOvers);
    }, [selectedTournamentId, selectedTournamentForForm, team1Id, team2Id, matchDate, matchTime, matchOvers, matchMaxOvers]);
    const isScheduleFormValid = scheduleValidation.valid;

    const editValidation = useMemo(() => {
        return validateTournamentMatch(
            'valid-tournament', 
            editFormData.team1Id, 
            editFormData.team2Id, 
            editFormData.date, 
            editFormData.time, 
            editFormData.oversPerInnings, 
            editFormData.maxOversPerBowler
        );
    }, [editFormData]);
    const isEditFormValid = editValidation.valid;

    const teamReadinessError = useMemo(() => {
        if (!team1Id && !team2Id) return null;
        
        const team1 = allTournamentTeams.find(t => t.id === team1Id);
        const team2 = allTournamentTeams.find(t => t.id === team2Id);
    
        const team1Ready = team1 ? checkTeamReadiness(team1) : true;
        const team2Ready = team2 ? checkTeamReadiness(team2) : true;
        
        if (!team1Ready && !team2Ready && team1Id && team2Id) {
            return "Team 1 and Team 2 are not ready for a match.";
        }
        if (!team1Ready && team1Id) {
            return `${team1?.name || 'Team 1'} is not ready for a match.`;
        }
        if (!team2Ready && team2Id) {
            return `${team2?.name || 'Team 2'} is not ready for a match.`;
        }
        
        return null;
    }, [team1Id, team2Id, allTournamentTeams, checkTeamReadiness]);

    const formatTime = (timeString: string | undefined) => {
        if (!timeString) return '';
        const [hourString, minute] = timeString.split(':');
        const hour = +hourString % 24;
        return new Date(1970, 0, 1, hour, +minute).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true});
    };

    const handleAddMatch = () => {
         
            setScheduleError(null);

        if (teamReadinessError) {
            setConfirmation({
                title: "Team Not Ready",
                message: (
                    <>
                        {teamReadinessError}
                        <p className="mt-2 text-body">Please visit the 'Teams' tab to finalize the lineup, and select a captain and vice-captain.</p>
                    </>
                ),
                onConfirm: () => setConfirmation(null),
                confirmText: "OK",
                confirmVariant: 'primary'
            });
            return;
        }
        
        const tournamentId = selectedTournamentId || selectedTournamentForForm;
        
        if (!scheduleValidation.valid) {
            const error = scheduleValidation.message || "Please complete all fields correctly.";
             
            setScheduleError(error);
            showNotification(error, 'error');
            return;
        }
        

        const tournamentName = getTournamentById(tournamentId)?.name;
        const team1 = getTeamById(team1Id);
        const team2 = getTeamById(team2Id);

        const confirmationMessage = (
            <div className="space-y-4 text-left text-body">
                <p className="text-text-secondary text-center">Please review and confirm the match details below.</p>
                
                <div className="bg-primary/50 dark:bg-black/20 p-4 rounded-xl flex items-center justify-around gap-2 text-center">
                    <div className="flex flex-col items-center gap-2 w-28">
                        <div className="w-14 h-14 flex items-center justify-center rounded-lg text-white text-h2 shadow-md" style={{ backgroundColor: team1?.logo }}>
                            {team1?.name.substring(0, 3).toUpperCase()}
                        </div>
                        <h3 className="text-base font-bold text-text-primary truncate w-full">{team1?.name}</h3>
                    </div>

                    <span className="text-2xl text-text-secondary">VS</span>
                    
                    <div className="flex flex-col items-center gap-2 w-28">
                        <div className="w-14 h-14 flex items-center justify-center rounded-lg text-white text-h2 shadow-md" style={{ backgroundColor: team2?.logo }}>
                            {team2?.name.substring(0, 3).toUpperCase()}
                        </div>
                        <h3 className="text-base font-bold text-text-primary truncate w-full">{team2?.name}</h3>
                    </div>
                </div>
                
                <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-4 text-body">
                        <CalendarIcon className="w-5 h-5 text-text-secondary" />
                        <span className="font-semibold text-text-primary">{new Date(matchDate.replace(/-/g, '/')).toDateString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-body">
                        <ClockIcon className="w-5 h-5 text-text-secondary" />
                        <span className="font-semibold text-text-primary">{formatTime(matchTime)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-body">
                        <TrophyIcon className="w-5 h-5 text-text-secondary" />
                        <span className="font-semibold text-text-primary">{tournamentName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-body">
                        <BallIcon className="w-5 h-5 text-text-secondary" />
                        <span className="font-semibold text-text-primary">{matchOvers} Overs per Innings</span>
                    </div>
                </div>
            </div>
        );


        setConfirmation({
            title: 'Confirm Fixture',
            message: confirmationMessage,
            onConfirm: () => {
                addMatch(tournamentId, team1Id, team2Id, matchDate, matchTime, matchOvers as number, matchMaxOvers === '' ? undefined : matchMaxOvers);
                setTeam1Id('');
                setTeam2Id('');
                setMatchDate('');
                setMatchTime('10:00');
                showNotification('Fixture added successfully!', 'success');
                setConfirmation(null);
            },
            confirmText: 'Add Fixture',
            confirmVariant: 'primary'
        });
    };

    const handleDeleteMatch = (matchId: string) => {
        setConfirmation({
            title: 'Delete Match?',
            message: 'Are you sure you want to delete this scheduled match? This action cannot be undone.',
            onConfirm: () => {
                deleteMatch(matchId);
                showNotification('Match deleted', 'delete');
                setConfirmation(null);
            }
        });
    };

    const handleUpdateMatch = () => {
        setEditError(null);
        if (!editingMatch || !editValidation.valid) {
            setEditError(editValidation.message || "Please fill all fields correctly.");
            return;
        }
        

        const maxOvers = editFormData.maxOversPerBowler ? Number(editFormData.maxOversPerBowler) : undefined;
        
        updateMatch(editingMatch.id, {
            ...editFormData,
            oversPerInnings: overs,
            maxOversPerBowler: maxOvers
        });
        showNotification("Match updated successfully!", 'success');
        setEditingMatch(null);
    };

    const handleAddTeam = () => {
        if (teamAddGuard.current) return;
        
        const tournamentId = selectedTournamentId;
        if (!tournamentId) {
            showNotification("Select a tournament first.", 'error');
            return;
        }
        
        const trimmedName = newTeamName.trim();
        if (!trimmedName) {
            showNotification("Team name cannot be empty.", 'error');
            return;
        }
        
        if (trimmedName.length > 30) {
            showNotification("Team name is too long (max 30 chars).", 'error');
            return;
        }
        
        teamAddGuard.current = true;
        const { success, error } = addTeamToTournament(trimmedName, tournamentId);
        
        if (success) {
            showNotification(`Team "${newTeamName.trim()}" added!`, 'success');
            setNewTeamName('');
        } else if (error) {
            showNotification(error, 'error');
        }
        
        setTimeout(() => {
            teamAddGuard.current = false;
        }, 300);
    };
    
    const handleDeleteTeam = (team: Team) => {
        const teamHasMatches = matches.some(m => m.tournamentId === selectedTournamentId && (m.team1Id === team.id || m.team2Id === team.id));
        if (teamHasMatches) {
            showNotification(`Cannot remove "${team.name}" as it's in a match in this tournament.`, 'error');
            return;
        }
        setConfirmation({
            title: `Remove ${team.name}?`,
            message: `Are you sure you want to remove "${team.name}" from this tournament? The team itself will not be deleted.`,
            onConfirm: () => {
                if(selectedTournamentId) {
                    removeTeamFromTournament(team.id, selectedTournamentId);
                    showNotification(`Team "${team.name}" removed from tournament.`, 'delete');
                }
                setConfirmation(null);
            },
            confirmText: 'Confirm Remove'
        });
    };

    const handleShareMatch = async (match: Match) => {
        const team1 = getTeamById(match.team1Id);
        const team2 = getTeamById(match.team2Id);
        const tournament = getTournamentById(match.tournamentId);
    
        if (!team1 || !team2 || !tournament) {
            showNotification('Could not generate match card data.', 'error');
            return;
        }
    
        const componentString = ReactDOMServer.renderToStaticMarkup(
            <MatchShareCard match={match} team1={team1} team2={team2} tournament={tournament as Tournament} />
        );
    
        const svgString = `
            <svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
                <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml">
                        ${componentString}
                    </div>
                </foreignObject>
            </svg>
        `;
    
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
    
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            showNotification('Could not generate image.', 'error');
            return;
        }
    
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    showNotification('Could not generate image.', 'error');
                    return;
                }
    
                const file = new File([blob], `match-card-${match.id}.png`, { type: 'image/png' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: `${team1.name} vs ${team2.name}`,
                            text: `Upcoming match in the ${tournament.name}!`,
                            files: [file],
                        });
                    } catch (error) {
                        if ((error as DOMException)?.name !== 'AbortError') {
                            showNotification('Sharing failed.', 'error');
                        }
                    }
                } else {
                    showNotification('Web Share not supported. Downloading image.', 'info');
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `match-card-${match.id}.png`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                }
            }, 'image/png');
        };
        img.onerror = () => {
            showNotification('Failed to load image for sharing.', 'error');
        }
        img.src = svgDataUrl;
    };
    
    const handleConfirmToss = (winnerId: string, decision: TossDecision) => {
        if (tossMatch) {
            updateToss(tossMatch.id, { winner: winnerId, decision });
        }
        setTossMatch(null);
    };

    const renderHeader = () => {
        if (selectedTournamentId) {
            const tournament = getTournamentById(selectedTournamentId);
            const teamsCount = tournament?.teamIds?.length || 0;
            const matchesCount = matches.filter(m => m.tournamentId === selectedTournamentId).length;
            const format = tournament?.format || 'Standard';

            return (
                <div className="bg-primary/20 p-3 rounded-xl border border-brand-blue/15 mb-4 space-y-4">
                    <div className="flex items-center gap-4 text-text-primary text-body px-1">
                        <div className="flex items-center gap-1">
                            <span className="font-semibold">{teamsCount}</span>
                            <span className="text-text-secondary">Teams</span>
                        </div>
                        <span className="opacity-40">•</span>
                        <div className="flex items-center gap-1">
                            <span className="font-semibold">{matchesCount}</span>
                            <span className="text-text-secondary">Matches</span>
                        </div>
                        <span className="opacity-40">•</span>
                        <div className="flex items-center gap-1">
                            <span className="text-text-secondary">Format:</span>
                            <span className="font-semibold">{format}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const handleViewTournament = (tournamentId: string) => {
        onViewTournament(tournamentId);
        setView('teams');
    };

    const TABS = useMemo(() => {
        if (!selectedTournamentId) return [{ id: 'tournaments', label: 'Tournaments' }];
        
        const tabs: { id: View, label: string }[] = [
            { id: 'teams', label: 'Teams' }, 
            { id: 'schedule', label: 'Fixtures' },
            { id: 'points', label: 'Points' },
        ];

        if (semifinalMatches.length > 0) tabs.push({ id: 'semifinals', label: 'Semifinals' });
        if (finalMatches.length > 0) tabs.push({ id: 'final', label: 'Final' });
        
        tabs.push({ id: 'history', label: 'History' });
        tabs.push({ id: 'stats', label: 'Stats' });

        return tabs;
    }, [selectedTournamentId, semifinalMatches, finalMatches]);
        
    const handleTouchStart = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe, .recharts-surface, .overflow-x-auto, [data-no-swipe="true"]')) {
            return;
        }
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchCurrentX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        setTouchCurrentX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStartX === null || touchCurrentX === null || TABS.length <= 1) {
            return;
        }

        const diffX = touchStartX - touchCurrentX;
        const SWIPE_THRESHOLD = 75;

        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
            const tabIds = TABS.map(t => t.id) as View[];
            const currentIndex = tabIds.indexOf(view);

            if (diffX > 0) { // Swiped left
                if (currentIndex < tabIds.length - 1) {
                    setView(tabIds[currentIndex + 1]);
                }
            } else { // Swiped right
                if (currentIndex > 0) {
                    setView(tabIds[currentIndex - 1]);
                }
            }
        }

        setTouchStartX(null);
        setTouchCurrentX(null);
    };

    const tossMatchTeam1 = tossMatch ? getTeamById(tossMatch.team1Id) : null;
    const tossMatchTeam2 = tossMatch ? getTeamById(tossMatch.team2Id) : null;

    const matchTableProps = {
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
        onOpenMatchHub: handleOpenMatchHub
    };

    const getStageTag = (match: Match) => {
        if (match.knockoutType === 'final') {
            return <span className="text-[10px] font-bold text-warning bg-warning/20 dark:bg-warning/20 px-2 py-0.5 rounded-2xl uppercase">Final</span>;
        }
        if (match.knockoutType === 'semifinal') {
            return <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/20 dark:bg-blue-900/30 px-2 py-0.5 rounded-2xl uppercase">Semifinal</span>;
        }
        if (tournament?.format === 'Knockout' && !match.knockoutType) {
            return <span className="text-[10px] font-bold text-brand-lavender bg-brand-lavender/20 dark:bg-brand-lavender/30 px-2 py-0.5 rounded-2xl uppercase">Qualifier</span>;
        }
        if (match.groupId) {
            return <span className="text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 rounded-2xl uppercase">Group {match.groupId.toUpperCase()}</span>;
        }
        if ((tournament?.format === 'Round Robin' || tournament?.format === 'Round Robin + Knockout') && !match.knockoutType) {
            return <span className="text-[10px] font-bold text-success bg-success/20 dark:bg-green-900/30 px-2 py-0.5 rounded-2xl uppercase">Group Stage</span>;
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {renderHeader()}
            
            
            <MatchFilters tabs={TABS} currentView={view} onViewChange={setView} />
            
            <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {view === 'tournaments' && (
                    <TournamentList
                        tournaments={tournaments}
                        teams={teams}
                        matches={matches}
                        isMatchLive={isMatchLive}
                        deleteTournament={props.deleteTournament}
                        updateTournament={props.updateTournament}
                        onViewTournament={handleViewTournament}
                        addTournament={props.addTournament}
                    />
                )}
    
                {view === 'schedule' && (
                    <div className="space-y-6 relative z-50">
                        <div className="flex bg-secondary dark:bg-black/20 rounded-lg p-1 space-x-1 border border-[#DCE3F0] dark:border-brand-blue/15">
                            <button
                                onClick={() => setFixtureView('manual')}
                                className={`flex-1 py-2 px-4 text-body font-semibold rounded-md transition-colors ${fixtureView === 'manual' ? 'bg-primary text-brand-blue dark:text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                Manual
                            </button>
                            <button
                                onClick={() => setFixtureView('automation')}
                                className={`flex-1 py-2 px-4 text-body font-semibold rounded-md transition-colors ${fixtureView === 'automation' ? 'bg-primary text-brand-blue dark:text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                                Automation
                            </button>
                        </div>

                        {fixtureView === 'automation' ? (
                            <div className="animate-fade-in">
                                <ScheduleGenerator {...props} />
                            </div>
                        ) : (
                            <div className="animate-fade-in space-y-6">
                                <MatchCreationForm
                                    isCalendarOpen={isCalendarOpen}
                                    setIsCalendarOpen={setIsCalendarOpen}
                                    calendarPosition={calendarPosition}
                                    setCalendarPosition={setCalendarPosition}
                                    calendarContainerRef={calendarContainerRef}
                                    selectedTournamentId={selectedTournamentId}
                                    selectedTournamentForForm={selectedTournamentForForm}
                                    setSelectedTournamentForForm={setSelectedTournamentForForm}
                                    team1Id={team1Id}
                                    setTeam1Id={setTeam1Id}
                                    team2Id={team2Id}
                                    setTeam2Id={setTeam2Id}
                                    matchDate={matchDate}
                                    setMatchDate={setMatchDate}
                                    matchTime={matchTime}
                                    setMatchTime={setMatchTime}
                                    matchOvers={matchOvers}
                                    setMatchOvers={setMatchOvers}
                                    matchMaxOvers={matchMaxOvers}
                                    setMatchMaxOvers={setMatchMaxOvers}
                                    isOversEditable={isOversEditable}
                                    scheduleError={scheduleError}
                                    isScheduleFormValid={isScheduleFormValid}
                                    handleAddMatch={handleAddMatch}
                                    team1Options={team1Options}
                                    team2Options={team2Options}
                                    allTournamentTeams={allTournamentTeams}
                                    availableTeams={availableTeams}
                                    tournaments={tournaments}
                                    checkTeamReadiness={checkTeamReadiness}
                                />
                            </div>
                        )}
                    </div>
                )}

                {view === 'schedule' && (
                    <div className="mt-8 space-y-6">
                        {tournament?.groups ? (
                            <>
                                <MatchTable list={scheduledMatches.filter(m => m.groupId === 'a')} title="Group A Matches" emptyMessage="No Group A fixtures." {...matchTableProps} />
                                <MatchTable list={scheduledMatches.filter(m => m.groupId === 'b')} title="Group B Matches" emptyMessage="No Group B fixtures." {...matchTableProps} />
                            </>
                        ) : (
                            <MatchTable list={scheduledMatches} title="Upcoming Group Matches" emptyMessage="No upcoming fixtures." {...matchTableProps} />
                        )}
                    </div>
                )}

                {view === 'semifinals' && <MatchTable list={semifinalMatches} title="Semifinals" emptyMessage="Semifinals will be automatically added here." {...matchTableProps} />}
                {view === 'final' && <MatchTable list={finalMatches} title="Final" emptyMessage="The final will be automatically added here." {...matchTableProps} />}
                
                {view === 'history' && (
                    <div className="space-y-4">
                        {completedMatches.length === 0 ? (
                            <CrickIQCard  className="text-center">
                                <p className="text-text-secondary">No completed matches yet.</p>
                            </CrickIQCard>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {completedMatches.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(match => {
                                    const team1 = getTeamById(match.team1Id);
                                    const team2 = getTeamById(match.team2Id);
                                    if (!team1 || !team2) return null;

                                    let winnerMessage = "Match Drawn";
                                    if (match.wasAbandoned) {
                                        winnerMessage = 'Match Abandoned';
                                    } else if (match.winnerId && match.winnerId !== 'draw') {
                                        const winner = getTeamById(match.winnerId);
                                        if (winner) {
                                            if (match.innings2 && winner.id === match.innings2.battingTeamId) {
                                                const battingTeam = getTeamById(match.innings2.battingTeamId);
                                                const maxPlayers = getMaxPlayers(match);
                                                const totalPlayers = battingTeam?.players?.length > 0 ? battingTeam.players.length : maxPlayers;
                                                const wicketsLeft = totalPlayers - 1 - (match.innings2.wickets || 0);
                                                winnerMessage = `${winner.name} won by ${wicketsLeft} wickets`;
                                            } else if (match.innings1 && winner.id === match.innings1.battingTeamId) {
                                                const runMargin = (match.innings1.score || 0) - (match.innings2?.score || 0);
                                                winnerMessage = `${winner.name} won by ${runMargin} runs`;
                                            } else {
                                                winnerMessage = `${winner.name} won`;
                                            }
                                        }
                                    }
                                    
                                    const team1Score = match.innings1?.battingTeamId === team1.id ? match.innings1 : match.innings2;
                                    const team2Score = match.innings1?.battingTeamId === team2.id ? match.innings1 : match.innings2;
                                    
                                    let manOfTheMatchPlayer: Player | undefined;
                                    if (match.manOfTheMatchId) {
                                        const allPlayers = teams.flatMap(t => t.players);
                                        manOfTheMatchPlayer = allPlayers.find(p => p.id === match.manOfTheMatchId);
                                    }
                                    

                                    return (
                                        <CrickIQCard 
                                            key={match.id} 
                                            accentColor={team1.logo}
                                            className="flex flex-col space-y-4 cursor-pointer hover:-translate-y-1 transition-transform duration-300"
                                            onClick={() => onViewMatchResult(match.id)}
                                        >
                                            <div className="pb-2 border-b border-brand-blue/15">
                                                <h4 className="font-bold text-text-primary truncate">{tournament?.name}</h4>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-caption text-text-secondary">{tournament?.location}</p>
                                                    {getStageTag(match)}
                                                </div>
                                                {match.toss && (
                                                    <p className="text-caption text-text-secondary mt-1">
                                                        {getTeamById(match.toss.winner)?.name} won the toss and chose to {match.toss.decision}.
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className={`flex justify-between items-center py-1.5 px-2 transition-colors`}>
                                                    <div className="flex items-center gap-2 font-bold text-text-primary">
                                                        <div className="w-6 h-6 flex items-center justify-center rounded-md text-button text-white text-caption" style={{ backgroundColor: team1.logo }}>
                                                            {team1.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm">{team1.name}</span>
                                                    </div>
                                                    <span className="font-mono font-bold text-text-primary">{team1Score ? `${team1Score.score}/${team1Score.wickets} (${team1Score.overs})` : 'DNB'}</span>
                                                </div>
                                                <div className={`flex justify-between items-center py-1.5 px-2 transition-colors`}>
                                                    <div className="flex items-center gap-2 font-bold text-text-primary">
                                                        <div className="w-6 h-6 flex items-center justify-center rounded-md text-button text-white text-caption" style={{ backgroundColor: team2.logo }}>
                                                            {team2.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm">{team2.name}</span>
                                                    </div>
                                                    <span className="font-mono font-bold text-text-primary">{team2Score ? `${team2Score.score}/${team2Score.wickets} (${team2Score.overs})` : 'DNB'}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="text-center text-body font-semibold py-1.5 px-2">
                                                {winnerMessage}
                                            </div>
                                            
                                            {manOfTheMatchPlayer && (
                                                <div className="pt-2 border-t border-brand-blue/15 text-center">
                                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Man of the Match</p>
                                                    <p className="font-bold text-brand-blue flex items-center justify-center gap-2 mt-1">
                                                        <TrophyIcon className="w-4 h-4 text-warning" />
                                                        {manOfTheMatchPlayer.name}
                                                    </p>
                                                </div>
                                            )}
                                        </CrickIQCard>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
                {view === 'teams' && selectedTournamentId && (
                     <div className="space-y-6">
                        <CrickIQCard>
                             <h3 className="text-h3 text-text-primary mb-4 flex items-center gap-2">
                                <PlusIcon className="w-5 h-5" />
                                Add New Team
                             </h3>
                             <div className="grid grid-cols-5 gap-4">
                                <input type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Team Name" className="col-span-3 p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                <Button onClick={handleAddTeam} variant="primary" disabled={!newTeamName.trim()} className="w-full col-span-2">
                                    <PlusIcon />
                                    Add
                                </Button>
                             </div>
                        </CrickIQCard>

                        {allTournamentTeams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allTournamentTeams.map(team => {
                                const captain = team.captainId ? team.players.find(p => p.id === team.captainId) : null;
                                const viceCaptain = team.viceCaptainId ? team.players.find(p => p.id === team.viceCaptainId) : null;
                                const isReady = checkTeamReadiness(team);
                                const cardBg = `linear-gradient(135deg, ${team.logo} 0%, ${adjustColor(team.logo, 60)} 100%)`;

                                return (
                                    <CrickIQCard 
                                        key={team.id} 
                                         className="flex flex-col ! overflow-hidden hover: transition-shadow duration-300 cursor-pointer"
                                        onClick={() => {
                                            if (isReady) {
                                                setPreviewingTeam(team);
                                            } else {
                                                setEditingTeamId(team.id);
                                            }
                                        }}
                                    >
                                        <div className="p-4" style={{ background: cardBg }}>
                                            <div className="flex justify-between items-start text-white">
                                                <h3 className="text-h2 truncate pr-4">{team.name}</h3>
                                                <div className="flex items-center -mr-2 -mt-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingTeamId(team.id); }}
                                                        className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
                                                        title="Edit Team"
                                                    >
                                                        <EditIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team); }}
                                                        disabled={isMatchLive}
                                                        className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                                        title={isMatchLive ? "Cannot delete team during a live match" : "Delete Team"}
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 flex-grow flex flex-col">
                                            <div className="space-y-4 flex-grow">
                                                <div className="flex items-center gap-4 text-body">
                                                    <div className="w-6 h-6 flex items-center justify-center bg-yellow-400 text-black rounded-full font-bold text-caption flex-shrink-0">C</div>
                                                    <span className="font-semibold truncate text-text-primary">{captain ? captain.name : 'Not Set'}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-body">
                                                    <div className="w-6 h-6 flex items-center justify-center bg-gray-400 text-black rounded-full font-bold text-caption flex-shrink-0">VC</div>
                                                    <span className="font-semibold truncate text-text-primary">{viceCaptain ? viceCaptain.name : 'Not Set'}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-body">
                                                    <UserGroupIcon className="w-6 h-6 text-text-secondary" />
                                                    <span className="font-semibold text-text-primary">{team.players.length} / {maxPlayers} Players</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-brand-blue/15 text-center">
                                                <div className={`flex items-center justify-center gap-1.5 text-body font-bold ${isReady ? 'text-success' : 'text-highlight'}`}>
                                                    {isReady ? <CheckIcon className="w-5 h-5" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                                                    <span>{isReady ? 'Ready' : 'Not Ready'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CrickIQCard>
                                );
                            })}
                            </div>
                        ) : (
                            <CrickIQCard  className="text-center">
                                <p className="text-text-secondary">No teams added to this tournament yet.</p>
                            </CrickIQCard>
                        )}
                    </div>
                )}
                {view === 'points' && selectedTournamentId && (
                    <PointsTable {...props} tournamentId={selectedTournamentId} />
                )}
                {view === 'stats' && selectedTournamentId && (
                    <Statistics {...props} tournamentId={selectedTournamentId} />
                )}
            </div>
            {confirmation && (
                <ConfirmationModal
                    onClose={() => setConfirmation(null)}
                    onConfirm={confirmation.onConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                    confirmText={confirmation.confirmText}
                    confirmVariant={confirmation.confirmVariant}
                />
            )}
            {tossMatch && tossMatchTeam1 && tossMatchTeam2 && (
                <TossModal
                    isOpen={!!tossMatch}
                    onClose={() => setTossMatch(null)}
                    onConfirm={handleConfirmToss}
                    team1={tossMatchTeam1}
                    team2={tossMatchTeam2}
                />
            )}
            {previewingTeam && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={() => setPreviewingTeam(null)}>
                    <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <CrickIQCard>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-h2 text-text-primary">Team Preview</h3>
                                <button onClick={() => setPreviewingTeam(null)} className="text-3xl leading-none text-text-secondary hover:text-text-primary">&times;</button>
                            </div>
                            <LineupPreview team={previewingTeam} playerStats={previewingTeamStats} />
                            <div className="mt-4 flex justify-end gap-2">
                                <Button 
                                    onClick={() => { setEditingTeamId(previewingTeam.id); setPreviewingTeam(null); }} 
                                    variant="secondary"
                                >
                                    <EditIcon /> Edit Team
                                </Button>
                            </div>
                        </CrickIQCard>
                    </div>
                </div>
            )}
            {editingTeamId && selectedTournamentId && getTeamById(editingTeamId) && (
                <TeamEditorModal 
                    team={getTeamById(editingTeamId)!}
                    tournamentId={selectedTournamentId}
                    addPlayerReplacement={addPlayerReplacement}
                    onClose={() => setEditingTeamId(null)}
                    isMatchLive={isMatchLive}
                    onDone={() => {
                        setEditingTeamId(null);
                    }}
                    {...props}
                />
            )}
            <EditMatchModal
                editingMatch={editingMatch}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                editTeam1Options={editTeam1Options}
                editTeam2Options={editTeam2Options}
                editError={editError}
                isEditFormValid={isEditFormValid}
                setEditingMatch={setEditingMatch}
                handleUpdateMatch={handleUpdateMatch}
            />
        </div>
    );
};

export default MatchManager;