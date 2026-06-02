import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrophyIcon, CalendarIcon, SparklesIcon, LockClosedIcon, LockOpenIcon, AnalyticsIcon, BallIcon } from './constants';
import TournamentManager from './components/TournamentManager';
import MatchManager from './components/MatchManager';
import MatchesView from './components/MatchesView';
import LiveScoring from './components/LiveScoring';
import { useCrickIQState } from './hooks/useCrickIQState';
import type { Match, Theme, FontSize, Team } from './types';
import SettingsModal from './components/SettingsModal';
import Home from './components/Home';
import { NotificationProvider, useNotification } from './hooks/useNotification';
import DynamicNotificationBar from './components/DynamicNotificationBar';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import MatchScorecard from './components/MatchScorecard';
import ConfirmationModal from './components/ConfirmationModal';
import TransitionLockOverlay from './components/TransitionLockOverlay';
import Drawer from './components/Drawer';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import AnalyticsWorkspace from './components/AnalyticsWorkspace';
import TossModal from './components/TossModal';
import MatchDetailsHub from './components/MatchDetailsHub';

interface DrinksBreakOverlayProps {
    status: 'selecting' | 'active';
    endTime: number | null;
    onSelectDuration: (minutes: number) => void;
    onStop: () => void;
    onCancel: () => void;
    isLocked: boolean;
    onToggleLock: () => void;
}

