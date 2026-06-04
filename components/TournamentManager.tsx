import CrickIQCard from './CrickIQCard';
import React, { useState, useMemo } from 'react';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { Team, Match } from '../types';
import { LightningBoltIcon } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import QuickMatchSetup from './QuickMatchSetup';
import { useNotification } from '../hooks/useNotification';
import QuickMatchHistory from './QuickMatchHistory';
import { Plus, Minus } from 'lucide-react';
import { validateQuickMatch } from '../utils/validation';


const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'blue' }> = ({ children, className = '', variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses = variant === 'secondary' ? 'bg-brand-lightblue text-white border-0' : variant === 'blue' ? 'bg-brand-blue text-white border-0' : 'bg-brand-gradient text-white border-0'; // primary

    return <button {...props} className={`${baseClasses} ${variantClasses} ${className}`}>{children}</button>
};

const getLiveMatchSummary = (match: Match | undefined, teams: Team[]) => {
    if (!match) return null;

    const currentInnings = match.innings2 || match.innings1;
    if (!currentInnings) return null;

    const battingTeam = teams.find(t => t.id === currentInnings.battingTeamId);
    const bowlingTeam = teams.find(t => t.id === currentInnings.bowlingTeamId);
    if (!battingTeam || !bowlingTeam) return null;

    const onStrikeId = currentInnings.currentBatsmen[0];
    const nonStrikerId = currentInnings.currentBatsmen[1];
    const currentBowlerId = currentInnings.currentBowler;

    const onStrikePlayer = onStrikeId ? battingTeam.players.find(p => p.id === onStrikeId) : null;
    const nonStrikerPlayer = nonStrikerId ? battingTeam.players.find(p => p.id === nonStrikerId) : null;
    const bowlerPlayer = currentBowlerId ? bowlingTeam.players.find(p => p.id === currentBowlerId) : null;
    
    const onStrikeStats = onStrikeId ? currentInnings.batsmanScores[onStrikeId] : null;
    const nonStrikerStats = nonStrikerId ? currentInnings.batsmanScores[nonStrikerId] : null;
    const bowlerStats = currentBowlerId ? currentInnings.bowlerScores[currentBowlerId] : null;

    return {
        battingTeam,
        bowlingTeam,
        score: currentInnings.score,
        wickets: currentInnings.wickets,
        overs: currentInnings.overs,
        onStrike: onStrikePlayer && onStrikeStats ? { ...onStrikePlayer, ...onStrikeStats } : null,
        nonStriker: nonStrikerPlayer && nonStrikerStats ? { ...nonStrikerPlayer, ...nonStrikerStats } : null,
        bowler: bowlerPlayer && bowlerStats ? { ...bowlerPlayer, ...bowlerStats } : null,
    };
};


interface TournamentManagerProps extends UseCrickIQStateReturn {
    isMatchLive: boolean;
    liveQuickMatch: Match | undefined;
    liveTournamentMatch: Match | undefined;
    onAddQuickMatch: (team1Data: string | Team, team2Data: string | Team, overs: number, numberOfPlayers: number, maxOversPerBowler?: number) => void;
    onContinueMatch: (match: Match) => void;
    onAbandonMatch: (matchId: string) => void;
    quickMatchSetupId: string | null;
    setQuickMatchSetupId: (id: string | null) => void;
    onClearQuickMatchSetup: () => void;
    onStartMatch: (match: Match) => void;
    onViewQuickMatchResult: (matchId: string) => void;
    onTournamentCreated: () => void;
    onRematch: (matchId: string) => void;
    startRematchWithToss?: boolean;
    onOpenMatchHub: (matchId: string, returnLocation?: Record<string, unknown>) => void;
}


const TournamentManager: React.FC<TournamentManagerProps> = (props) => {
    const {
        teams,
        matches,
        liveQuickMatch,
        liveTournamentMatch,
        onAddQuickMatch,
        onContinueMatch,
        onAbandonMatch,
        quickMatchSetupId,
        setQuickMatchSetupId,
        onClearQuickMatchSetup,
        onStartMatch,
        onViewQuickMatchResult,
        onRematch,
        startRematchWithToss,
        onOpenMatchHub
    } = props;
    const [quickTeam1, setQuickTeam1] = useState('');
    const [quickTeam2, setQuickTeam2] = useState('');
    const [quickOvers, setQuickOvers] = useState<number | ''>(5);
    const [quickMaxOvers, setQuickMaxOvers] = useState<number | ''>(2);
    const [quickPlayers, setQuickPlayers] = useState<number | ''>(8);
    const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
    const { showNotification } = useNotification();
    const [homeView, setHomeView] = useState<'quickMatches'>('quickMatches');

    const [selectedTeam1, setSelectedTeam1] = useState<Team | null>(null);
    const [selectedTeam2, setSelectedTeam2] = useState<Team | null>(null);
    const [suggestions, setSuggestions] = useState<Team[]>([]);
    const [activeSuggestionBox, setActiveSuggestionBox] = useState<'team1' | 'team2' | null>(null);

    // State for swipe gestures


    const quickMatchHistoryTeams = useMemo(() => {
        const allTeams = teams;
        const uniqueTeams: Team[] = [];
        const teamNames = new Set<string>();
        [...allTeams].reverse().forEach(team => {
            if (!teamNames.has(team.name)) {
                uniqueTeams.push(team);
                teamNames.add(team.name);
            }
        });

        return uniqueTeams.sort((a,b) => a.name.localeCompare(b.name));
    }, [teams]);

    const handleTeam1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuickTeam1(value);
        setSelectedTeam1(null); 
        if (value) {
            const filtered = quickMatchHistoryTeams.filter(team => 
                team.name.toLowerCase().includes(value.toLowerCase()) && team.name !== quickTeam2
            );
            setSuggestions(filtered);
            if (filtered.length > 0) setActiveSuggestionBox('team1');
            else setActiveSuggestionBox(null);
        } else {
            setSuggestions([]);
            setActiveSuggestionBox(null);
        }
    };
    
    const handleSelectSuggestion1 = (team: Team) => {
        setQuickTeam1(team.name);
        setSelectedTeam1(team);
        setActiveSuggestionBox(null);
    };

    const handleTeam2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuickTeam2(value);
        setSelectedTeam2(null);
        if (value) {
            const filtered = quickMatchHistoryTeams.filter(team => 
                team.name.toLowerCase().includes(value.toLowerCase()) && team.name !== quickTeam1
            );
            setSuggestions(filtered);
            if (filtered.length > 0) setActiveSuggestionBox('team2');
            else setActiveSuggestionBox(null);
        } else {
            setSuggestions([]);
            setActiveSuggestionBox(null);
        }
    };

    const handleSelectSuggestion2 = (team: Team) => {
        setQuickTeam2(team.name);
        setSelectedTeam2(team);
        setActiveSuggestionBox(null);
    };

    const quickMatch = useMemo(() => {
        if (!quickMatchSetupId) return null;
        return matches.find(m => m.id === quickMatchSetupId);
    }, [quickMatchSetupId, matches]);
    

    const liveMatchSummary = useMemo(() => getLiveMatchSummary(liveQuickMatch, teams), [liveQuickMatch, teams]);

    const handleQuickPlayersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.value === '') {
            setQuickPlayers('');
            return;
        }
        let num = parseInt(e.target.value, 10);
        if (isNaN(num)) {
            setQuickPlayers('');
            return;
        }
        if (num > 11) {
            showNotification('Max 11 players per team.', 'error');
            num = 11;
        }
        setQuickPlayers(num);
    };

    const [isSubmittingQuickMatch, setIsSubmittingQuickMatch] = useState(false);
    const [isQuickMatchExpanded, setIsQuickMatchExpanded] = useState(true);

    const handleAddQuickMatch = () => {
        if (isSubmittingQuickMatch) return;

        const validation = validateQuickMatch(
            quickTeam1,
            quickTeam2,
            quickOvers,
            quickPlayers,
            quickMaxOvers
        );
        
        if (!validation.valid) {
            showNotification(validation.message || 'Invalid input.', 'error');
            return;
        }
        
        const overs = Number(quickOvers);
        const players = Number(quickPlayers);

        setIsSubmittingQuickMatch(true);

        const team1Data = selectedTeam1 && selectedTeam1.name === quickTeam1.trim() ? selectedTeam1 : quickTeam1.trim();
        const team2Data = selectedTeam2 && selectedTeam2.name === quickTeam2.trim() ? selectedTeam2 : quickTeam2.trim();

        const maxOvers = quickMaxOvers ? Number(quickMaxOvers) : undefined;
        onAddQuickMatch(team1Data, team2Data, overs, players, maxOvers);
        setQuickTeam1('');
        setQuickTeam2('');
        setQuickOvers(5);
        setQuickMaxOvers(2);
        setQuickPlayers(8);
        setSelectedTeam1(null);
        setSelectedTeam2(null);
        setActiveSuggestionBox(null);
        
        setTimeout(() => setIsSubmittingQuickMatch(false), 500);
    };
    


    if (quickMatchSetupId && quickMatch) {
        return <QuickMatchSetup 
                    {...props}
                    match={quickMatch} 
                    onCancel={onClearQuickMatchSetup} 
                    onStartMatch={onStartMatch}
                    startWithToss={startRematchWithToss}
                />;
    }

    return (
        <div className="space-y-6">
            
            <div className="border-b border-brand-blue/15 flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
                <button
                    onClick={() => setHomeView('quickMatches')}
                    className={`py-2 px-1 font-bold transition-colors duration-300 text-body flex-shrink-0 ${homeView === 'quickMatches' ? 'border-b-2 border-brand-blue text-brand-blue dark:text-white dark:border-brand-blue' : 'border-b-2 border-transparent text-text-secondary dark:text-gray-300 hover:text-text-primary'}`}
                >
                    Create
                </button>
            </div>
            
            <div>

                {homeView === 'quickMatches' && (
                    <div className="space-y-6 animate-fade-in">
                        <CrickIQCard  className="flex flex-col">
                            <div className="flex justify-between items-center">
                                <h3 className="text-h3 text-text-primary flex items-center gap-2">
                                    <LightningBoltIcon className="w-5 h-5" /> Quick Match
                                </h3>
                                <div className="flex items-center gap-2">
                                    {liveQuickMatch && (
                                         <span className="text-xs font-bold text-success bg-success/20 dark:bg-green-900/30 px-2 py-1 rounded-2xl animate-pulse">
                                            Live
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setIsQuickMatchExpanded(!isQuickMatchExpanded)}
                                        className="p-1 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                                        title={isQuickMatchExpanded ? 'Collapse' : 'Expand'}
                                    >
                                        {isQuickMatchExpanded ? <Minus className="w-5 h-5 text-text-secondary" /> : <Plus className="w-5 h-5 text-text-secondary" />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className={`grid transition-all duration-300 ease-in-out ${isQuickMatchExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                <div className="overflow-hidden flex flex-col">
                                    {liveQuickMatch ? (
                                        <div className="flex flex-col flex-grow">
                                            {liveMatchSummary ? (
                                                <div className="space-y-4 text-body flex-grow">
                                                    <div className="text-center bg-primary/50 p-2 rounded-lg">
                                                        <p className="text-xs font-semibold text-text-secondary">{liveMatchSummary.battingTeam.name} Batting</p>
                                                        <p className="text-3xl text-brand-blue">{liveMatchSummary.score}-{liveMatchSummary.wickets}</p>
                                                        <p className="text-sm font-bold text-text-secondary">Overs: {liveMatchSummary.overs}</p>
                                                    </div>
                                                    
                                                    <div className="space-y-1">
                                                        {liveMatchSummary.onStrike && (
                                                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center">
                                                                <span className="truncate font-semibold">{liveMatchSummary.onStrike.name}*</span>
                                                                <span className="font-bold text-brand-blue">{liveMatchSummary.onStrike.runs}</span>
                                                                <span className="text-text-secondary">({liveMatchSummary.onStrike.balls})</span>
                                                            </div>
                                                        )}
                                                        {liveMatchSummary.nonStriker && (
                                                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center">
                                                                <span className="truncate font-semibold">{liveMatchSummary.nonStriker.name}</span>
                                                                <span className="font-bold text-brand-blue">{liveMatchSummary.nonStriker.runs}</span>
                                                                <span className="text-text-secondary">({liveMatchSummary.nonStriker.balls})</span>
                                                            </div>
                                                        )}
                                                    </div>
                
                                                    <div className="border-t border-brand-blue/15 my-2"></div>
                
                                                    {liveMatchSummary.bowler && (
                                                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center">
                                                            <span className="truncate font-semibold">{liveMatchSummary.bowler.name}</span>
                                                            <span className="font-bold text-brand-blue">{liveMatchSummary.bowler.wickets}/{liveMatchSummary.bowler.runsConceded}</span>
                                                            <span className="text-text-secondary">({liveMatchSummary.bowler.overs})</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex-grow flex items-center justify-center">
                                                    <p className="text-text-secondary text-center">Loading live match data...</p>
                                                </div>
                                            )}
                                            <div className="mt-auto pt-4">
                                                <Button onClick={() => onContinueMatch(liveQuickMatch)} variant="primary" className="w-full">
                                                    Continue Scoring
                                                </Button>
                                                <button onClick={() => {
                                                    setConfirmation({
                                                        title: 'Abandon Live Match?',
                                                        message: 'Are you sure you want to abandon this live match? The result will be marked as abandoned.',
                                                        onConfirm: () => { onAbandonMatch(liveQuickMatch.id); setConfirmation(null); }
                                                    })
                                                }} className="text-xs text-highlight mt-2 w-full hover:underline">Abandon Match</button>
                                            </div>
                                        </div>
                                    ) : liveTournamentMatch ? (
                                        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 bg-warning/20/50 dark:bg-warning/20 rounded-lg">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-warning mb-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.37-1.21 3.006 0l4.5 8.625c.636 1.21-.26 2.776-1.503 2.776H5.254c-1.243 0-2.139-1.566-1.503-2.776l4.5-8.625zM10 14a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <h4 className="font-bold text-yellow-800 dark:text-yellow-200">Match in Progress</h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">A tournament match is live. Quick Match is disabled.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="relative">
                                                <input type="text" value={quickTeam1} onChange={handleTeam1Change} onFocus={handleTeam1Change} onBlur={() => setTimeout(() => setActiveSuggestionBox(null), 200)} placeholder="Team 1 Name" className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" autoComplete="off" />
                                                {activeSuggestionBox === 'team1' && suggestions.length > 0 && (
                                                    <div className="absolute z-20 w-full bg-primary rounded-lg shadow-lg mt-1 border border-brand-blue/15 max-h-40 overflow-y-auto no-scrollbar">
                                                        {suggestions.map(team => (
                                                            <button key={team.id} onClick={() => handleSelectSuggestion1(team)} className="block w-full text-left px-4 py-2 hover:bg-primary dark:hover:bg-gray-600">{team.name}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                             <div className="relative">
                                                <input type="text" value={quickTeam2} onChange={handleTeam2Change} onFocus={handleTeam2Change} onBlur={() => setTimeout(() => setActiveSuggestionBox(null), 200)} placeholder="Team 2 Name" className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" autoComplete="off" />
                                                {activeSuggestionBox === 'team2' && suggestions.length > 0 && (
                                                    <div className="absolute z-20 w-full bg-primary rounded-lg shadow-lg mt-1 border border-brand-blue/15 max-h-40 overflow-y-auto no-scrollbar">
                                                        {suggestions.map(team => (
                                                            <button key={team.id} onClick={() => handleSelectSuggestion2(team)} className="block w-full text-left px-4 py-2 hover:bg-primary dark:hover:bg-gray-600">{team.name}</button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <input type="number" value={quickOvers} onChange={e => setQuickOvers(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="Overs" className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                                <input type="number" value={quickMaxOvers} onChange={e => setQuickMaxOvers(e.target.value === '' ? '' : parseInt(e.target.value, 10))} placeholder="Max Overs/Bowler" className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                                <input type="number" value={quickPlayers} onChange={handleQuickPlayersChange} placeholder="Players" className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                                            </div>
                                            <Button
                                                onClick={handleAddQuickMatch}
                                                disabled={!quickTeam1.trim() || !quickTeam2.trim() || !quickOvers || !quickPlayers}
                                                className="w-full"
                                            >
                                                Setup & Start
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CrickIQCard>
                        <QuickMatchHistory {...props} setQuickMatchSetupId={setQuickMatchSetupId} onViewResult={onViewQuickMatchResult} onRematch={onRematch} onOpenMatchHub={onOpenMatchHub} />
                    </div>
                )}


            </div>

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

export default TournamentManager;