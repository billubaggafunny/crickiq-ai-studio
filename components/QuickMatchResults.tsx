import React, { useMemo } from 'react';
// FIX: Import BatsmanScore and BowlerScore to provide explicit types for scorecard data.
import type { Team, Innings, BatsmanScore, BowlerScore } from '../types';
import type { UseCrickIQStateReturn } from '../hooks/useCrickIQState';
import { BattingStatus } from '../types';

interface QuickMatchResultsProps extends UseCrickIQStateReturn {
    matchId: string;
    onClose: () => void;
}

// Sub-component for a single innings panel, styled like the image
const InningsPanel: React.FC<{
    innings: Innings;
    battingTeam: Team;
    bowlingTeam: Team;
    panelNumber: 1 | 2;
}> = ({ innings, battingTeam, bowlingTeam, panelNumber }) => {

    const topBatsmen = useMemo(() => {
        // FIX: Explicitly type `stats`, `a`, and `b` to resolve type errors on properties like `.runs` and `.balls`.
        return Object.values(innings.batsmanScores)
            .filter((stats: BatsmanScore) => stats.runs > 0 || stats.balls > 0 || stats.status !== BattingStatus.NOT_OUT) // Only show players who batted
            .sort((a: BatsmanScore, b: BatsmanScore) => b.runs - a.runs)
            .slice(0, 4)
            .map((stats: BatsmanScore) => ({
                ...stats,
                player: battingTeam.players.find(p => p.id === stats.playerId)
            }));
    }, [innings, battingTeam]);

    const topBowlers = useMemo(() => {
        // FIX: Explicitly type `stats`, `a`, and `b` to resolve type errors on properties like `.wickets` and `.runsConceded`.
        return Object.values(innings.bowlerScores)
            .sort((a: BowlerScore, b: BowlerScore) => {
                if (b.wickets !== a.wickets) return b.wickets - a.wickets;
                return a.runsConceded - b.runsConceded;
            })
            .slice(0, 4)
            .map((stats: BowlerScore) => ({
                ...stats,
                player: bowlingTeam.players.find(p => p.id === stats.playerId)
            }));
    }, [innings, bowlingTeam]);

    const headerColorClasses = panelNumber === 1 
        ? "bg-green-600" 
        : "bg-blue-600";

    return (
        <div className="flex-1 flex flex-col bg-secondary text-text-primary">
            {/* Innings Header */}
            <header className={`flex justify-between items-center p-1.5 md:p-2 text-white ${headerColorClasses} dark:bg-black`}>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-4 rounded-sm bg-white/20 md:w-8 md:h-5"></div> 
                    <h3 className="font-bold text-body md:text-lg uppercase tracking-wider">{battingTeam.name}</h3>
                </div>
                <p className="text-[10px] md:text-xs font-semibold text-white/90 dark:text-slate-600">{innings.overs} OVERS</p>
                <p className="text-lg md:text-xl text-button text-white dark:text-white">{innings.score}-{innings.wickets}</p>
            </header>
            
            {/* Innings Body */}
            <div className="flex-1 grid grid-cols-2 divide-x divide-border-color p-1.5 md:p-2 text-[10px] sm:text-[11px]">
                {/* Batting Column */}
                <div className="pr-1.5 md:pr-2 space-y-1">
                    {topBatsmen.map(({ player, ...stats }) => (
                        <div key={player?.id} className="grid grid-cols-[1fr_auto_auto] gap-x-1.5 md:gap-x-2 items-baseline">
                            <span className="font-semibold uppercase truncate">{player?.name}</span>
                            <span className="font-bold text-caption md:text-sm text-text-primary dark:text-white">{stats.runs}{stats.status !== BattingStatus.OUT && '*'}</span>
                            <span className="text-text-secondary">{stats.balls}</span>
                        </div>
                    ))}
                </div>
                {/* Bowling Column */}
                <div className="pl-1.5 md:pl-2 space-y-1">
                    {topBowlers.map(({ player, ...stats }) => (
                         <div key={player?.id} className="grid grid-cols-[1fr_auto_auto] gap-x-1.5 md:gap-x-2 items-baseline">
                            <span className="font-semibold uppercase truncate">{player?.name}</span>
                            <span className="font-bold text-caption md:text-sm text-text-primary dark:text-white">{stats.wickets}-{stats.runsConceded}</span>
                            <span className="text-text-secondary">{stats.overs}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const QuickMatchResults: React.FC<QuickMatchResultsProps> = ({ matchId, onClose, matches, getTeamById, getTournamentById }) => {
    const match = useMemo(() => matches.find(m => m.id === matchId), [matchId, matches]);
    
    if (!match) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
                <p className="text-white">Match not found.</p>
            </div>
        );
    }
    
    const tournament = getTournamentById(match.tournamentId);
    const firstInnings = match.innings1;
    const secondInnings = match.innings2;

    const firstInningsBattingTeam = firstInnings ? getTeamById(firstInnings.battingTeamId) : null;
    const firstInningsBowlingTeam = firstInnings ? getTeamById(firstInnings.bowlingTeamId) : null;

    const secondInningsBattingTeam = secondInnings ? getTeamById(secondInnings.battingTeamId) : null;
    const secondInningsBowlingTeam = secondInnings ? getTeamById(secondInnings.bowlingTeamId) : null;

    if (!firstInnings || !firstInningsBattingTeam || !firstInningsBowlingTeam) {
        return (
             <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
                <p className="text-white">Match data is incomplete.</p>
            </div>
        )
    }
    
    const winner = match.winnerId !== 'draw' ? getTeamById(match.winnerId || '') : null;
    let winnerMessage = "Match Drawn";
    if (winner && secondInnings && secondInningsBattingTeam) {
        if (winner.id === secondInningsBattingTeam.id) {
            const wicketsLeft = (secondInningsBattingTeam.players.length) - 1 - secondInnings.wickets;
            winnerMessage = `${winner.name} won by ${wicketsLeft} wickets`;
        } else {
            const runMargin = firstInnings.score - secondInnings.score;
            winnerMessage = `${winner.name} won by ${runMargin} runs`;
        }
    } else if (match.wasAbandoned) {
        winnerMessage = "Match Abandoned";
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-2 sm:p-4 animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl flex flex-col md:flex-row shadow-2xl rounded-lg overflow-hidden bg-secondary" onClick={e => e.stopPropagation()}>
                {/* Vertical Team Bar - DESKTOP ONLY */}
                <div className="hidden md:flex w-14 lg:w-16 bg-primary flex-col items-center justify-around py-8 shrink-0">
                    <h2 className="text-xl lg:text-2xl tracking-widest uppercase text-text-secondary" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{secondInningsBattingTeam?.name}</h2>
                    <span className="text-lg lg:text-xl text-text-secondary">v</span>
                    <h2 className="text-xl lg:text-2xl tracking-widest uppercase text-text-secondary" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{firstInningsBattingTeam.name}</h2>
                </div>
                
                {/* Main Scorecard */}
                <div className="flex-1 flex flex-col">
                    {/* Mobile Header */}
                    <div className="p-4 bg-primary text-text-primary text-center md:hidden">
                        <h2 className="text-h3 uppercase tracking-wider">
                            {firstInningsBattingTeam.name} vs {firstInningsBowlingTeam.name}
                        </h2>
                        <p className="text-caption text-text-secondary">{tournament?.location}</p>
                    </div>

                    <InningsPanel innings={firstInnings} battingTeam={firstInningsBattingTeam} bowlingTeam={firstInningsBowlingTeam} panelNumber={1} />
                    
                    <div className="h-px bg-border-color"></div>

                    {secondInnings && secondInningsBattingTeam && secondInningsBowlingTeam ? (
                        <InningsPanel innings={secondInnings} battingTeam={secondInningsBattingTeam} bowlingTeam={secondInningsBowlingTeam} panelNumber={2} />
                    ) : (
                        <div className="flex-1 flex flex-col bg-secondary p-4 text-center text-text-secondary items-center justify-center">
                            <p>Second innings has not started.</p>
                        </div>
                    )}
                    
                    {/* Result Footer */}
                    <footer className="bg-blue-600 dark:bg-warning/100 p-2 md:p-4 text-center text-body md:text-base font-bold uppercase tracking-wider text-white dark:text-black">
                        {winnerMessage}
                    </footer>
                </div>
            </div>
             <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-black/70 dark:text-white/70 hover:text-text-primary text-4xl leading-none">&times;</button>
        </div>
    );
};

export default QuickMatchResults;