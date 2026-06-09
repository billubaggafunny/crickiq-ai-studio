import CrickIQCard from './CrickIQCard';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import type { ScheduleRound, Match } from '../types';
import { useNotification } from '../hooks/useNotification';
import { generateRoundRobinSchedule, generateKnockoutSchedule, generateRoundRobinPlusKnockoutSchedule } from '../utils/scheduleLogic';
import ConfirmationModal from './ConfirmationModal';
import TimeScroller from './TimeScroller';
import { ClipboardListIcon } from '../constants';


const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'blue' }> = ({ children, className = '', variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses = variant === 'secondary' ? 'bg-brand-lightblue text-white border-0' : variant === 'blue' ? 'bg-brand-blue text-white border-0' : 'bg-brand-gradient text-white border-0'; // primary

    return <button {...props} className={`${baseClasses} ${variantClasses} ${className}`}>{children}</button>
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ScheduleGenerator: React.FC<UseCrickIQStateReturn> = (props) => {
    const { tournaments, getTeamById, addMatchesBatch, matches, updateTournament, saveDraftSchedule, clearDraftSchedule } = props;
    const { showNotification } = useNotification();

    const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
    const [format, setFormat] = useState<'round-robin' | 'knockout' | 'round-robin-knockout'>('round-robin');
    const [splitInTwoGroups, setSplitInTwoGroups] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('10:00');
    const [matchesPerDay, setMatchesPerDay] = useState<number | ''>(1);
    const [playOnDays, setPlayOnDays] = useState<boolean[]>(Array(7).fill(true));

    const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleRound[] | null>(null);
    const [confirmation, setConfirmation] = useState<{ title: string; message: React.ReactNode; onConfirm: () => void; confirmText?: string; } | null>(null);

    const tournamentOptions = useMemo(() => tournaments.filter(t => t.id !== 't_quick_matches' && t.teamIds.length > 1), [tournaments]);
    const selectedTournament = useMemo(() => tournaments.find(t => t.id === selectedTournamentId), [tournaments, selectedTournamentId]);

    const prevTournamentIdRef = useRef<string | undefined>(undefined);
    useEffect(() => {
        if (selectedTournamentId !== prevTournamentIdRef.current) {
            prevTournamentIdRef.current = selectedTournamentId;
            const tournament = tournaments.find(t => t.id === selectedTournamentId);
            const timeoutId = setTimeout(() => {
                if (tournament?.draftSchedule && tournament.draftSchedule.length > 0) {
                    setGeneratedSchedule(tournament.draftSchedule);
                    showNotification(`Loaded draft schedule for ${tournament.name}.`, 'info');
                } else {
                    setGeneratedSchedule(null);
                }
                
                if (tournament?.startDate) {
                    setStartDate(tournament.startDate);
                } else {
                    setStartDate('');
                }
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [selectedTournamentId, tournaments, showNotification]);


    const handleDayToggle = (index: number) => {
        setPlayOnDays(prev => {
            const newDays = [...prev];
            newDays[index] = !newDays[index];
            return newDays;
        });
    };

    const handleFormatChange = (newFormat: typeof format) => {
        setFormat(newFormat);
        if (newFormat !== 'round-robin-knockout') {
            setSplitInTwoGroups(false);
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const [isSavingSchedule, setIsSavingSchedule] = useState(false);

    const handleGenerate = () => {
        if (isGenerating) return;
        setIsGenerating(true);

        if (!selectedTournament || !startDate || !matchesPerDay) {
            showNotification('Please select a tournament, start date, and matches per day.', 'error');
            setIsGenerating(false);
            return;
        }
        
        if (!Number.isInteger(Number(matchesPerDay)) || Number(matchesPerDay) <= 0 || Number(matchesPerDay) > 20) {
            showNotification('Matches per day must be between 1 and 20.', 'error');
            setIsGenerating(false);
            return;
        }

        if (playOnDays.every(d => !d)) {
            showNotification('Please select at least one day of the week to play on.', 'error');
            setIsGenerating(false);
            return;
        }

        if (selectedTournament.teamIds.length < 2) {
            showNotification('Tournament must have at least 2 teams to generate fixtures.', 'error');
            setIsGenerating(false);
            return;
        }
        
        let schedule: ScheduleRound[];
        let groups: { a: string[], b: string[] } | undefined = undefined;
        try {
            if (format === 'knockout') {
                schedule = generateKnockoutSchedule(selectedTournament.teamIds);
                updateTournament(selectedTournament.id, { groups: undefined });
            } else if (format === 'round-robin-knockout') {
                if (splitInTwoGroups && selectedTournament.teamIds.length < 4) {
                    showNotification('At least 4 teams are required to split into two groups.', 'error');
                    setIsGenerating(false);
                    return;
                }
                const result = generateRoundRobinPlusKnockoutSchedule(selectedTournament.teamIds, splitInTwoGroups);
                schedule = result.schedule;
                groups = result.groups;
                updateTournament(selectedTournament.id, { groups });
            } else {
                schedule = generateRoundRobinSchedule(selectedTournament.teamIds);
                updateTournament(selectedTournament.id, { groups: undefined });
            }

            if (!schedule || schedule.length === 0) {
                showNotification('Failed to generate matches. Please check team configuration.', 'error');
                setIsGenerating(false);
                return;
            }

            setGeneratedSchedule(schedule);
        } catch (err: unknown) {
            console.error('[ScheduleGenerator] error:', err);
            const message = err instanceof Error ? err.message : 'Unknown error';
            showNotification(`Error generating fixtures: ${message}`, 'error');
        }
        setIsGenerating(false);
    };

    const handleSaveSchedule = useCallback(() => {
        if (isSavingSchedule) return;
        if (!generatedSchedule || !selectedTournament || !startDate || !matchesPerDay) return;
        
        setIsSavingSchedule(true);

        const matchesToAdd: Omit<Match, 'id' | 'status'>[] = [];
        const currentDate = new Date(startDate.replace(/-/g, '/'));

        const allMatches = generatedSchedule.flatMap(round => round.matches);
        let matchIndex = 0;

        while (matchIndex < allMatches.length) {
            if (playOnDays[currentDate.getDay()]) {
                for (let i = 0; i < matchesPerDay && matchIndex < allMatches.length; i++) {
                    const match = allMatches[matchIndex];
                    matchesToAdd.push({
                        tournamentId: selectedTournament.id,
                        team1Id: match.team1Id,
                        team2Id: match.team2Id,
                        date: currentDate.toISOString().split('T')[0],
                        time: startTime,
                        oversPerInnings: selectedTournament.defaultOvers || 20,
                        groupId: match.groupId,
                    });
                    matchIndex++;
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const existingMatches = matches.filter(m => m.tournamentId === selectedTournamentId && m.status === 'scheduled').length;

        const confirmAction = () => {
            addMatchesBatch(matchesToAdd);
            const tournamentFormat = format === 'round-robin' ? 'Round Robin' : format === 'knockout' ? 'Knockout' : 'Round Robin + Knockout';
            updateTournament(selectedTournament.id, { format: tournamentFormat, stage: 'group' });
            clearDraftSchedule(selectedTournament.id);
            showNotification(`${matchesToAdd.length} matches have been added!`, 'success');
            setGeneratedSchedule(null);
            setConfirmation(null);
        };
        
        setConfirmation({
            title: "Confirm Fixtures",
            message: `This will add ${matchesToAdd.length} new matches to the tournament fixtures. ${existingMatches > 0 ? `There are already ${existingMatches} scheduled matches.` : ''} Do you want to proceed?`,
            onConfirm: confirmAction,
            confirmText: 'Add Matches'
        });

    }, [generatedSchedule, selectedTournament, startDate, startTime, matchesPerDay, playOnDays, addMatchesBatch, matches, updateTournament, format, clearDraftSchedule, selectedTournamentId, showNotification, isSavingSchedule]);

    const handleSaveDraft = () => {
        if (!selectedTournament || !generatedSchedule) return;
        saveDraftSchedule(selectedTournament.id, generatedSchedule);
        showNotification('Fixtures saved as a draft.', 'success');
    };

    const handleDiscardDraft = () => {
        if (!selectedTournament) return;
        clearDraftSchedule(selectedTournament.id);
        setGeneratedSchedule(null);
        showNotification('Draft discarded.', 'info');
    };

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const renderedSchedule = useMemo(() => {
        if (!generatedSchedule) return null;
        if (!startDate || !matchesPerDay || playOnDays.every(d => !d)) {
            return { error: "Please provide a valid start date, matches per day, and select at least one play day to preview dates." };
        }
        
        const scheduleByDate: { [date: string]: { team1Name: string, team2Name: string }[] } = {};
        const currentDate = new Date(startDate.replace(/-/g, '/'));
        
        let matchIndex = 0;
        const allMatches = generatedSchedule.flatMap(r => r.matches);
        
        if (allMatches.length === 0) {
            return { error: "Generated fixtures contain no matches to preview for these teams." };
        }
        
        let breaker = 0;
        let daysChecked = 0;
        while (matchIndex < allMatches.length) {
             if (breaker++ > 1000) {
                 return { error: "Infinite loop detected while calculating dates. Check scheduling parameters." };
             }
             if (daysChecked++ > 365) {
                 return { error: "Generation exceeds 1 year limit. Check matches per day." };
             }

             if (playOnDays[currentDate.getDay()]) {
                 const dateString = currentDate.toDateString();
                 if (!scheduleByDate[dateString]) scheduleByDate[dateString] = [];
                 
                 for (let i = 0; i < matchesPerDay && matchIndex < allMatches.length; i++) {
                     const match = allMatches[matchIndex];
                     const team1 = getTeamById(match.team1Id);
                     const team2 = getTeamById(match.team2Id);
                     if (team1 && team2) {
                         scheduleByDate[dateString].push({ team1Name: team1.name, team2Name: team2.name });
                     }
                     matchIndex++;
                 }
             }
             currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return Object.keys(scheduleByDate).length > 0 ? scheduleByDate : { error: "No dates configured successfully." };
    }, [generatedSchedule, startDate, matchesPerDay, playOnDays, getTeamById]);

    return (
        <div className="space-y-4">
            <h2 className="text-h1 text-text-primary items-center gap-2 flex pt-2">
                <ClipboardListIcon className="w-6 h-6" />
                Tournament Fixtures
            </h2>
            <CrickIQCard>
                <h3 className="text-xl font-bold text-text-primary mb-2">1. Select Tournament</h3>
                <select value={selectedTournamentId} onChange={e => { setSelectedTournamentId(e.target.value); }} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                    <option value="" disabled>Select a tournament...</option>
                    {tournamentOptions.map(t => <option key={t.id} value={t.id}>{t.name} ({t.teamIds.length} teams)</option>)}
                </select>
            </CrickIQCard>

            <CrickIQCard>
                <h3 className="text-xl font-bold text-text-primary mb-4">2. Configure Fixtures</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-table-header text-text-secondary">Tournament Format</label>
                        <select value={format} onChange={e => handleFormatChange(e.target.value as 'round-robin' | 'knockout' | 'round-robin-knockout')} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                            <option value="round-robin">Round Robin (Each team plays each other once)</option>
                            <option value="knockout">Knockout (Elimination)</option>
                            {selectedTournament && selectedTournament.teamIds.length >= 5 && (
                                <option value="round-robin-knockout">Round-Robin + Knockout (Hybrid)</option>
                            )}
                        </select>
                        {format === 'round-robin-knockout' && selectedTournament && selectedTournament.teamIds.length >= 6 && (
                            <div className="flex items-center gap-2 p-2 mt-2 bg-primary/50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="split-groups-checkbox"
                                    checked={splitInTwoGroups}
                                    onChange={e => setSplitInTwoGroups(e.target.checked)}
                                    className="w-4 h-4 accent-accent"
                                />
                                <label htmlFor="split-groups-checkbox" className="text-table-header text-text-secondary cursor-pointer">
                                    Split teams into two groups
                                </label>
                            </div>
                        )}
                        {format === 'knockout' && (
                            <p className="text-caption text-text-secondary mt-2 p-2 bg-primary/50 rounded-md">
                                Fast and exciting format — but one loss ends the journey. This will generate the first round of matches.
                            </p>
                        )}
                        {format === 'round-robin-knockout' && (
                             <p className="text-caption text-text-secondary mt-2 p-2 bg-primary/50 rounded-md">
                                A league stage followed by a knockout phase. You can choose to have all teams in one large group, or split them into two separate groups. The top teams advance to the knockout stage.
                            </p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-table-header text-text-secondary">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                        </div>
                        <div>
                            <label className="text-table-header text-text-secondary">Matches per Day</label>
                            <input type="number" min="1" value={matchesPerDay} onChange={e => setMatchesPerDay(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                        </div>
                    </div>
                    <div>
                        <label className="text-table-header text-text-secondary">Default Match Start Time</label>
                        <TimeScroller value={startTime} onChange={setStartTime} />
                    </div>
                    <div>
                        <label className="text-table-header text-text-secondary">Play on Days</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {WEEK_DAYS.map((day, index) => (
                                <button key={day} onClick={() => handleDayToggle(index)} className={`px-4 py-1.5 rounded-2xl font-semibold text-caption transition-all duration-200 ${playOnDays[index] ? 'bg-brand-blue text-white' : 'bg-primary hover:bg-border-color'}`}>
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={handleGenerate} variant="primary" className="w-full" disabled={!selectedTournamentId}>
                        Generate Preview
                    </Button>
                </div>
            </CrickIQCard>

            {generatedSchedule && (
                <CrickIQCard  className="animate-fade-in">
                    <h3 className="text-xl font-bold text-text-primary mb-4">3. Fixtures Preview</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto no-scrollbar pr-2">
                        {renderedSchedule && 'error' in renderedSchedule ? (
                            <p className="text-highlight text-body text-center p-2 bg-highlight/10 rounded-md">{renderedSchedule.error as string}</p>
                        ) : renderedSchedule ? (
                            Object.entries(renderedSchedule).map(([date, matches]) => (
                                <div key={date}>
                                    <h4 className="font-bold text-text-primary mb-2 border-b border-brand-blue/15 pb-1">{date}</h4>
                                    <ul className="space-y-2 pl-2">
                                        {(matches as { team1Name: string, team2Name: string }[]).map((match, index) => (
                                            <li key={index} className="text-sm text-text-secondary">
                                                {match.team1Name} vs {match.team2Name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : null}
                    </div>
                    <div className="mt-6 flex flex-wrap justify-end gap-2">
                        <Button onClick={handleDiscardDraft} variant="secondary">Discard Draft</Button>
                        <Button onClick={handleSaveDraft} variant="secondary">Save as Draft</Button>
                        <Button onClick={handleSaveSchedule} variant="primary" disabled={!!(renderedSchedule && 'error' in renderedSchedule)}>Add Matches to Tournament</Button>
                    </div>
                </CrickIQCard>
            )}

            {confirmation && (
                <ConfirmationModal
                    onClose={() => {
                        setConfirmation(null);
                        setIsSavingSchedule(false);
                    }}
                    onConfirm={confirmation.onConfirm}
                    title={confirmation.title}
                    message={confirmation.message}
                    confirmText={confirmation.confirmText}
                    confirmVariant="primary"
                />
            )}
        </div>
    );
};

export default ScheduleGenerator;