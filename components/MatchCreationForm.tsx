import React from 'react';
import CrickIQCard from './CrickIQCard';
import TimeScroller from './TimeScroller';
import Calendar from './Calendar';
import { PlusIcon, CalendarIcon } from '../constants';
import type { Team, Tournament } from '../types';

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'blue' }> = ({ children, className, variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-2xl text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses = variant === 'secondary' ? 'bg-brand-lightblue text-white border-0' : variant === 'blue' ? 'bg-brand-blue text-white border-0' : 'bg-brand-gradient text-white border-0';
    return <button {...props} className={`${baseClasses} ${variantClasses} ${className}`}>{children}</button>
}

export interface MatchCreationFormProps {
    isCalendarOpen: boolean;
    setIsCalendarOpen: (val: boolean) => void;
    calendarPosition: 'down' | 'up';
    setCalendarPosition: (val: 'down' | 'up') => void;
    calendarContainerRef: React.RefObject<HTMLDivElement>;
    selectedTournamentId: string | null;
    selectedTournamentForForm: string;
    setSelectedTournamentForForm: (val: string) => void;
    team1Id: string;
    setTeam1Id: (val: string) => void;
    team2Id: string;
    setTeam2Id: (val: string) => void;
    matchDate: string;
    setMatchDate: (val: string) => void;
    matchTime: string;
    setMatchTime: (val: string) => void;
    matchOvers: number | '';
    setMatchOvers: (val: number | '') => void;
    matchMaxOvers: number | '';
    setMatchMaxOvers: (val: number | '') => void;
    isOversEditable: boolean;
    scheduleError: string | null;
    isScheduleFormValid: boolean;
    handleAddMatch: () => void;
    team1Options: Team[];
    team2Options: Team[];
    allTournamentTeams: Team[];
    availableTeams: Team[];
    tournaments: Tournament[];
    checkTeamReadiness: (team: Team) => boolean;
}

const MatchCreationForm: React.FC<MatchCreationFormProps> = ({
    isCalendarOpen,
    setIsCalendarOpen,
    calendarPosition,
    setCalendarPosition,
    calendarContainerRef,
    selectedTournamentId,
    selectedTournamentForForm,
    setSelectedTournamentForForm,
    team1Id,
    setTeam1Id,
    team2Id,
    setTeam2Id,
    matchDate,
    setMatchDate,
    matchTime,
    setMatchTime,
    matchOvers,
    setMatchOvers,
    matchMaxOvers,
    setMatchMaxOvers,
    isOversEditable,
    scheduleError,
    isScheduleFormValid,
    handleAddMatch,
    team1Options,
    team2Options,
    allTournamentTeams,
    availableTeams,
    tournaments,
    checkTeamReadiness
}) => {
    return (
        <CrickIQCard className={isCalendarOpen ? 'z-40' : ''}>
            <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Add New Fixture
            </h3>
            <div className="space-y-4">
            {!selectedTournamentId && (
                <select
                    value={selectedTournamentForForm}
                    onChange={e => { setSelectedTournamentForForm(e.target.value); setTeam1Id(''); setTeam2Id(''); }}
                    className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                    <option value="" disabled>Select Tournament</option>
                    {tournaments.filter((t: Tournament) => t.id !== 't_quick_matches').map((t: Tournament) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            )}
                <select value={team1Id} onChange={e => setTeam1Id(e.target.value)} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <option value="" disabled>Select Team 1</option>
                {team1Options.map((t: Team) => {
                    const isReady = checkTeamReadiness(t);
                    return <option key={t.id} value={t.id}>{t.name}{!isReady ? ' (Not Ready)' : ''}</option>
                })}
                </select>
                <select value={team2Id} onChange={e => setTeam2Id(e.target.value)} className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <option value="" disabled>Select Team 2</option>
                {team2Options.map((t: Team) => {
                    const isReady = checkTeamReadiness(t);
                    return <option key={t.id} value={t.id}>{t.name}{!isReady ? ' (Not Ready)' : ''}</option>
                })}
                </select>
            {allTournamentTeams.length > 0 && availableTeams.length === 0 && (
                <p className="text-sm text-text-secondary text-center p-2 bg-primary/50 rounded-lg">
                    No teams are ready for scheduling. Visit the 'Teams' tab to finalize lineups.
                </p>
            )}
            <div ref={calendarContainerRef} className="relative">
                    <input 
                    type="text"
                    placeholder="Select Date"
                    value={matchDate ? new Date(matchDate.replace(/-/g, '/')).toDateString() : ''}
                    onFocus={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const spaceBelow = window.innerHeight - rect.bottom;
                        setCalendarPosition(spaceBelow < 350 ? 'up' : 'down');
                        setIsCalendarOpen(true);
                    }}
                    readOnly
                    className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue cursor-pointer"
                />
                {isCalendarOpen && <Calendar selectedDate={matchDate} onSelectDate={(d: string) => { setMatchDate(d); setIsCalendarOpen(false); }} position={calendarPosition} />}
            </div>
            <TimeScroller value={matchTime} onChange={setMatchTime} />
            <div className="flex items-center gap-2">
                    <label htmlFor="match-overs" className="text-table-header text-text-secondary">Overs:</label>
                    <input 
                    id="match-overs"
                    type="number"
                    min="1"
                    value={matchOvers}
                    onChange={e => setMatchOvers(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:bg-primary/30"
                    disabled={!isOversEditable}
                    />
            </div>
            <div className="space-y-1.5">
                    <label htmlFor="match-max-overs" className="text-table-header text-text-secondary">Max Overs/Bowler:</label>
                    <input 
                    id="match-max-overs"
                    type="number"
                    min="1"
                    value={matchMaxOvers}
                    onChange={e => setMatchMaxOvers(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full p-2 bg-primary text-text-primary border border-brand-blue/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
            </div>

            {scheduleError && <p className="text-highlight text-body text-center">{scheduleError}</p>}
                <Button onClick={handleAddMatch} className="w-full" variant="primary" disabled={!isScheduleFormValid}>
                <PlusIcon /> Add Fixture
                </Button>
            </div>
        </CrickIQCard>
    );
};

export default MatchCreationForm;