const DrinksBreakOverlay: React.FC<DrinksBreakOverlayProps> = ({
    status,
    endTime,
    onSelectDuration,
    onStop,
    onCancel,
    isLocked,
    onToggleLock,
}) => {
    const calculateRemainingTime = useCallback(() => {
        if (!endTime) return 0;
        return Math.max(0, Math.round((endTime - Date.now()) / 1000));
    }, [endTime]);

    const [remainingSeconds, setRemainingSeconds] = useState(calculateRemainingTime);

    useEffect(() => {
        if (status !== 'active' || !endTime) return;
        const interval = setInterval(() => {
            const newRemaining = calculateRemainingTime();
            if (newRemaining <= 0) {
                clearInterval(interval);
                onStop();
            } else {
                setRemainingSeconds(newRemaining);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [status, endTime, onStop, calculateRemainingTime]);

    // Selection View
    if (status === 'selecting') {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex flex-col justify-center items-center z-[200] text-white animate-fade-in p-4 safe-pad-t safe-pad-r safe-pad-b safe-pad-l">
                <svg className="w-24 h-24 text-blue-400 mb-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" opacity="0.3"/>
                    <path d="M12,4c-4.41,0-8,3.59-8,8s3.59,8,8,8s8-3.59,8-8S16.41,4,12,4z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z M11,7h2v6h-2V7z M11,15h2v2h-2V15z"/>
                </svg>
                <h1 className="text-4xl tracking-tight">DRINKS BREAK</h1>
                <p className="text-lg mb-4 mt-2 text-center">Select a duration to lock the app.</p>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    {[10, 20, 30].map(min => (
                        <button
                            key={min}
                            onClick={() => onSelectDuration(min)}
                            className="px-8 py-4 bg-white/20 hover:bg-white/30 rounded-2xl font-bold text-h3 transition-colors"
                        >
                            {min} MIN
                        </button>
                    ))}
                </div>
                <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">Cancel</button>
            </div>
        );
    }

    // Active Timer View
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex flex-col justify-center items-center z-[200] text-white animate-fade-in p-4 safe-pad-t safe-pad-r safe-pad-b safe-pad-l">
            <svg className="w-24 h-24 text-blue-400 mb-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" opacity="0.3"/>
                <path d="M12,4c-4.41,0-8,3.59-8,8s3.59,8,8,8s8-3.59,8-8S16.41,4,12,4z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z M11,7h2v6h-2V7z M11,15h2v2h-2V15z"/>
            </svg>
            <h1 className="text-4xl tracking-tight">DRINKS BREAK</h1>
            <p className="text-8xl font-mono my-6 [text-shadow:0_0_15px_rgba(255,255,255,0.3)]">{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</p>
            <div className="flex items-center gap-4">
                <button
                    onClick={onStop}
                    disabled={isLocked}
                    className="px-6 py-2 bg-red-500/80 hover:bg-red-500 rounded-2xl text-button text-white transition-all disabled:bg-gray-500/50 disabled:cursor-not-allowed"
                >
                    Stop Timer
                </button>
                <button
                    onClick={onToggleLock}
                    className="p-4 bg-white/20 hover:bg-white/30 rounded-2xl transition-colors"
                    title={isLocked ? 'Unlock Stop Button' : 'Lock Stop Button'}
                >
                    {isLocked ? <LockClosedIcon className="w-5 h-5" /> : <LockOpenIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

export interface ReturnLocation {
    activeTab?: string;
    selectedTournamentId?: string | null;
    isQuickMatchMode?: boolean;
    quickMatchSetupId?: string | null;
    matchManagerView?: string;
    matchType?: boolean;
}

const AppUI: React.FC = () => {
    const { showNotification } = useNotification();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const tournamentState = useCrickIQState();
    const [activeTab, setActiveTab] = useState('tournament');
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
    const [fontSize, setFontSize] = useState<FontSize>(() => (localStorage.getItem('fontSize') as FontSize) || 'standard');
    const [quickMatchSetupId, setQuickMatchSetupId] = useState<string | null>(null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [isQuickMatchMode, setIsQuickMatchMode] = useState(false);
    const [viewingScorecardMatchId, setViewingScorecardMatchId] = useState<string | null>(null);
    const [viewingMatchHubId, setViewingMatchHubId] = useState<string | null>(null);
    const [matchHubReturnLocation, setMatchHubReturnLocation] = useState<{
        activeTab: string;
        selectedTournamentId: string | null;
        isQuickMatchMode: boolean;
        quickMatchSetupId?: string | null;
        matchManagerView?: string;
        matchType?: boolean;
    } | null>(null);

    const openMatchHub = (matchId: string, returnLocation?: Record<string, unknown>) => {
        const match = tournamentState.matches.find(m => m.id === matchId);
        if (!match) {
            console.error('Match not found');
            return;
        }

        const team1 = tournamentState.getTeamById(match.team1Id);
        const team2 = tournamentState.getTeamById(match.team2Id);
        if (!team1 || !team2) {
            console.error('Teams not found');
            return;
        }

        if (!match.isQuickMatch) {
            if (!match.tournamentId) {
                console.error('Tournament match must have a tournamentId');
                return;
            }
            const tournament = tournamentState.getTournamentById(match.tournamentId);
            if (!tournament) {
                console.error('Tournament not found');
                return;
            }
        }

        setMatchHubReturnLocation({
            activeTab,
            selectedTournamentId,
            isQuickMatchMode,
            quickMatchSetupId,
            ...(returnLocation || {})
        });
        setViewingMatchHubId(matchId);
    };

    useEffect(() => {
        if (!viewingMatchHubId && matchHubReturnLocation !== null) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMatchHubReturnLocation(null);
        }
    }, [viewingMatchHubId, matchHubReturnLocation]);

    const closeMatchHub = () => {
        if (matchHubReturnLocation) {
            setActiveTab(matchHubReturnLocation.activeTab);
            if (matchHubReturnLocation.selectedTournamentId !== undefined) {
                setSelectedTournamentId(matchHubReturnLocation.selectedTournamentId);
            }
            if (matchHubReturnLocation.isQuickMatchMode !== undefined) {
                setIsQuickMatchMode(matchHubReturnLocation.isQuickMatchMode);
            }
            if (matchHubReturnLocation.quickMatchSetupId !== undefined) {
                setQuickMatchSetupId(matchHubReturnLocation.quickMatchSetupId);
            }
        } else {
            setActiveTab('tournament');
        }
        setViewingMatchHubId(null);
    };

    const [isJustFinished, setIsJustFinished] = useState(false);
    const [startRematchWithToss, setStartRematchWithToss] = useState(false);
    const [confirmation, setConfirmation] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; confirmText?: string; confirmVariant?: 'danger' | 'primary'; } | null>(null);

    const [tossMatch, setTossMatch] = useState<Match | null>(null);

    const handleTossConfirm = (winnerId: string, decision: 'bat' | 'bowl') => {
        if (tossMatch) {
            tournamentState.setTossForMatch(tossMatch.id, winnerId, decision);
            setTossMatch(null);
        }
    };

    const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('notificationsEnabled') === 'true');
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => 
        (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'default'
    );

    useNotificationScheduler(tournamentState.matches, tournamentState.getTeamById, notificationsEnabled);
    
    const handleToggleNotifications = async () => {
        if (!('Notification' in window)) {
            showNotification('This browser does not support notifications.', 'error');
            return;
        }

        if (notificationPermission === 'denied') {
            showNotification('Permissions are blocked in your browser settings.', 'error');
            return;
        }

        if (notificationPermission === 'default') {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                localStorage.setItem('notificationsEnabled', 'true');
                setNotificationsEnabled(true);
                showNotification('Match reminders enabled!', 'success');
            } else {
                showNotification('Notification permissions were not granted.', 'info');
            }
        } else if (notificationPermission === 'granted') {
            const newIsEnabled = !notificationsEnabled;
            localStorage.setItem('notificationsEnabled', String(newIsEnabled));
            setNotificationsEnabled(newIsEnabled);
            showNotification(`Match reminders ${newIsEnabled ? 'enabled' : 'disabled'}.`, 'info');
        }
    };


    type DrinksBreakStatus = 'idle' | 'selecting' | 'active';
    const [drinksBreakStatus, setDrinksBreakStatus] = useState<DrinksBreakStatus>('idle');
    const [drinksBreakEndTime, setDrinksBreakEndTime] = useState<number | null>(null);
    const [isTimerStopLocked, setIsTimerStopLocked] = useState(true);

    const liveQuickMatch = useMemo(() => tournamentState.matches.find(m => m.status === 'live' && m.isQuickMatch), [tournamentState.matches]);
    const liveTournamentMatch = useMemo(() => tournamentState.matches.find(m => m.status === 'live' && !m.isQuickMatch), [tournamentState.matches]);
    
    // This is for action locking (deleting teams/matches) - true ONLY if a match is actively live.
    const isMatchActuallyLive = useMemo(() => tournamentState.matches.some(m => m.status === 'live'), [tournamentState.matches]);

    const navItems = useMemo(() => {
        const items = [
            { id: 'tournament', label: 'Home', icon: <TrophyIcon /> },
            { id: 'all-matches', label: 'Matches', icon: <BallIcon /> },
            { id: 'matches', label: 'Tournaments', icon: <CalendarIcon /> },
            { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
        ];
        
        const isLiveMatch = liveQuickMatch || liveTournamentMatch;
        const isViewingCompletedMatch = selectedMatch?.status === 'completed';

        if (isLiveMatch || isViewingCompletedMatch) {
            items.push({ id: 'live', label: 'Live', icon: <SparklesIcon /> });
        }
        return items;
    }, [liveQuickMatch, liveTournamentMatch, selectedMatch]);

    const handleNavigate = (tabId: string) => {
        if (isMatchActuallyLive && activeTab === 'live' && tabId !== 'live') {
            setConfirmation({
                title: 'Exit Live Scoring?',
                message: 'Are you sure you want to leave the live match? Your progress is saved.',
                onConfirm: () => {
                    setActiveTab(tabId);
                    setConfirmation(null);
                    // Reset quick match mode if navigating away from live quick match to tournament
                    if (tabId === 'tournament' && !quickMatchSetupId && !liveQuickMatch) {
                        setIsQuickMatchMode(false);
                    }
                    // Reset tournament selection if navigating away from matches
                    if (tabId !== 'matches') {
                        setSelectedTournamentId(null);
                    }
                },
                confirmText: 'Exit',
                confirmVariant: 'danger',
            });
        } else {
            setActiveTab(tabId);
            // Reset quick match mode if navigating away from live quick match to tournament
            if (tabId === 'tournament' && !quickMatchSetupId && !liveQuickMatch) {
                setIsQuickMatchMode(false);
            }
            // Reset tournament selection if navigating away from matches
            if (tabId !== 'matches') {
                setSelectedTournamentId(null);
            }
        }
    };


    useEffect(() => {
        // This resets the UI after a user cancels a quick match setup flow.
        if (activeTab === 'tournament' && !quickMatchSetupId && !liveQuickMatch && isQuickMatchMode) {
            const timeoutId = setTimeout(() => setIsQuickMatchMode(false), 0);
            return () => clearTimeout(timeoutId);
        }
    }, [activeTab, quickMatchSetupId, liveQuickMatch, isQuickMatchMode]);

    useEffect(() => {
        const root = window.document.documentElement;
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = (themeValue: Theme) => {
            localStorage.setItem('theme', themeValue);
            if (themeValue === 'light') {
                root.classList.remove('dark');
            } else if (themeValue === 'dark') {
                root.classList.add('dark');
            } else { // system
                if (systemPrefersDark.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        applyTheme(theme);

        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                if (e.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        systemPrefersDark.addEventListener('change', handleSystemThemeChange);

        return () => {
            systemPrefersDark.removeEventListener('change', handleSystemThemeChange);
        };

    }, [theme]);
    
    useEffect(() => {
        const root = window.document.documentElement;
        localStorage.setItem('fontSize', fontSize);
        root.classList.remove('font-size-small', 'font-size-medium', 'font-size-standard');
        root.classList.add(`font-size-${fontSize}`);
    }, [fontSize]);
    
    useEffect(() => {
        if (activeTab === 'live') {
            const currentMatch = tournamentState.matches.find(m => m.id === selectedMatch?.id);
            if (!currentMatch || (currentMatch.status !== 'live' && currentMatch.status !== 'completed')) {
                const timeoutId = setTimeout(() => setActiveTab(isQuickMatchMode ? 'tournament' : 'matches'), 0);
                return () => clearTimeout(timeoutId);
            }
        } else if (selectedMatch?.status === 'completed' && selectedMatch?.isQuickMatch && !isQuickMatchMode) {
            // If user has exited Quick Match mode, clear any lingering selected quick match
            const timeoutId = setTimeout(() => {
                setSelectedMatch(null);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [activeTab, selectedMatch?.id, selectedMatch?.status, selectedMatch?.isQuickMatch, tournamentState.matches, isQuickMatchMode]);
    
    // Removed redundant useEffect that cleared selectedTournamentId on tab change,
    // as it's now handled in handleNavigate.

    const clearQuickMatchSetup = () => {
        setQuickMatchSetupId(null);
        setStartRematchWithToss(false);
    };

    const handleStartMatch = (match: Match) => {
        if (match.isQuickMatch) {
            setIsQuickMatchMode(true);
            clearQuickMatchSetup();
        } else {
            setIsQuickMatchMode(false);
        }
        tournamentState.startMatch(match.id);
        setSelectedMatch(match);
        setActiveTab('live');
        showNotification("Match started!", 'success');
    };
    
    const handleContinueMatch = (match: Match) => {
        if (match.isQuickMatch) {
            setIsQuickMatchMode(true);
        } else {
            setIsQuickMatchMode(false);
        }
        setSelectedMatch(match);
        setActiveTab('live');
    };

    const handleEndMatch = () => {
        if (selectedMatch) {
            const matchId = selectedMatch.id;
            tournamentState.endMatch(matchId);
            setViewingScorecardMatchId(matchId);
            setIsJustFinished(true);
            setSelectedMatch(null);
        }
    }

    const handleAddQuickMatch = (team1Data: string | Team, team2Data: string | Team, overs: number, numberOfPlayers: number, maxOversPerBowler?: number) => {
        const { matchId } = tournamentState.addQuickMatch(team1Data, team2Data, overs, numberOfPlayers, maxOversPerBowler, undefined, true);
        setIsQuickMatchMode(true);
        setQuickMatchSetupId(matchId);
        setActiveTab('tournament');
    };

    const handleRematch = (matchId: string) => {
        const newMatch = tournamentState.createRematch(matchId);
        if (newMatch) {
            setIsQuickMatchMode(true);
            setQuickMatchSetupId(newMatch.id);
            setStartRematchWithToss(true);
            setActiveTab('tournament');
        }
    };

    const handleEditMatch = (match: Match) => {
        if (match.isQuickMatch) {
            setIsQuickMatchMode(true);
            setQuickMatchSetupId(match.id);
            setActiveTab('tournament'); // Navigates to Home -> QuickMatchSetup
        } else if (match.tournamentId) {
            setSelectedTournamentId(match.tournamentId);
            setActiveTab('matches'); // Navigates to Tournament details where editing happens
        }
    };

    const handleStartDrinksBreak = () => {
        setDrinksBreakStatus('selecting');
        showNotification("Select drinks break duration", 'info');
    };

    const handleSelectDrinksDuration = (minutes: number) => {
        const DURATION = minutes * 60 * 1000;
        setDrinksBreakEndTime(Date.now() + DURATION);
        setDrinksBreakStatus('active');
        setIsTimerStopLocked(true); // Always re-lock when a new timer starts
        showNotification(`Drinks Break: ${minutes} minutes`, 'info');
    };

    const handleStopDrinksBreak = () => {
        setDrinksBreakEndTime(null);
        setDrinksBreakStatus('idle');
    };

    const handleToggleTimerLock = () => {
        setIsTimerStopLocked(prev => !prev);
    };

    const handleLogin = () => setIsAuthenticated(true);
    const handleGuest = () => setIsAuthenticated(true);
    const handleLogout = () => {
        setIsAuthenticated(false);
        setIsQuickMatchMode(false);
    };

    const handleViewTournament = (tournamentId: string) => {
        setIsQuickMatchMode(false);
        setQuickMatchSetupId(null);
        setSelectedTournamentId(tournamentId);
        setActiveTab('matches');
    };

    const handleBackToTournaments = () => {
        setSelectedTournamentId(null);
    };
    
    const handleViewScorecard = (matchId: string) => {
        setViewingScorecardMatchId(matchId);
        setIsJustFinished(false);
    };

    const handleTournamentCreated = () => {
        setActiveTab('matches');
    };

    const handleBackFromLive = useCallback(() => {
        if (selectedMatch?.isQuickMatch) {
            setActiveTab('tournament');
        } else {
            setActiveTab('matches');
        }
    }, [selectedMatch]);

    const scorecardMatchToView = useMemo(() => {
        if (!viewingScorecardMatchId) return null;
        return tournamentState.matches.find(m => m.id === viewingScorecardMatchId);
    }, [viewingScorecardMatchId, tournamentState.matches]);

    const tournamentForScorecard = useMemo(() => {
        if (!scorecardMatchToView) return null;
        return tournamentState.getTournamentById(scorecardMatchToView.tournamentId);
    }, [scorecardMatchToView, tournamentState]);

    const hubMatchToView = useMemo(() => {
        if (!viewingMatchHubId) return null;
        return tournamentState.matches.find(m => m.id === viewingMatchHubId);
    }, [viewingMatchHubId, tournamentState.matches]);

    const tournamentForHub = useMemo(() => {
        if (!hubMatchToView || !hubMatchToView.tournamentId) return undefined;
        return tournamentState.getTournamentById(hubMatchToView.tournamentId);
    }, [hubMatchToView, tournamentState]);

    useEffect(() => {
        // If we are viewing a scorecard, but the match is no longer 'completed' (e.g., after an undo),
        // then we should navigate away from the scorecard and back to the live match.
        if (scorecardMatchToView && scorecardMatchToView.status !== 'completed') {
            const matchToContinue = { ...scorecardMatchToView };
            const timeoutId = setTimeout(() => {
                setViewingScorecardMatchId(null);
                setIsJustFinished(false);
                handleContinueMatch(matchToContinue);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [scorecardMatchToView]);

    const handleCloseScorecard = () => {
        const match = scorecardMatchToView;
        setViewingScorecardMatchId(null);
        setIsJustFinished(false);
        if (match && match.status === 'completed') {
            if (match.isQuickMatch) {
                setActiveTab('tournament');
            } else {
                setActiveTab('matches');
                setSelectedTournamentId(null);
            }
        }
    };

    const TAB_THEMES: { [key: string]: string } = {
        tournament: 'theme-purple',
        matches: 'theme-orange',
        points: 'theme-blue',
        stats: 'theme-green',
        live: 'theme-blue',
        scheduler: 'theme-green',
        semifinals: 'theme-orange',
        final: 'theme-orange',
    };

    const currentThemeClass = TAB_THEMES[activeTab] || 'theme-purple';

    if (tournamentState.isHydrating) {
        return (
            <div className={`h-screen flex items-center justify-center font-sans ${currentThemeClass}`}>
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-12 w-12 text-brand-blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h2 className="text-h2 text-text-primary">Loading CrickIQ...</h2>
                </div>
            </div>
        );
    }

    if (scorecardMatchToView && tournamentForScorecard) {
        return (
            <div className="theme-blue h-screen w-full">
                <ErrorBoundary componentName="Match Scorecard" onReset={handleCloseScorecard}>
                    <MatchScorecard
                        match={scorecardMatchToView}
                        tournament={tournamentForScorecard}
                        onClose={handleCloseScorecard}
                        teams={tournamentState.teams}
                        setManOfTheMatch={tournamentState.setManOfTheMatch}
                        onUndo={isJustFinished ? tournamentState.undoLastBall : undefined}
                    />
                </ErrorBoundary>
            </div>
        );
    }
    
    if (hubMatchToView) {
        const team1 = tournamentState.getTeamById(hubMatchToView.team1Id);
        const team2 = tournamentState.getTeamById(hubMatchToView.team2Id);
        if (team1 && team2) {
            return (
                <div className="theme-blue h-screen w-full">
                    <ErrorBoundary componentName="Match Details Hub" onReset={closeMatchHub}>
                        <MatchDetailsHub
                            match={hubMatchToView}
                            team1={team1}
                            team2={team2}
                            tournament={tournamentForHub}
                            teams={tournamentState.teams}
                            onBack={closeMatchHub}
                            setManOfTheMatch={tournamentState.setManOfTheMatch}
                            onStartMatch={(m) => { closeMatchHub(); handleStartMatch(m); }}
                            onContinueMatch={(m) => { closeMatchHub(); handleContinueMatch(m); }}
                            onSetToss={(m) => { closeMatchHub(); setTossMatch(m); }}
                            onEditMatch={(m) => { closeMatchHub(); handleEditMatch(m); }}
                            isMatchLive={isMatchActuallyLive}
                            updateTeam={tournamentState.updateTeam}
                            addPlayerReplacement={tournamentState.addPlayerReplacement}
                            addPlayer={tournamentState.addPlayer}
                            deletePlayer={tournamentState.deletePlayer}
                            getTournamentById={tournamentState.getTournamentById}
                            matches={tournamentState.matches}
                        />
                    </ErrorBoundary>
                </div>
            );
        }
    }

    if (!isAuthenticated) {
        return <Home onLogin={handleLogin} onGuest={handleGuest} />;
    }

    
    const getScreenTitle = () => {
        if (selectedTournamentId) {
            const t = tournamentState.tournaments.find(t => t.id === selectedTournamentId);
            return t ? t.name : "Tournament";
        }
        if (activeTab === 'tournament') {
            if (quickMatchSetupId) return "Setup Match";
            return "Home";
        }
        if (activeTab === 'matches') return "Tournaments";
        if (activeTab === 'analytics') return "Analytics Hub";
        if (activeTab === 'live') {
            return selectedMatch?.status === 'completed' ? "Match Result" : "Live Match";
        }
        return "CrickIQ";
    };
    
    const renderContent = () => {
        switch (activeTab) {
            case 'all-matches':
                return (
                    <ErrorBoundary componentName="All Matches" onReset={() => { setActiveTab('tournament'); }}>
                        <MatchesView 
                            matches={tournamentState.matches}
                            today={new Date()}
                            getTeamById={tournamentState.getTeamById}
                            getTournamentById={tournamentState.getTournamentById}
                            isMatchLive={isMatchActuallyLive}
                            handleShareMatch={() => { }} // Need to pass or implement
                            handleDeleteMatch={(id) => tournamentState.deleteMatch(id)}
                            onStartMatch={(match) => handleStartMatch(match)}
                            onContinueMatch={(match) => handleContinueMatch(match)}
                            onViewMatchResult={(matchId) => handleViewScorecard(matchId)}
                            setTossMatch={setTossMatch}
                            setEditingMatch={handleEditMatch}
                            onOpenMatchHub={openMatchHub}
                            initialMatchType={matchHubReturnLocation?.matchType}
                        />
                    </ErrorBoundary>
                );
            case 'matches':
                return (
                    <ErrorBoundary componentName="Tournaments & Matches" onReset={() => { setActiveTab('tournament'); setSelectedTournamentId(null); }}>
                        <MatchManager 
                            key={selectedTournamentId || 'all'}
                            {...tournamentState} 
                            onStartMatch={handleStartMatch} 
                            onContinueMatch={handleContinueMatch} 
                            isMatchLive={isMatchActuallyLive}
                            selectedTournamentId={selectedTournamentId}
                            onBack={handleBackToTournaments}
                            onViewTournament={handleViewTournament}
                            onViewMatchResult={handleViewScorecard}
                            onOpenMatchHub={openMatchHub}
                            initialView={matchHubReturnLocation?.matchManagerView}
                        />
                    </ErrorBoundary>
                );
            case 'analytics':
                return (
                    <ErrorBoundary componentName="Analytics" onReset={() => setActiveTab('tournament')}>
                        <AnalyticsWorkspace {...tournamentState} />
                    </ErrorBoundary>
                );
            case 'live': {
                const currentMatch = tournamentState.matches.find(m => m.id === selectedMatch?.id);
                if (currentMatch && (currentMatch.status === 'live' || currentMatch.status === 'completed')) {
                    return (
                        <ErrorBoundary componentName="Live Scoring" onReset={() => setActiveTab('tournament')}>
                            <LiveScoring match={currentMatch} onEndMatch={handleEndMatch} onStartDrinksBreak={handleStartDrinksBreak} onBack={handleBackFromLive} {...tournamentState} />
                        </ErrorBoundary>
                    );
                }
                return <div className="p-4">Loading match...</div>;
            }
            default: // falls through
            case 'tournament':
                return (
                    <ErrorBoundary componentName="Home / Setup">
                        <TournamentManager
                            {...tournamentState}
                            isMatchLive={isMatchActuallyLive}
                            liveQuickMatch={liveQuickMatch}
                            liveTournamentMatch={liveTournamentMatch}
                            onAddQuickMatch={handleAddQuickMatch}
                            onContinueMatch={handleContinueMatch}
                            onAbandonMatch={tournamentState.abandonMatch}
                            quickMatchSetupId={quickMatchSetupId}
                            setQuickMatchSetupId={setQuickMatchSetupId}
                            onClearQuickMatchSetup={clearQuickMatchSetup}
                            onStartMatch={handleStartMatch}
                             onViewQuickMatchResult={handleViewScorecard}
                             onTournamentCreated={handleTournamentCreated}
                             onRematch={handleRematch}
                             startRematchWithToss={startRematchWithToss}
                             onOpenMatchHub={openMatchHub}
                        />
                    </ErrorBoundary>
                );
        }
    };
    
    return (
        <>
            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
            <TransitionLockOverlay />
            <DynamicNotificationBar />
            {drinksBreakStatus !== 'idle' && (
                <DrinksBreakOverlay
                    status={drinksBreakStatus}
                    endTime={drinksBreakEndTime}
                    onSelectDuration={handleSelectDrinksDuration}
                    onStop={handleStopDrinksBreak}
                    onCancel={() => setDrinksBreakStatus('idle')}
                    isLocked={isTimerStopLocked}
                    onToggleLock={handleToggleTimerLock}
                />
            )}
            <div className={`h-screen flex flex-col font-sans ${currentThemeClass} safe-pad-b safe-pad-l safe-pad-r`}>
                <Header 
                    title={getScreenTitle()}
                    showMenu={!quickMatchSetupId && activeTab !== 'live' && !selectedTournamentId}
                    onMenuClick={() => setIsDrawerOpen(true)}
                    showBack={!!quickMatchSetupId || activeTab === 'live' || !!selectedTournamentId}
                    onBackClick={() => {
                        if (quickMatchSetupId) clearQuickMatchSetup();
                        else if (activeTab === 'live') handleBackFromLive();
                        else if (selectedTournamentId) handleBackToTournaments();
                    }}
                    showSettings={!quickMatchSetupId && activeTab !== 'live' && !selectedTournamentId}
                    onSettingsClick={() => setIsSettingsOpen(true)}
                    showLogout={!quickMatchSetupId && activeTab !== 'live' && !selectedTournamentId}
                    onLogoutClick={handleLogout}
                />
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Desktop Sidebar */}
                    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-brand-blue/10 p-4 space-y-6">
                        <nav className="flex-grow space-y-2 mt-2">
                            {navItems.map(item => {
                                const isActive = activeTab === item.id;
                                return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigate(item.id)}
                                    className={`w-full px-4 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                                        isActive ? 'text-brand-blue bg-brand-blue/10 dark:bg-brand-blue/20' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <span className="text-[15px]">{item.label}</span>
                                </button>
                                );
                            })}
                        </nav>
                    </aside>
                
                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="container mx-auto px-4 pb-24 md:pb-4 flex-grow overflow-y-auto no-scrollbar min-h-0">
    
    
                        {renderContent()}
                    </main>

                    {/* Mobile Bottom Navigation */}
                    <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-secondary/95 backdrop-blur-md border-t border-black/5 dark:border-white/5 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-40 safe-pad-b safe-pad-l safe-pad-r rounded-t-3xl">
                        <nav className="flex justify-around items-center h-[72px]">
                            {navItems.map(item => {
                                const isActive = activeTab === item.id;
                                return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigate(item.id)}
                                    className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                                        isActive ? 'text-brand-blue' : 'text-text-secondary'
                                    }`}
                                >
                                    <div className="flex items-center justify-center mb-1">
                                        {item.icon}
                                    </div>
                                    <span className="text-[13px] font-medium leading-none">{item.label}</span>
                                </button>
                                );
                            })}
                        </nav>
                    </footer>
                </div>
            </div>

            {isSettingsOpen && (
                    <SettingsModal
                        onClose={() => setIsSettingsOpen(false)}
                        currentTheme={theme}
                        setTheme={setTheme}
                        currentFontSize={fontSize}
                        setFontSize={setFontSize}
                        notificationsEnabled={notificationsEnabled}
                        onToggleNotifications={handleToggleNotifications}
                        notificationPermission={notificationPermission}
                        data={{
                            tournaments: tournamentState.tournaments,
                            teams: tournamentState.teams,
                            matches: tournamentState.matches
                        }}
                        onRestore={tournamentState.exportImport.restoreData}
                    />
                )}

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

                {tossMatch && (
                    <TossModal
                        isOpen={!!tossMatch}
                        onClose={() => setTossMatch(null)}
                        onConfirm={handleTossConfirm}
                        team1={{ id: tossMatch.team1Id, name: tournamentState.getTeamById(tossMatch.team1Id)?.name || 'Team 1' }}
                        team2={{ id: tossMatch.team2Id, name: tournamentState.getTeamById(tossMatch.team2Id)?.name || 'Team 2' }}
                    />
                )}
            </div>
        </>
    );
};


const App: React.FC = () => {
    return (
        <NotificationProvider>
            <AppUI />
        </NotificationProvider>
    );
};

export default App;