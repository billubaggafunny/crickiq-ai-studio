import React, { useState, useMemo } from 'react';
import { Player, Team, Match, PlayerRole, Tournament, Innings } from '../types';
import { ChevronLeft, ChevronRight, X, Info } from 'lucide-react';
import { getRoleIcon, PLAYER_ROLES } from '../constants';
import { validatePlayer } from '../utils/validation';
import { useNotification } from '../hooks/useNotification';
import { useTeamLock } from '../hooks/useTeamLock';
import { getMaxPlayers } from '../utils/matchConfig';

interface PlayerDetailsPageProps {
    player?: Player;
    team: Team;
    match?: Match;
    opponentTeam?: Team;
    tournament?: Tournament;
    matches?: Match[];
    teams?: Team[];
    tournamentId?: string;
    isMatchLive?: boolean;
    updateTeam?: (team: Team) => void;
    updateMatch?: (matchId: string, updates: Partial<Match>) => void;
    onBack: () => void;
    mode?: 'view' | 'edit' | 'add';
}

const PlayerDetailsView: React.FC<PlayerDetailsPageProps> = ({
    player,
    team,
    match,
    opponentTeam,
    tournament,
    matches = [],
    teams = [],
    onBack
}) => {
    // Cast player as Player since view mode always has a player
    const safePlayer = player as Player;
    const isCaptain = safePlayer?.id === team?.captainId;
    const isViceCaptain = safePlayer?.id === team?.viceCaptainId;
    
    const [activeTab, setActiveTab] = useState('Overview');
    const tabs = ['Overview', 'Stats', 'Matches', 'Teams', 'Tournaments'];
    

    const [statSection, setStatSection] = useState<'Batting' | 'Bowling' | 'Keeping' | 'Fielding'>('Batting');

    const playerStats = useMemo(() => {
        const globalId = (safePlayer as Player & { globalPlayerId?: string }).globalPlayerId || safePlayer.id;
        const linkedIds = new Set<string>();
        
        linkedIds.add(safePlayer.id);
        
        teams.forEach(t => {
            t.players.forEach(p => {
                if (((p as Player & { globalPlayerId?: string }).globalPlayerId || p.id) === globalId) {
                    linkedIds.add(p.id);
                }
            });
        });

        const batMatches = new Set<string>();
        let batInningsCount = 0;
        let runsScored = 0;
        let ballsFaced = 0;
        let fours = 0;
        let sixes = 0;
        let outs = 0;
        let highestScore = 0;
        let highestScoreNotOut = false;
        let thirties = 0;
        let fifties = 0;
        let hundreds = 0;

        const bowlMatches = new Set<string>();
        let bowlInningsCount = 0;
        let ballsBowled = 0;
        let runsConceded = 0;
        let wickets = 0;
        let threeWickets = 0;
        let fourWickets = 0;

        const fieldMatches = new Set<string>();
        let catches = 0;
        let runOuts = 0;
        
        const keepMatches = new Set<string>();
        let stumpings = 0;
        let keepingCatches = 0;
        let keepingRunOuts = 0;

        let momCountInner = 0;
        
        const isWicketKeeper = safePlayer.role === 'Wicket Keeper';

        matches.filter(m => m.status === 'completed').forEach(m => {
            let playedBatting = false;
            let playedBowling = false;
            let playedFielding = false;
            let playedKeeping = false;
            
            let matchMom = false;
            if (m.manOfTheMatchId && linkedIds.has(m.manOfTheMatchId)) {
                momCountInner++;
                matchMom = true;
            }

            const processInnings = (innings: Innings | undefined) => {
                if (!innings) return;
                
                let innPlayedBat = false;
                let innPlayedBowl = false;
                
                linkedIds.forEach(id => {
                    const batScore = innings.batsmanScores[id];
                    if (batScore && (batScore.balls > 0 || batScore.runs > 0 || batScore.status !== 'Did Not Bat')) {
                        innPlayedBat = true;
                        batInningsCount++;
                        runsScored += batScore.runs;
                        ballsFaced += batScore.balls;
                        fours += batScore.fours;
                        sixes += batScore.sixes;
                        if (batScore.status !== 'Not Out' && batScore.status !== 'Retired Hurt') {
                            outs++;
                        }
                        if (batScore.runs > highestScore) {
                            highestScore = batScore.runs;
                            highestScoreNotOut = batScore.status === 'Not Out';
                        } else if (batScore.runs === highestScore && batScore.status === 'Not Out') {
                            highestScoreNotOut = true;
                        }
                        
                        if (batScore.runs >= 100) hundreds++;
                        else if (batScore.runs >= 50) fifties++;
                        else if (batScore.runs >= 30) thirties++;
                    }

                    const bowlScore = innings.bowlerScores[id];
                    if (bowlScore && (bowlScore.overs > 0 || bowlScore.runsConceded > 0 || bowlScore.wickets > 0)) {
                        innPlayedBowl = true;
                        bowlInningsCount++;
                        const completedOvers = Math.floor(bowlScore.overs);
                        const partialBalls = Math.round((bowlScore.overs - completedOvers) * 10);
                        const innBallsBowled = completedOvers * 6 + partialBalls;
                        ballsBowled += innBallsBowled; 
                        runsConceded += bowlScore.runsConceded;
                        wickets += bowlScore.wickets;
                        
                        if (bowlScore.wickets >= 4) fourWickets++;
                        else if (bowlScore.wickets === 3) threeWickets++;
                    }
                });

                innings.balls.forEach(ball => {
                    if (ball.wicket && ball.wicket.fielderIds) {
                        const isLinkedFielder = ball.wicket.fielderIds.some(fielderId => linkedIds.has(fielderId));
                        if (isLinkedFielder) {
                            if (ball.wicket.type === 'Caught') {
                                if (isWicketKeeper) keepingCatches++;
                                else catches++;
                            } else if (ball.wicket.type === 'Stumped') {
                                stumpings++;
                            } else if (ball.wicket.type === 'Run Out') {
                                if (isWicketKeeper) keepingRunOuts++;
                                else runOuts++;
                            }
                            
                            if (isWicketKeeper && (ball.wicket.type === 'Caught' || ball.wicket.type === 'Run Out' || ball.wicket.type === 'Stumped')) {
                                playedKeeping = true;
                            } else {
                                playedFielding = true;
                            }
                        }
                    }
                });

                if (innPlayedBat) playedBatting = true;
                if (innPlayedBowl) playedBowling = true;
            };

            processInnings(m.innings1);
            processInnings(m.innings2);
            
            let involved = false;
            if (playedBatting) { batMatches.add(m.id); involved = true; }
            if (playedBowling) { bowlMatches.add(m.id); involved = true; }
            if (playedFielding) { fieldMatches.add(m.id); involved = true; }
            if (playedKeeping) { keepMatches.add(m.id); involved = true; }
            
            if (!involved && matchMom) {
                 batMatches.add(m.id);
            }
            
        });

        const overallMatchesCount = new Set([...batMatches, ...bowlMatches, ...fieldMatches, ...keepMatches]).size;

        return {
            overallMatches: overallMatchesCount,
            batting: {
                matches: batMatches.size,
                innings: batInningsCount,
                runs: runsScored,
                balls: ballsFaced,
                highest: highestScore,
                highestNotOut: highestScoreNotOut,
                average: outs > 0 ? (runsScored / outs).toFixed(1) : (runsScored > 0 ? '-' : '-'),
                strikeRate: ballsFaced > 0 ? ((runsScored / ballsFaced) * 100).toFixed(1) : '-',
                fours,
                sixes,
                thirties,
                fifties,
                hundreds,
                outs
            },
            bowling: {
                matches: bowlMatches.size,
                innings: bowlInningsCount,
                overs: (Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 10).toFixed(1),
                balls: ballsBowled,
                runs: runsConceded,
                wickets,
                average: wickets > 0 ? (runsConceded / wickets).toFixed(1) : '-',
                economy: ballsBowled > 0 ? (runsConceded / (ballsBowled / 6)).toFixed(1) : '-',
                strikeRate: wickets > 0 ? (ballsBowled / wickets).toFixed(1) : '-',
                threeW: threeWickets,
                fourW: fourWickets
            },
            fielding: {
                catches,
                runOuts
            },
            keeping: {
                matches: keepMatches.size,
                catches: keepingCatches,
                stumpings,
                runOuts: keepingRunOuts,
                isRelevant: isWicketKeeper || stumpings > 0 || keepingCatches > 0 || keepingRunOuts > 0
            },
            mom: momCountInner
        };
    }, [matches, teams, safePlayer]);

        // Linked Teams logic
    const linkedTeams = useMemo(() => {
        if (safePlayer?.id) { // In CrickIQ, usually player.id matches globalPlayerId if not explicitly separated, let's check globalPlayerId
            // We use globalPlayerId if available, fallback to player.id to be safe
            const globalId = (safePlayer as Player & { globalPlayerId?: string }).globalPlayerId || safePlayer.id;
            const foundTeams = teams.filter(t => t.players.some(p => ((p as Player & { globalPlayerId?: string }).globalPlayerId || p.id) === globalId));
            
            // Deduplicate teams by ID
            const uniqueTeamsMap = new Map();
            foundTeams.forEach(t => uniqueTeamsMap.set(t.id, t));
            const uniqueTeams = Array.from(uniqueTeamsMap.values());
            
            return uniqueTeams.length > 0 ? uniqueTeams : (team ? [team] : []);
        }
        return team ? [team] : [];
    }, [teams, safePlayer, team]);

    // Overview tab variables
    const PlayerInfo = safePlayer as Player & { country?: string; dob?: string };
    
    const momCount = useMemo(() => {
        return matches.filter(m => m.status === 'completed' && m.manOfTheMatchId === safePlayer.id).length;
    }, [matches, safePlayer.id]);

    const liveMatchContext = useMemo(() => {
        const lMatch = matches.find(m => m.status === 'live' && (m.team1Id === team?.id || m.team2Id === team?.id));
        if (!lMatch) return null;

        let matchTitle = 'Live Cricket Match';
        const isTeam1 = lMatch.team1Id === team?.id;
        const opponentId = isTeam1 ? lMatch.team2Id : lMatch.team1Id;
        const opponent = teams.find(t => t.id === opponentId);
        matchTitle = `Match: ${team?.name || 'Team'} vs ${opponent?.name || 'Opponent not available'}`;

        const currentInnings = lMatch.innings2?.balls?.length ? lMatch.innings2 : lMatch.innings1;
        
        let stateStatus = 'No Active Match';
        let battingString = '';
        let bowlingString = '';

        const batScore = currentInnings?.batsmanScores?.[safePlayer.id] || lMatch.innings1?.batsmanScores?.[safePlayer.id];
        const bowlScore = currentInnings?.bowlerScores?.[safePlayer.id] || lMatch.innings1?.bowlerScores?.[safePlayer.id];

        if (currentInnings) {
             const isBattingNow = currentInnings.currentBatsmen?.includes(safePlayer.id);
             const isBowlingNow = currentInnings.currentBowler === safePlayer.id;
             
             if (isBattingNow) stateStatus = 'Live Batting';
             else if (isBowlingNow) stateStatus = 'Live Bowling';
             else if (batScore && batScore.balls > 0) stateStatus = 'Batted';
             else stateStatus = 'Not Batted';
        }

        if (batScore) {
           battingString = `${batScore.runs}${currentInnings?.currentBatsmen?.includes(safePlayer.id) ? '*' : ''} (${batScore.balls})`;
        }
        if (bowlScore) {
           bowlingString = `${bowlScore.wickets}-${bowlScore.runsConceded} (${bowlScore.overs})`;
        }

        return { matchTitle, stateStatus, battingString, bowlingString, teamName: team?.name || 'Team' };
    }, [matches, team, safePlayer.id, teams]);

    const recentPerformances = useMemo(() => {
        return matches
            .filter(m => m.status === 'completed' && (m.team1Id === team?.id || m.team2Id === team?.id))
            .slice(-5)
            .reverse()
            .map(m => {
                const bat = m.innings1?.batsmanScores?.[safePlayer.id] || m.innings2?.batsmanScores?.[safePlayer.id];
                const bowl = m.innings1?.bowlerScores?.[safePlayer.id] || m.innings2?.bowlerScores?.[safePlayer.id];
                
                let display = 'Did Not Play';
                if (bat?.balls && bowl?.overs) {
                    display = `${bat.runs} Runs + ${bowl.wickets} Wickets`;
                } else if (bat?.balls) {
                    display = `${bat.runs} Runs`;
                } else if (bowl?.overs) {
                    display = `${bowl.wickets} Wickets`;
                }
                
                const opponentId = (m.team1Id === team?.id) ? m.team2Id : m.team1Id;
                const opp = teams.find(t => t.id === opponentId);
                const opponentName = opp?.name || 'Opponent not available';
                
                return {
                    id: m.id,
                    display,
                    date: m.date || 'Unknown Date',
                    opponent: opponentName
                };
            });
    }, [matches, team, safePlayer.id, teams]);
    
    // Derived Match Context
    const matchName = opponentTeam ? `${team.name} vs ${opponentTeam.name}` : `Match vs Opponent`;

    // Derived Participation Snapshot
    let hasBatted = false;
    let hasBowled = false;
    let isCurrentBatter = false;
    let isCurrentBowler = false;
    let isOut = false;
    
    let retiredNote: string | null = null;
    let replacementNote: string | null = null;
    
    const checkInnings = (innings: Innings | undefined) => {
        if (!innings) return;
        if (innings.batsmanScores?.[safePlayer.id]) {
            hasBatted = true;
            if (innings.batsmanScores[safePlayer.id].status === 'Out') isOut = true;
            if (innings.batsmanScores[safePlayer.id].status === 'Retired Hurt') {
                isOut = true;
                retiredNote = 'Retired Hurt';
            }
        }
        if (innings.bowlerScores?.[safePlayer.id]) {
            hasBowled = true;
        }
        if (innings.currentBatsmen?.includes(safePlayer.id)) {
            isCurrentBatter = true;
        }
        if (innings.currentBowler === safePlayer.id) {
            isCurrentBowler = true;
        }
    };
    
    if (match) {
        checkInnings(match.innings1);
        checkInnings(match.innings2);
        
        if (match.replacements) {
            const outRep = match.replacements.find(r => r.outgoingPlayerId === safePlayer.id);
            const inRep = match.replacements.find(r => r.incomingPlayerId === safePlayer.id);
        
        if (outRep) {
            const inPlayer = team?.players?.find(p => p.id === outRep.incomingPlayerId);
            replacementNote = `Replaced by ${inPlayer?.name || 'another player'}${outRep.reason ? ` - ${outRep.reason}` : ''}`;
        }
        if (inRep) {
            const outPlayer = team?.players?.find(p => p.id === inRep.outgoingPlayerId);
            replacementNote = `Replacement for ${outPlayer?.name || 'another player'}${inRep.reason ? ` - ${inRep.reason}` : ''}`;
        }
    }
    }
    
    return (
        <div className="relative w-full h-full bg-secondary flex flex-col select-none safe-pad-t safe-pad-r safe-pad-l">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-primary text-text-primary border-b border-brand-blue/15 relative">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
                    aria-label="Go back"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="absolute inset-0 flex items-center justify-center space-x-2 pointer-events-none">
                    <span className="font-bold text-lg text-text-primary truncate max-w-[200px]">{safePlayer?.name || 'Unknown Player'}</span>
                </div>
                <div className="w-10 flex justify-end">
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-brand-blue/15 bg-primary overflow-x-auto no-scrollbar scroll-smooth snap-x">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-4 font-bold text-sm border-b-2 whitespace-nowrap transition-colors snap-start ${
                            activeTab === tab
                                ? 'border-brand-blue text-brand-blue'
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'Overview' && (
                <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto safe-pad-b bg-secondary">
                    
                    {/* Section 1 - Profile Card */}
                    <div className="bg-primary p-6 border-b border-brand-blue/10 flex items-center gap-6">
                        <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center rounded-[20px] bg-secondary text-text-primary overflow-hidden shadow-inner border border-brand-blue/10">
                            <span className="text-3xl font-black opacity-30">
                                {safePlayer?.name?.substring(0, 2).toUpperCase() || 'UN'}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">{safePlayer?.name || 'Unknown Player'}</h2>
                            <p className="text-sm font-bold text-brand-blue mt-1">{safePlayer?.role || '-'}</p>
                            <p className="text-sm font-medium text-text-secondary mt-0.5">{team?.name || 'No Team Assigned'}</p>
                        </div>
                    </div>

                    {/* Section 2 - Information Card */}
                    <div className="p-4">
                        <div className="bg-primary rounded-[20px] border border-brand-blue/10 shadow-sm overflow-hidden text-sm">
                            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-gray-800">
                                <div className="p-4 flex flex-col justify-center">
                                    <span className="text-xs text-text-secondary font-medium mb-1">Date of Birth</span>
                                    <span className="font-bold text-text-primary">{PlayerInfo?.dob || 'Not Available'}</span>
                                </div>
                                <div className="p-4 flex flex-col justify-center">
                                    <span className="text-xs text-text-secondary font-medium mb-1">Current Team</span>
                                    <span className="font-bold text-text-primary">{team?.name || 'No Team Assigned'}</span>
                                </div>
                                <div className="p-4 flex flex-col justify-center">
                                    <span className="text-xs text-text-secondary font-medium mb-1">Man of the Match</span>
                                    <span className="font-bold text-text-primary">{momCount} Times</span>
                                </div>
                                <div className="p-4 flex flex-col justify-center">
                                    <span className="text-xs text-text-secondary font-medium mb-1">Current Match Status</span>
                                    
                                    {liveMatchContext ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-brand-blue">{liveMatchContext.stateStatus}</span>
                                            <span className="text-[10px] text-text-secondary leading-tight mt-0.5">{liveMatchContext.matchTitle}</span>
                                            {liveMatchContext.battingString && <span className="font-bold text-xs mt-1">{liveMatchContext.battingString}</span>}
                                            {liveMatchContext.bowlingString && <span className="font-bold text-xs mt-1">{liveMatchContext.bowlingString}</span>}
                                        </div>
                                    ) : (
                                        <span className="font-bold text-text-primary">No Active Match</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3 - Recent Performance */}
                    <div className="p-4 pt-0">
                        <h3 className="font-black text-lg text-text-primary mb-3">Recent Performance</h3>
                        {recentPerformances.length > 0 ? (
                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 snap-x">
                                {recentPerformances.map(perf => (
                                    <div key={perf.id} className="min-w-[160px] snap-start flex-shrink-0 bg-primary border border-brand-blue/10 rounded-[16px] p-5 flex flex-col justify-center items-center text-center shadow-sm">
                                        <span className="font-black text-lg text-text-primary mb-1">{perf.display}</span>
                                        <span className="text-xs font-medium text-text-secondary tracking-wide uppercase">vs {perf.opponent}</span>
                                        <span className="text-[11px] text-text-secondary mt-3 opacity-60 font-medium">{perf.date}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-primary border border-brand-blue/10 rounded-[20px] text-center shadow-sm text-sm font-medium text-text-secondary">
                                No Match History Available
                            </div>
                        )}
                    </div>

                </div>
            )}

            
            {/* Stats Tab Content */}
            {activeTab === 'Stats' && (
                <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto safe-pad-b bg-secondary">
                    {playerStats.overallMatches === 0 ? (
                        <div className="p-6 m-4 text-center text-sm font-medium text-text-secondary bg-primary rounded-[20px] shadow-sm border border-brand-blue/10">
                            No career stats available yet.
                        </div>
                    ) : (
                        <div className="p-4 flex flex-col gap-4">
                            {/* Stats Filter Segmented Control */}
                            <div className="flex bg-primary rounded-xl p-1 shadow-sm border border-brand-blue/10 overflow-x-auto no-scrollbar">
                                {['Batting', 'Bowling', 'Fielding', ...(playerStats.keeping.isRelevant ? ['Keeping'] : [])].map(section => (
                                    <button
                                        key={section}
                                        onClick={() => setStatSection(section as 'Batting' | 'Bowling' | 'Fielding' | 'Keeping')}
                                        className={`flex-1 min-w-[80px] py-1.5 px-3 rounded-lg text-sm font-bold transition-colors ${
                                            statSection === section
                                                ? 'bg-secondary text-text-primary shadow-sm border border-brand-blue/10'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        {section}
                                    </button>
                                ))}
                            </div>

                            {/* Batting Grid */}
                            {statSection === 'Batting' && (
                                <div className="bg-primary rounded-[20px] shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-800 text-center">
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Matches</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.matches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Innings</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.innings}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Runs</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.runs}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Average</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.average}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Strike Rate</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.strikeRate}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Highest Score</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.highest}{playerStats.batting.highestNotOut ? '*' : ''}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">MOM</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.mom}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">4s</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.fours}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">6s</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.sixes}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">30s</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.thirties}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">50s</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.fifties}</span>
                                        </div>
                                        {playerStats.batting.hundreds > 0 && (
                                            <div className="p-4 flex flex-col justify-center">
                                                <span className="text-xs text-text-secondary font-medium mb-1">100s</span>
                                                <span className="font-bold text-text-primary text-base">{playerStats.batting.hundreds}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bowling Grid */}
                            {statSection === 'Bowling' && (
                                <div className="bg-primary rounded-[20px] shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-800 text-center">
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Matches</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.matches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Innings</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.innings}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Overs</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.overs}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Balls Bowled</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.balls}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Runs Conceded</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.runs}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Wickets</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.wickets}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Average</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.average}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Economy</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.economy}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Strike Rate</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.strikeRate}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">3W</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.threeW}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">4W</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.fourW}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">MOM</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.mom}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fielding Grid */}
                            {statSection === 'Fielding' && (
                                <div className="bg-primary rounded-[20px] shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-800 text-center">
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Catches</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.fielding.catches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Run Outs</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.fielding.runOuts}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">MOM</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.mom}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Keeping Grid */}
                            {statSection === 'Keeping' && (
                                <div className="bg-primary rounded-[20px] shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-800 text-center">
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Matches as WK</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.keeping.matches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Catches</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.keeping.catches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Stumpings</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.keeping.stumpings}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Run Outs</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.keeping.runOuts}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">MOM</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.mom}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}

            {/* Teams Tab Content */}
            {activeTab === 'Teams' && (
                <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto safe-pad-b bg-secondary">
                    <div className="p-4">
                        <div className="bg-primary rounded-[20px] border border-brand-blue/10 shadow-sm overflow-hidden flex flex-col">
                            {linkedTeams.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {linkedTeams.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-4 bg-primary hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 cursor-pointer transition-colors select-none">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-[10px] bg-secondary text-text-primary overflow-hidden shadow-inner border border-brand-blue/10">
                                                    <span className="text-sm font-black opacity-30">
                                                        {t.name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-[15px] font-bold text-text-primary">{t.name}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-text-secondary opacity-50" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-sm font-medium text-text-secondary">
                                    No teams found for this player.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Other Tabs Content */}
            {activeTab !== 'Overview' && activeTab !== 'Teams' && activeTab !== 'Stats' && (
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 bg-primary border-b border-brand-blue/15">
                    <div className="flex flex-col items-center justify-center mb-6 mt-4">
                        <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-secondary text-text-primary overflow-hidden shadow-inner border border-brand-blue/10 mb-4">
                            <div className="w-full h-full flex flex-col items-center justify-center scale-150">
                                {getRoleIcon(player?.role)}
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary text-center">
                            {player?.name || 'Unknown Player'}
                        </h2>
                        <p className="text-sm text-text-secondary mt-1 text-center">
                            {team?.name || 'Unknown Team'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-secondary p-4 rounded-xl border border-brand-blue/10 flex flex-col">
                            <span className="text-xs text-text-secondary block font-medium mb-1">Role</span>
                            <span className="text-sm text-text-primary font-bold">{player?.role || 'Role not set'}</span>
                        </div>
                        {player?.number !== undefined && (
                            <div className="bg-secondary p-4 rounded-xl border border-brand-blue/10 flex flex-col">
                                <span className="text-xs text-text-secondary block font-medium mb-1">Jersey Number</span>
                                <span className="text-sm text-text-primary font-bold">{player.number}</span>
                            </div>
                        )}
                        {player?.globalPlayerId && (
                            <div className="bg-secondary p-4 rounded-xl border border-brand-blue/10 flex flex-col min-w-0">
                                <span className="text-xs text-text-secondary block font-medium mb-1 truncate">Career</span>
                                <span className="text-xs text-brand-blue font-bold truncate">Profile Linked</span>
                            </div>
                        )}
                        {(isCaptain || isViceCaptain || player?.role === 'Wicket Keeper') && (
                            <div className="bg-secondary p-4 rounded-xl border border-brand-blue/10 flex flex-col min-w-0">
                                <span className="text-xs text-text-secondary block font-medium mb-1">Tags</span>
                                <div className="flex gap-2">
                                    {isCaptain && <span className="inline-block text-[10px] font-bold text-warning bg-warning/100/20 px-2 py-0.5 rounded-2xl border border-warning/30">C</span>}
                                    {isViceCaptain && <span className="inline-block text-[10px] font-bold text-slate-600 bg-gray-500/20 px-2 py-0.5 rounded-2xl border border-gray-400">VC</span>}
                                    {player?.role === 'Wicket Keeper' && <span className="inline-block text-[10px] font-bold text-purple-600 bg-purple-500/20 px-2 py-0.5 rounded-2xl border border-purple-400">WK</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {match ? (
                        <>
                            {/* Match Context */}
                            <div className="bg-primary rounded-xl border border-brand-blue/10 overflow-hidden shadow-sm">
                                <div className="px-4 py-3 border-b border-brand-blue/10 bg-brand-blue/5 flex items-center gap-2">
                                    <Info size={16} className="text-brand-blue" />
                                    <h3 className="font-bold text-sm text-brand-blue">Match Context</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-text-secondary">Match Name</span>
                                        <span className="text-sm font-medium text-text-primary text-right">{matchName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-text-secondary">Match Type</span>
                                        <span className="text-sm font-medium text-text-primary">{match?.isQuickMatch ? 'Quick Match' : 'Tournament Match'}</span>
                                    </div>
                                    {tournament?.name && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-text-secondary">Tournament</span>
                                            <span className="text-sm font-medium text-text-primary text-right">{tournament.name}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-sm text-text-secondary">Status</span>
                                        <span className="text-sm font-medium text-text-primary capitalize">{match?.status}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Participation Snapshot */}
                            <div className="bg-primary rounded-xl border border-brand-blue/10 overflow-hidden shadow-sm">
                                <div className="px-4 py-3 border-b border-brand-blue/10 bg-brand-blue/5 flex items-center gap-2">
                                    <Info size={16} className="text-brand-blue" />
                                    <h3 className="font-bold text-sm text-brand-blue">Participation Snapshot</h3>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
                                    <div className="p-3 flex justify-between items-center bg-primary">
                                        <span className="text-xs text-text-secondary">Has Batted</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${hasBatted ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{hasBatted ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="p-3 flex justify-between items-center bg-primary">
                                        <span className="text-xs text-text-secondary">Has Bowled</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${hasBowled ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{hasBowled ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="p-3 flex justify-between items-center bg-primary">
                                        <span className="text-xs text-text-secondary">Is Out</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isOut ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{isOut ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="p-3 flex justify-between items-center bg-primary">
                                        <span className="text-xs text-text-secondary">Current Batter</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isCurrentBatter ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{isCurrentBatter ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="p-3 flex justify-between items-center bg-primary">
                                        <span className="text-xs text-text-secondary">Current Bowler</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${isCurrentBowler ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-secondary text-text-secondary border-gray-200 dark:border-gray-700'}`}>{isCurrentBowler ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-primary rounded-xl border border-brand-blue/10 overflow-hidden shadow-sm p-6 text-center">
                            <Info size={24} className="text-brand-blue/50 mx-auto mb-2" />
                            <h3 className="font-bold text-sm text-text-primary mb-1">Global Player View</h3>
                            <p className="text-xs text-text-secondary">Match-specific stats are not available from this view.</p>
                        </div>
                    )}

                    {/* Notes Section */}
                    {(retiredNote || replacementNote) && (
                        <div className="bg-primary rounded-xl border border-brand-blue/10 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 border-b border-brand-blue/10 bg-brand-blue/5 flex items-center gap-2">
                                <Info size={16} className="text-brand-blue" />
                                <h3 className="font-bold text-sm text-brand-blue">Notes</h3>
                            </div>
                            <div className="p-4 space-y-3">
                                {retiredNote && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200/50 dark:border-yellow-900/30">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Retired: {retiredNote}</p>
                                    </div>
                                )}
                                {replacementNote && (
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200/50 dark:border-blue-900/30">
                                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{replacementNote}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                </div>
            </div>
            )}
        </div>
    );
};

const PlayerDetailsForm: React.FC<PlayerDetailsPageProps> = ({
    player,
    team,
    match,
    tournament,
    tournamentId,
    isMatchLive = false,
    updateTeam,
    updateMatch,
    onBack,
    mode
}) => {
    const { showNotification } = useNotification();
    
    const { isLocked } = useTeamLock(team.id, match ? [match] : [], tournamentId, isMatchLive); 
    const isAdding = mode === 'add';

    const maxPlayers = useMemo(() => {
        return getMaxPlayers(match, tournament);
    }, [match, tournament]);

    const [editName, setEditName] = useState(player?.name || '');
    const [editNumber, setEditNumber] = useState<number | string>(player?.number !== undefined ? player.number : '');
    const [editRole, setEditRole] = useState(player?.role || 'Batsman');
    const [editIsCaptain, setEditIsCaptain] = useState(player ? player.id === team.captainId : false);
    const [editIsViceCaptain, setEditIsViceCaptain] = useState(player ? player.id === team.viceCaptainId : false);
    const [errors, setErrors] = useState<{name: string | null, number: string | null, role: string | null}>({name: null, number: null, role: null});

    const handleSave = () => {
        if (isLocked) {
             showNotification('Team roster is locked.', 'error');
             return;
        }

        const filteredPlayers = isAdding ? team.players : team.players.filter(p => p.id !== player?.id);
        const validation = validatePlayer(editName, editNumber, editRole, filteredPlayers);
        
        if (!validation.valid) {
            setErrors(validation.errors as {name: string | null, number: string | null, role: string | null});
            showNotification('Please fix errors before saving.', 'error');
            return;
        }
        
        const newPlayerId = isAdding ? crypto.randomUUID() : player!.id;
        const newPlayer: Player = {
            id: newPlayerId,
            name: editName.trim(),
            number: Number(editNumber),
            role: editRole as PlayerRole,
            globalPlayerId: isAdding ? newPlayerId : player?.globalPlayerId
        };

        const updatedTeam = { ...team };
        if (isAdding) {
             updatedTeam.players = [...team.players, newPlayer];
        } else {
             updatedTeam.players = team.players.map(p => p.id === newPlayerId ? newPlayer : p);
        }

        if (editIsCaptain) {
            if (updatedTeam.viceCaptainId === newPlayerId) updatedTeam.viceCaptainId = null;
            updatedTeam.captainId = newPlayerId;
        } else if (updatedTeam.captainId === newPlayerId) {
            updatedTeam.captainId = null;
        }

        if (editIsViceCaptain) {
            if (updatedTeam.captainId === newPlayerId) updatedTeam.captainId = null;
            updatedTeam.viceCaptainId = newPlayerId;
        } else if (updatedTeam.viceCaptainId === newPlayerId) {
            updatedTeam.viceCaptainId = null;
        }
        
        if (updateTeam) updateTeam(updatedTeam);

        // If Adding new player during a Match setup, automatically add to the match squad if there is space
        if (isAdding && match && updateMatch) {
            const isTeam1 = match.team1Id === team.id;
            const currentSquadIds = isTeam1 ? (match.team1SquadIds || []) : (match.team2SquadIds || []);
            
            if (currentSquadIds.length < maxPlayers) {
                updateMatch(match.id, {
                    [isTeam1 ? 'team1SquadIds' : 'team2SquadIds']: [...currentSquadIds, newPlayerId]
                });
            }
        }
        
        showNotification(isAdding ? 'Player added successfully.' : 'Player updated successfully.', 'success');
        onBack();
    };

    return (
        <div className="relative w-full h-full bg-secondary flex flex-col select-none safe-pad-t safe-pad-r safe-pad-l">
            <div className="flex items-center justify-between p-4 bg-primary text-text-primary border-b border-brand-blue/15 relative">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors z-10 text-text-secondary active:scale-95 touch-manipulation">
                    <X size={24} />
                </button>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="font-bold text-lg text-text-primary">{isAdding ? 'Add Player' : 'Edit Player'}</span>
                </div>
                <div className="w-10"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto p-4 space-y-6 pb-28">
                 {isLocked && (
                    <div className="p-4 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 rounded-xl text-sm border border-yellow-200 dark:border-yellow-800/50">
                        Roster editing is locked because the match has started or toss has been completed.
                    </div>
                 )}
                 
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Name</label>
                    <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)} 
                        disabled={isLocked} 
                        className="w-full bg-primary border border-brand-blue/15 rounded-xl px-4 py-3 text-text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all" 
                        placeholder="Player Name" 
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Jersey Number</label>
                    <input 
                        type="number" 
                        value={editNumber} 
                        onChange={(e) => setEditNumber(e.target.value)} 
                        disabled={isLocked} 
                        className="w-full bg-primary border border-brand-blue/15 rounded-xl px-4 py-3 text-text-primary outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all" 
                        placeholder="Jersey #" 
                    />
                    {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                        {PLAYER_ROLES.map(role => (
                            <button 
                                key={role} 
                                disabled={isLocked} 
                                onClick={() => setEditRole(role)} 
                                className={`py-3 px-3 rounded-xl border text-sm font-bold transition-colors ${editRole === role ? 'bg-brand-blue/10 border-brand-blue text-brand-blue shadow-sm' : 'bg-primary border-brand-blue/15 text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    <label className={`flex items-center gap-3 p-4 bg-primary rounded-xl border transition-colors ${editIsCaptain ? 'border-brand-blue/40 bg-brand-blue/5' : 'border-brand-blue/10 hover:bg-slate-50 dark:hover:bg-slate-800'} ${isLocked ? 'opacity-70' : 'cursor-pointer'}`}>
                        <input type="checkbox" disabled={isLocked} checked={editIsCaptain} onChange={(e) => { setEditIsCaptain(e.target.checked); if (e.target.checked) setEditIsViceCaptain(false); }} className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"/>
                        <span className="text-text-primary font-bold">Captain</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 bg-primary rounded-xl border transition-colors ${editIsViceCaptain ? 'border-brand-blue/40 bg-brand-blue/5' : 'border-brand-blue/10 hover:bg-slate-50 dark:hover:bg-slate-800'} ${isLocked ? 'opacity-70' : 'cursor-pointer'}`}>
                        <input type="checkbox" disabled={isLocked} checked={editIsViceCaptain} onChange={(e) => { setEditIsViceCaptain(e.target.checked); if (e.target.checked) setEditIsCaptain(false); }} className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"/>
                        <span className="text-text-primary font-bold">Vice Captain</span>
                    </label>
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-primary/80 backdrop-blur-md border-t border-brand-blue/15 safe-pad-b z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <button onClick={onBack} className="flex-1 py-4 font-bold rounded-xl bg-secondary text-text-primary border border-gray-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-sm">Cancel</button>
                    {!isLocked && <button onClick={handleSave} className="flex-1 py-4 font-bold rounded-xl bg-brand-blue text-white hover:bg-blue-600 active:scale-95 transition-all text-sm shadow-md shadow-brand-blue/20">Save Player</button>}
                </div>
            </div>
        </div>
    );
};

const PlayerDetailsPage: React.FC<PlayerDetailsPageProps> = (props) => {
    const isFormMode = props.mode === 'add' || props.mode === 'edit';
    
    if (isFormMode) {
        return <PlayerDetailsForm {...props} />;
    }
    
    if (!props.player) return null; // Safety catch
    
    return <PlayerDetailsView {...props} />;
};

export default PlayerDetailsPage;
