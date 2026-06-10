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

interface MatchScorecardProps {
    match: Match;
    tournament: Tournament;
    teams: Team[];
    onClose: () => void;
    setManOfTheMatch: (matchId: string, playerId: string) => void;
    onUndo?: (matchId: string) => void;
    hideHeader?: boolean;
}

const InningsScorecard: React.FC<{ innings: Innings; teams: Team[]; match: Match; }> = ({ innings, teams, match }) => {
    const battingTeam = teams.find(t => t.id === innings.battingTeamId);
    const bowlingTeam = teams.find(t => t.id === innings.bowlingTeamId);

    const extras = useMemo(() => {
        if (!battingTeam || !bowlingTeam) return { total: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0 };
        let wides = 0, noBalls = 0, byes = 0, legByes = 0;
        innings.balls.forEach(ball => {
            if (ball.isWide) wides += 1 + ball.runs;
            if (ball.isNoBall) noBalls += 1 + ball.runs;
            if (ball.isBye) byes += ball.runs;
            if (ball.isLegBye) legByes += ball.runs;
        });
        return { total: wides + noBalls + byes + legByes, wides, noBalls, byes, legByes };
    }, [innings.balls, battingTeam, bowlingTeam]);

    const runRate = useMemo(() => calculateRunRate(innings.score, innings.overs), [innings.score, innings.overs]);

    if (!battingTeam || !bowlingTeam) return null;

    const getPlayerName = (playerId: string): string => getPlayerDisplayFromSnapshot(match, playerId, teams);

    const sortedBatsmen = battingTeam.players
        .filter(player => innings.batsmanScores[player.id])
        .sort((a, b) => {
            const aBalls = innings.balls.findIndex(ball => ball.batsmanId === a.id);
            const bBalls = innings.balls.findIndex(ball => ball.batsmanId === b.id);
            if (aBalls === -1) return 1;
            if (bBalls === -1) return -1;
            return aBalls - bBalls;
        });

    return (
        <div className="space-y-4">
                <div className="flex justify-between items-baseline mb-4">
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: battingTeam.logo }}>
                        {battingTeam.name.substring(0, 2).toUpperCase()}
                    </div>
                    {battingTeam.name}
                </h3>
                    <div className="text-right">
                        <p className="text-2xl text-brand-blue">{innings.score}/{innings.wickets}
                            <span className="text-base font-semibold text-text-secondary ml-2">({innings.overs} overs)</span>
                        </p>
                        <p className="text-sm text-text-secondary font-semibold">RR: {runRate}</p>
                    </div>
                </div>
                <Table >
                        <Thead >
                            <Tr>
                                <Th className="w-full">Batsman</Th>
                                <Th >Dismissal</Th>
                                <Th className="text-right">R</Th>
                                <Th className="text-right">B</Th>
                                <Th className="text-right">4s</Th>
                                <Th className="text-right">6s</Th>
                                <Th className="text-right">SR</Th>
                            </Tr>
                        </Thead>
                        <Tbody >
                            {sortedBatsmen.map(player => {
                                const stats = innings.batsmanScores[player.id];
                                if (!stats) return null;
                                const statusText = stats.status === BattingStatus.OUT 
                                    ? getDismissalText(stats.outDetails, getPlayerName)
                                    : stats.status;
                                    
                                const replacement = match.replacements?.find(r => r.incomingPlayerId === player.id);
                                const replacementTag = replacement ? (
                                    <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${replacement.reason === 'Impact Player' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                                        {replacement.reason === 'Impact Player' ? 'IP' : 'Sub'}
                                    </span>
                                ) : null;

                                return (
                                    <Tr key={player.id} className="hover:bg-secondary/30 dark:hover:bg-black/20">
                                        <Td className="font-semibold text-text-primary">
                                            {player.name}
                                            {replacementTag}
                                        </Td>
                                        <Td className="text-sm text-text-secondary font-normal">{statusText}</Td>
                                        <Td className="text-right font-bold text-text-primary">{stats.runs}</Td>
                                        <Td className="text-right text-sm text-text-secondary font-normal">{stats.balls}</Td>
                                        <Td className="text-right text-sm text-text-secondary font-normal">{stats.fours}</Td>
                                        <Td className="text-right text-sm text-text-secondary font-normal">{stats.sixes}</Td>
                                        <Td className="text-right text-sm text-text-secondary font-normal">{calculateStrikeRate(stats.runs, stats.balls)}</Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>

            <div className="space-y-1">
            {innings.exceptions && innings.exceptions.length > 0 && (
            <div className='mb-6 mt-4'>
                 <h4 className="text-lg font-bold tracking-tight text-text-primary mb-4">Exceptions</h4>
                 <div className='text-caption text-orange-600 bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg h-full overflow-x-auto no-scrollbar'>
                    {innings.exceptions.map((exc, idx) => {
                        let readable = '';
                        if (typeof exc === 'string') {
                            const matchId = exc.match(/Bowler (p_[\w]+)/);
                            readable = exc;
                            if (matchId && matchId[1]) {
                                readable = readable.replace(matchId[1], getPlayerName(matchId[1]));
                            }
                        } else {
                            if (exc.type === "BOWLER_LIMIT_EXCEPTION") {
                                readable = `Exception: Bowler ${getPlayerName(exc.bowlerId)} exceeded limit ${exc.limit} over(s)`;
                            } else {
                                readable = `Unknown exception type`;
                            }
                        }
                        return <div key={idx} className='whitespace-nowrap'>{readable}</div>;
                    })}
                 </div>
            </div>
            )}
                <h4 className="text-lg font-bold tracking-tight text-text-primary">Extras</h4>
                <div className="p-4 bg-primary/50 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-xl font-bold text-text-primary">{extras.total}</span>
                    <p className="text-caption text-text-secondary leading-tight text-right">
                        (wd {extras.wides}, nb {extras.noBalls}, b {extras.byes}, lb {extras.legByes})
                    </p>
                </div>
            </div>

            <div>
                 <h4 className="text-lg font-bold tracking-tight text-text-primary mb-4">Bowling</h4>
                 <Table >
                        <Thead >
                            <Tr>
                                <Th className="w-full">Bowler</Th>
                                <Th className="text-right">O</Th>
                                <Th className="text-right">M</Th>
                                <Th className="text-right">R</Th>
                                <Th className="text-right">W</Th>
                                <Th className="text-right">Econ</Th>
                            </Tr>
                        </Thead>
                        <Tbody >
                            {Object.values(innings.bowlerScores).map((stats: BowlerScore) => {
                                const bowlerName = getPlayerName(stats.playerId);
                                const replacement = match.replacements?.find(r => r.incomingPlayerId === stats.playerId);
                                const replacementTag = replacement ? (
                                    <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${replacement.reason === 'Impact Player' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>
                                        {replacement.reason === 'Impact Player' ? 'IP' : 'Sub'}
                                    </span>
                                ) : null;

                                return (
                                    <Tr key={stats.playerId} className="hover:bg-secondary/30 dark:hover:bg-black/20">
                                        <Td className="font-semibold text-text-primary">
                                            {bowlerName}
                                            {replacementTag}
                                        </Td>
                                        <Td className="text-right text-sm text-text-secondary font-normal">{stats.overs}</Td>
                                        <Td className="text-right text-sm text-text-secondary font-normal">{stats.maidens}</Td>
                                        <Td className="text-right text-sm text-text-secondary font-normal">{stats.runsConceded}</Td>
                                        <Td className="text-right font-bold text-text-primary">{stats.wickets}</Td>
                                        <Td className="text-right text-sm text-text-secondary font-normal">{calculateRunRate(stats.runsConceded, stats.overs)}</Td>
                                    </Tr>
                                )
                            })}
                        </Tbody>
                    </Table>
            </div>
        </div>
    );
};

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
                className="flex-grow p-4 md:p-6 overflow-y-auto no-scrollbar space-y-4"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="p-6 text-center shrink-0 bg-primary/50 rounded-xl">
                    <div className="flex justify-between items-center text-caption text-text-secondary mb-4">
                        <span className="font-semibold truncate pr-2">
                            {match.isQuickMatch ? 'Quick Match' : tournament.name}
                        </span>
                        {match.isQuickMatch && match.rivalryMatchNumber !== undefined && match.rivalryMatchNumber !== null ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-2xl uppercase">
                                Match - {match.rivalryMatchNumber}
                            </span>
                        ) : getStageTag(match, tournament)}
                        <span className="font-semibold truncate pl-2">{tournament.location}</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-1">{new Date(match.date).toDateString()}</p>
                    <div className="flex justify-center items-center gap-4 my-2">
                        <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center justify-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: team1.logo }}>
                                {team1.name.substring(0, 2).toUpperCase()}
                            </div>
                            {team1.name}
                        </h2>
                        <span className="text-lg text-text-secondary">vs</span>
                        <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center justify-center gap-4">
                            {team2.name}
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg text-button text-white text-body" style={{ backgroundColor: team2.logo }}>
                                {team2.name.substring(0, 2).toUpperCase()}
                            </div>
                        </h2>
                    </div>
                    <p className="font-bold text-brand-blue text-lg bg-brand-blue/10 py-1 px-4 rounded-2xl inline-block">{winnerMessage}</p>
                    {match.toss && (
                        <p className="text-caption text-text-secondary mt-2">
                            {teams.find(t => t.id === match.toss!.winner)?.name} won the toss and chose to {match.toss.decision}.
                        </p>
                    )}
                </div>
                
                 {manOfTheMatchPlayer ? (
                    <div className="p-4 rounded-2xl text-center shadow-lg relative overflow-hidden  text-amber-900  dark:text-white">
                        <div className="absolute -top-4 -right-4 text-warning/10 dark:text-white/10 w-24 h-24">
                            <TrophyIcon />
                        </div>
                        <TrophyIcon className="w-8 h-8 mx-auto mb-2 text-amber-500 dark:text-yellow-300" />
                        <h3 className="text-sm font-bold tracking-widest uppercase text-amber-800 dark:text-white/90">Man of the Match</h3>
                        <p className="text-2xl font-bold mt-1">{manOfTheMatchPlayer.name}</p>
                        <div className="text-sm text-amber-800 dark:text-white/90 flex items-center justify-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center rounded-sm text-button text-white text-[10px]" style={{ backgroundColor: teams.find(t=>t.players.some(p => p.id === manOfTheMatchPlayer.id))?.logo }}>
                                {teams.find(t=>t.players.some(p => p.id === manOfTheMatchPlayer.id))?.name.substring(0, 2).toUpperCase()}
                            </div>
                            {teams.find(t=>t.players.some(p => p.id === manOfTheMatchPlayer.id))?.name}
                        </div>
                         <div className="flex justify-center gap-2 mt-2 flex-wrap">
                             {getPlayerMatchStats(manOfTheMatchPlayer.id).batting && (
                                 <div className="bg-white/40 dark:bg-black/20 rounded-2xl px-4 py-1 selectable-text">
                                    <span className="font-semibold text-amber-800 dark:text-white/90 text-caption mr-2">Bat</span>
                                    <span className="font-bold text-amber-900 dark:text-white text-body">{getPlayerMatchStats(manOfTheMatchPlayer.id).batting!}</span>
                                </div>
                             )}
                             {getPlayerMatchStats(manOfTheMatchPlayer.id).bowling && (
                                 <div className="bg-white/40 dark:bg-black/20 rounded-2xl px-4 py-1 selectable-text">
                                    <span className="font-semibold text-amber-800 dark:text-white/90 text-caption mr-2">Bowl</span>
                                    <span className="font-bold text-amber-900 dark:text-white text-body">{getPlayerMatchStats(manOfTheMatchPlayer.id).bowling!}</span>
                                </div>
                             )}
                         </div>
                    </div>
                 ) : topPerformers.length > 0 && (
                    <div>
                         <h3 className="text-xl font-bold tracking-tight text-text-primary mb-4 text-center">Select Man of the Match</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {topPerformers.map(p => {
                                const team = teams.find(t=>t.name === p.teamName);
                                return (
                                <button 
                                    key={p.playerId}
                                    onClick={() => setManOfTheMatch(match.id, p.playerId)}
                                    className="text-left p-4 bg-primary rounded-lg hover:shadow-xl transition-all duration-200 border-2 border-[#DCE3F0] dark:border-border hover:border-accent"
                                >
                                    <p className="font-bold text-lg text-text-primary">{p.name}</p>
                                    <div className="text-sm text-text-secondary mb-2 flex items-center gap-2">
                                         <div className="w-5 h-5 flex items-center justify-center rounded-sm text-button text-white text-[10px]" style={{ backgroundColor: team?.logo }}>
                                            {p.teamName.substring(0, 2).toUpperCase()}
                                        </div>
                                        {p.teamName}
                                    </div>
                                    <div className="flex justify-between text-body">
                                        <span className="font-semibold text-text-primary">Batting:</span>
                                        <span className="text-text-secondary">{p.battingStats || 'DNB'}</span>
                                    </div>
                                     <div className="flex justify-between text-body">
                                        <span className="font-semibold text-text-primary">Bowling:</span>
                                        <span className="text-text-secondary">{p.bowlingStats || 'DNB'}</span>
                                    </div>
                                </button>
                            )})}
                         </div>
                    </div>
                )}

                 {match.innings1 && (
                    <div>
                        <div className="flex justify-center p-1 space-x-1 bg-black/5 dark:bg-white/5 rounded-2xl mb-4">
                            <button
                                onClick={() => setActiveTab('innings1')}
                                className={`w-1/2 py-2 px-4 rounded-2xl text-button transition-all duration-300 ${activeTab === 'innings1' ? 'bg-brand-blue text-white shadow-md' : 'text-text-secondary hover:bg-secondary'}`}
                            >
                                 <span className="flex items-center justify-center gap-2">
                                    <div className="w-6 h-6 flex items-center justify-center rounded-md text-button text-white text-caption" style={{ backgroundColor: teams.find(t => t.id === match.innings1!.battingTeamId)?.logo }}>
                                        {teams.find(t => t.id === match.innings1!.battingTeamId)?.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span>{teams.find(t => t.id === match.innings1!.battingTeamId)?.name || 'Team 1'}</span>
                                </span>
                            </button>
                            {match.innings2 && (
                                 <button
                                    onClick={() => setActiveTab('innings2')}
                                    className={`w-1/2 py-2 px-4 rounded-2xl text-button transition-all duration-300 ${activeTab === 'innings2' ? 'bg-brand-blue text-white shadow-md' : 'text-text-secondary hover:bg-secondary'}`}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-6 h-6 flex items-center justify-center rounded-md text-button text-white text-caption" style={{ backgroundColor: teams.find(t => t.id === match.innings2!.battingTeamId)?.logo }}>
                                            {teams.find(t => t.id === match.innings2!.battingTeamId)?.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span>{teams.find(t => t.id === match.innings2!.battingTeamId)?.name || 'Team 2'}</span>
                                    </span>
                                 </button>
                            )}
                        </div>
                        <div key={activeTab} className="animate-fade-in">
                            {activeTab === 'innings1' && <InningsScorecard innings={match.innings1} teams={teams} match={match} />}
                            {activeTab === 'innings2' && match.innings2 && <InningsScorecard innings={match.innings2} teams={teams} match={match} />}
                        </div>
                    </div>
                 )}

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