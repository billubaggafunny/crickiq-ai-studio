import { Table, Thead, Tbody, Tr, Th, Td } from './CrickIQTable';
import React, { useMemo, useState } from 'react';
import type { Match, Team, Innings, BatsmanScore, BowlerScore, Tournament } from '../types';
import { BattingStatus } from '../types';
import { getMaxPlayers } from '../utils/matchConfig';
import { calculateStrikeRate, getTopPerformers, getDismissalText, calculateRunRate } from '../utils/cricketLogic';
import { TrophyIcon, ShareIcon, UndoIcon } from '../constants';
import { useNotification } from '../hooks/useNotification';
import Header from './Header';
import { getPlayerDisplayFromSnapshot } from '../utils/playerSnapshots';
import PremiumScoreboard from './PremiumScoreboard';

interface MatchScorecardProps {
    match: Match;
    tournament: Tournament;
    teams: Team[];
    onClose: () => void;
    setManOfTheMatch: (matchId: string, playerId: string) => void;
    onUndo?: (matchId: string) => void;
    hideHeader?: boolean;
}

const getStageTag = (match: Match, tournament: Tournament) => {
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


const MatchScorecard: React.FC<MatchScorecardProps> = ({ match, tournament, teams, onClose, setManOfTheMatch, onUndo, hideHeader = false }) => {
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<'innings1' | 'innings2'>('innings1');
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
    
    const team1 = teams.find(t => t.id === match.team1Id);
    const team2 = teams.find(t => t.id === match.team2Id);

    const winnerMessage = useMemo(() => {
        if (match.wasAbandoned) return 'Match Abandoned';
        const winner = match.winnerId !== 'draw' ? teams.find(t => t.id === match.winnerId) : null;
        if (!winner) return "Match Drawn";

        if (match.innings2 && winner.id === match.innings2.battingTeamId) {
            const rawBattingTeam = teams.find(t => t.id === match.innings2!.battingTeamId);
            const isTeam1 = rawBattingTeam?.id === match.team1Id;
            const squadIds = isTeam1 ? match.team1SquadIds : match.team2SquadIds;
            const maxPlayers = getMaxPlayers(match);
            
            let totalPlayers = maxPlayers;
            if (squadIds && squadIds.length > 0) {
                 totalPlayers = squadIds.length;
            } else if (rawBattingTeam?.players?.length) {
                 totalPlayers = rawBattingTeam.players.length;
            }
            
            const wicketsLeft = totalPlayers - 1 - (match.innings2.wickets || 0);
            return `${winner.name} won by ${wicketsLeft} wickets`;
        } else if (match.innings1 && winner.id === match.innings1.battingTeamId) {
            const runMargin = (match.innings1.score || 0) - (match.innings2?.score || 0);
            return `${winner.name} won by ${runMargin} runs`;
        }
        return `${winner.name} won`;
    }, [match, teams]);

    const topPerformers = useMemo(() => {
        if (match.manOfTheMatchId) return [];
        return getTopPerformers(match, teams);
    }, [match, teams]);

    const manOfTheMatchPlayer = useMemo(() => {
        if (!match.manOfTheMatchId) return null;
        const name = getPlayerDisplayFromSnapshot(match, match.manOfTheMatchId, teams);
        // We still need a minimal object for rendering
        const allPlayers = teams.flatMap(t => t.players);
        const p = allPlayers.find(p => p.id === match.manOfTheMatchId);
        
        if (p) {
            return { ...p, name };
        }
        
        return { 
            id: match.manOfTheMatchId,
            name, 
            role: 'Player', 
            number: 0,
            originalId: '',
            globalPlayerId: ''
        };
    }, [match, teams]);
    
    if (!match || !team1 || !team2) return (<div className="p-4 text-center text-text-secondary">Match data could not be loaded. Please try again.</div>);
    
    const getPlayerName = (playerId: string): string => getPlayerDisplayFromSnapshot(match, playerId, teams);

    const getPlayerMatchStats = (playerId: string) => {
        const stats: {batting: string | null, bowling: string | null} = { batting: null, bowling: null };
        const innings = [match.innings1, match.innings2].filter((i): i is Innings => !!i);
        
        for (const inning of innings) {
            const batPerf = inning.batsmanScores[playerId];
            if(batPerf) stats.batting = `${batPerf.runs}(${batPerf.balls})`;

            const bowlPerf = inning.bowlerScores[playerId];
            if(bowlPerf) stats.bowling = `${bowlPerf.wickets}/${bowlPerf.runsConceded} (${bowlPerf.overs})`;
        }
        return stats;
    };

    const generateShareableSummary = (): string => {
        if (!team1 || !team2) return "Match data incomplete.";
    
        let summary = `🏏 CrickIQ Match Report 🏏\n\n`;
        summary += `${team1.name} vs ${team2.name}\n`;
        summary += `------------------------------------\n`;
        summary += `✨ RESULT: ${winnerMessage} ✨\n`;
        summary += `------------------------------------\n\n`;
    
        const processInnings = (innings: Innings | undefined, title: string) => {
            if (!innings) return '';
            const battingTeam = teams.find(t => t.id === innings.battingTeamId);
            if (!battingTeam) return '';
    
            let inningsSummary = `${title.toUpperCase()}: ${battingTeam.name}\n`;
            inningsSummary += `SCORE: ${innings.score}/${innings.wickets} in ${innings.overs} Overs\n`;
    
            const topBatsman = Object.values(innings.batsmanScores).reduce((best, current) =>
                current.runs > (best?.runs ?? -1) ? current : best,
                null as BatsmanScore | null
            );
            if (topBatsman) {
                const name = getPlayerName(topBatsman.playerId).split(' ').pop();
                inningsSummary += `⭐ Top Batter: ${name} - ${topBatsman.runs}(${topBatsman.balls})\n`;
            }
    
            const topBowler = Object.values(innings.bowlerScores).reduce((best, current) => {
                if (current.wickets > (best?.wickets ?? -1)) return current;
                if (current.wickets === (best?.wickets ?? -1) && current.runsConceded < (best?.runsConceded ?? Infinity)) return current;
                return best;
            }, null as BowlerScore | null);
            
            if (topBowler) {
                const name = getPlayerName(topBowler.playerId).split(' ').pop();
                inningsSummary += `⭐ Top Bowler: ${name} - ${topBowler.wickets}/${topBowler.runsConceded} (${topBowler.overs})\n`;
            }
            return inningsSummary;
        };
    
        summary += processInnings(match.innings1, 'Innings 1');
        if (match.innings2) {
            summary += `\n` + processInnings(match.innings2, 'Innings 2');
        }
    
        summary += `\n------------------------------------\n`;
        if (match.manOfTheMatchId) {
            const motmName = getPlayerName(match.manOfTheMatchId);
            summary += `🏆 Man of the Match: ${motmName} 🏆\n\n`;
        }
    
        summary += `📊 Scored with CrickIQ - Your ultimate cricket scorer & analyst! Download now.`;
        
        return summary;
    };

    const handleShareScorecard = async () => {
        const summaryText = generateShareableSummary();
    
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Match Scorecard: ${team1.name} vs ${team2.name}`,
                    text: summaryText,
                });
            } catch (error) {
                console.error('Error sharing scorecard:', error);
                if ((error as DOMException)?.name !== 'AbortError') {
                     showNotification('Could not share scorecard.', 'error');
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(summaryText);
                showNotification('Scorecard copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy text: ', err);
                showNotification('Could not copy scorecard.', 'error');
            }
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, select, textarea, [role="button"], .no-swipe, .overflow-x-auto, [data-no-swipe="true"]')) {
            return;
        }
        
        const noSwipeArea = target.closest<HTMLElement>('.no-swipe');
        if (noSwipeArea && noSwipeArea.scrollWidth > noSwipeArea.clientWidth) {
            return;
        }

        setTouchStartX(e.targetTouches[0].clientX);
        setTouchCurrentX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        setTouchCurrentX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX === null || touchCurrentX === null) {
            return;
        }

        const diffX = touchStartX - touchCurrentX;
        const SWIPE_THRESHOLD = 50;

        if (diffX > SWIPE_THRESHOLD) { // Swiped left
            if (activeTab === 'innings1' && match.innings2) {
                e.stopPropagation(); // Local swipe success, prevent workspace swipe
                setActiveTab('innings2');
            }
        } else if (diffX < -SWIPE_THRESHOLD) { // Swiped right
            if (activeTab === 'innings2') {
                e.stopPropagation(); // Local swipe success, prevent workspace swipe
                setActiveTab('innings1');
            }
        }
        
        setTouchStartX(null);
        setTouchCurrentX(null);
    };

    return (
        <div className={hideHeader ? "flex flex-col h-full bg-secondary" : "h-screen w-screen flex flex-col bg-secondary safe-pad-t safe-pad-l safe-pad-r"}>
            {!hideHeader && (<Header 
                title="Match Scorecard" 
                showBack 
                onBackClick={onClose} 
                actionButton={
                    <button 
                        onClick={handleShareScorecard} 
                        className="w-11 h-11 flex items-center justify-center rounded-2xl text-white hover:bg-secondary/20 transition-colors"
                        title="Share Scorecard"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>
                }
            />)}
            <div 
                className="flex-grow p-1 md:p-6 overflow-y-auto no-scrollbar space-y-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                                <PremiumScoreboard match={match} tournament={tournament} teams={teams} setManOfTheMatch={setManOfTheMatch} />
                
                 {match.replacements && match.replacements.length > 0 && (
                     <div className="bg-primary p-4 rounded-xl shadow-sm border border-brand-blue/10">
                         <h3 className="text-lg font-bold tracking-tight text-text-primary mb-3">Match Notes</h3>
                         <ul className="space-y-2">
                             {match.replacements.map((r, idx) => {
                                 const incomingPlayer = getPlayerName(r.incomingPlayerId);
                                 const outgoingPlayer = getPlayerName(r.outgoingPlayerId);
                                 const isImpactPlayer = r.reason === 'Impact Player';
                                 return (
                                     <li key={idx} className="flex gap-2 items-start text-sm text-text-secondary">
                                         <span className={`flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${isImpactPlayer ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                                         <span>
                                             <strong>{r.reason || 'Substitute'}:</strong> {incomingPlayer} replaced {outgoingPlayer}
                                         </span>
                                     </li>
                                 );
                             })}
                         </ul>
                     </div>
                 )}

             </div>

            {onUndo ? (
                <footer className="p-4 bg-secondary/80 backdrop-blur-sm border-t border-brand-blue/15 flex justify-end items-center gap-4 shrink-0 safe-pad-b">
                    <button
                        onClick={() => onUndo(match.id)}
                        className="px-4 py-2 rounded-2xl text-button flex items-center justify-center gap-2  text-gray-800  dark:text-text-primary hover:brightness-105 border border-brand-blue/15"
                    >
                        <UndoIcon className="w-4 h-4" />
                        Undo
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-2xl text-button flex items-center justify-center gap-2  text-white"
                    >
                        Confirm &amp; Finish
                    </button>
                </footer>
            ) : (
                <footer className="p-4 bg-secondary/80 backdrop-blur-sm border-t border-brand-blue/15 flex justify-end items-center gap-4 shrink-0 safe-pad-b">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-2xl text-button flex items-center justify-center gap-2  text-white"
                    >
                        Close
                    </button>
                </footer>
            )}
        </div>
    );
};

export default MatchScorecard;