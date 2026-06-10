import type { Innings, Ball, Match, Team, PlayerCareerStats, Performance, PointsTableData, BatsmanScore } from '../types';
import { BattingStatus, WicketType } from '../types';

export const calculateStrikeRate = (runs: number, balls: number): string => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 100).toFixed(2);
};

export const calculateEconomy = (runs: number, overs: number): string => {
    if (overs === 0) return '0.00';
    return (runs / overs).toFixed(2);
};

export const formatOvers = (balls: number): number => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return parseFloat(`${overs}.${remainingBalls}`);
};

export const oversToBalls = (overs: number): number => {
    if (!overs) return 0;
    const oversInt = Math.floor(overs);
    const balls = Math.round((overs - oversInt) * 10);
    return oversInt * 6 + balls;
};

export const calculateRunRate = (runs: number, oversInXyFormat: number): string => {
    const balls = oversToBalls(oversInXyFormat);
    if (balls === 0) return '0.00';
    return ((runs / balls) * 6).toFixed(2);
};

// A simplified function to update innings state after a ball
export const calculateStats = (innings: Innings, ballInput: Omit<Ball, 'ballNumber' | 'overNumber'>): { updatedInnings: Innings } => {
    if (innings.wickets >= 10) {
        console.warn('[RuntimeValidation] Innings already complete (10 wickets). Ball rejected.');
        return { updatedInnings: innings };
    }
    if (ballInput.runs < 0) {
        console.warn(`[RuntimeValidation] Impossible delivery: Negative runs (${ballInput.runs}).`);
        return { updatedInnings: innings };
    }
    if (ballInput.isWide && (ballInput.isBye || ballInput.isLegBye)) {
        console.warn('[RuntimeValidation] Impossible delivery: Wide combined with Bye/LegBye.');
        return { updatedInnings: innings };
    }

    const wasFreeHit = innings.isFreeHit; // Capture free hit state before this ball
    const updatedInnings: Innings = {
        ...innings,
        balls: [...innings.balls],
        batsmanScores: { ...innings.batsmanScores },
        bowlerScores: { ...innings.bowlerScores },
        currentBatsmen: [...innings.currentBatsmen],
    };
    
    const isLegalDelivery = !ballInput.isWide && !ballInput.isNoBall;

    // A free hit is only "consumed" by a legal delivery.
    // If the free hit ball is a wide or another no ball, the free hit state carries over.
    if (wasFreeHit && isLegalDelivery) {
        updatedInnings.isFreeHit = false;
    }

    // Correctly calculate over and ball number based on legal deliveries
    const legalBallsSoFar = updatedInnings.balls.filter(b => !b.isWide && !b.isNoBall).length;
    const overNumber = Math.floor(legalBallsSoFar / 6) + 1;
    const ballNumber = (legalBallsSoFar % 6) + 1;

    const newBall: Ball = {
        ...ballInput,
        overNumber,
        ballNumber,
    };
    
    // Update Wickets - This check must happen BEFORE the ball is added to the array
    // so we can nullify the wicket if it's not allowed by the rules.
    if (newBall.isWicket && newBall.wicket) {
        let isWicketAllowed = true;

        // Rule for Wide ball: only Run Out, Stumped, Hit Wicket are valid.
        if (newBall.isWide) {
            const validWideDismissals = [WicketType.RUN_OUT, WicketType.STUMPED, WicketType.HIT_WICKET];
            if (!validWideDismissals.includes(newBall.wicket.type)) {
                isWicketAllowed = false;
            }
        }
        
        // Rule for No Ball or Free Hit: only Run Out is valid.
        if (isWicketAllowed && (wasFreeHit || newBall.isNoBall)) {
            if (newBall.wicket.type !== WicketType.RUN_OUT) {
                 isWicketAllowed = false;
            }
        }
        
        if (isWicketAllowed) {
            updatedInnings.wickets += 1;
            const dismissedPlayerId = newBall.wicket.playerId;
            
            if (updatedInnings.batsmanScores[dismissedPlayerId]) {
                updatedInnings.batsmanScores[dismissedPlayerId] = { ...updatedInnings.batsmanScores[dismissedPlayerId] };
            }
            const batsmanStat = updatedInnings.batsmanScores[dismissedPlayerId];

            if(batsmanStat) {
                batsmanStat.status = BattingStatus.OUT;
                 batsmanStat.outDetails = {
                    bowlerId: newBall.bowlerId,
                    type: newBall.wicket.type,
                    fielders: newBall.wicket.fielderIds,
                };
                // When a batsman is out, their position at the crease must be vacated
                if (updatedInnings.currentBatsmen[0] === dismissedPlayerId) {
                    updatedInnings.currentBatsmen[0] = ''; // Clear on-strike batsman
                } else if (updatedInnings.currentBatsmen[1] === dismissedPlayerId) {
                    updatedInnings.currentBatsmen[1] = null; // Clear non-strike batsman
                }
            }
            // Credit wicket to bowler for specific dismissal types
            const bowlerId = newBall.bowlerId;
            if (!updatedInnings.bowlerScores[bowlerId]) {
                updatedInnings.bowlerScores[bowlerId] = { playerId: bowlerId, overs: 0, maidens: 0, runsConceded: 0, wickets: 0 };
            } else {
                updatedInnings.bowlerScores[bowlerId] = { ...updatedInnings.bowlerScores[bowlerId] };
            }
            const bowlerStat = updatedInnings.bowlerScores[bowlerId];
            const bowlerWicketTypes = [
                WicketType.BOWLED,
                WicketType.CAUGHT,
                WicketType.LBW,
                WicketType.STUMPED,
                WicketType.HIT_WICKET,
            ];
            if (bowlerWicketTypes.includes(newBall.wicket.type)) {
                bowlerStat.wickets++;
            }
        } else {
            // If wicket is not allowed, ensure ball data is clean
            newBall.isWicket = false;
            delete newBall.wicket;
        }
    }
    
    updatedInnings.balls.push(newBall);

    // Update Score
    let runsOnThisBall = newBall.runs;
    if (newBall.isWide || newBall.isNoBall) {
        runsOnThisBall += 1;
    }

    // Ensure batsman stat exists
    const batsmanId = newBall.batsmanId;
    if (!updatedInnings.batsmanScores[batsmanId]) {
        updatedInnings.batsmanScores[batsmanId] = { playerId: batsmanId, runs: 0, balls: 0, fours: 0, sixes: 0, status: BattingStatus.NOT_OUT };
    } else {
        updatedInnings.batsmanScores[batsmanId] = { ...updatedInnings.batsmanScores[batsmanId] };
    }
    const batsmanStat = updatedInnings.batsmanScores[batsmanId];

    // Add runs to batsman
    if (!newBall.isBye && !newBall.isLegBye && !newBall.isWide) {
        batsmanStat.runs += newBall.runs;
        if(newBall.runs === 4) batsmanStat.fours++;
        if(newBall.runs === 6) batsmanStat.sixes++;
    }

    // Balls faced: All balls except wides count as a ball faced
    if (!newBall.isWide) {
        batsmanStat.balls++;
    }

    updatedInnings.score += runsOnThisBall;
    
    // Update bowler score
    const bowlerId = newBall.bowlerId;
     if (!updatedInnings.bowlerScores[bowlerId]) {
        updatedInnings.bowlerScores[bowlerId] = { playerId: bowlerId, overs: 0, maidens: 0, runsConceded: 0, wickets: 0 };
    } else {
        updatedInnings.bowlerScores[bowlerId] = { ...updatedInnings.bowlerScores[bowlerId] };
    }
    const bowlerStat = updatedInnings.bowlerScores[bowlerId];
    if(isLegalDelivery) {
        const currentBowlerBalls = updatedInnings.balls.filter(b => b.bowlerId === bowlerId && !b.isWide && !b.isNoBall).length;
        bowlerStat.overs = formatOvers(currentBowlerBalls);
    }
    let concededThisBall = 0;
    if (newBall.isWide || newBall.isNoBall) {
        concededThisBall += 1; // Penalty run
    }
    if (!newBall.isBye && !newBall.isLegBye) {
        concededThisBall += newBall.runs;
    }
    bowlerStat.runsConceded += concededThisBall;

    // Update total overs
    const validBalls = updatedInnings.balls.filter(b => !b.isWide && !b.isNoBall).length;
    updatedInnings.overs = formatOvers(validBalls);

    // Over ends after 6 legal deliveries.
    const isOverEnd = isLegalDelivery && (validBalls % 6 === 0) && validBalls > 0;

    // --- Automatic Strike & Bowler Rotation Logic ---
    let [newOnStrike, newNonStriker] = updatedInnings.currentBatsmen;

    // 1. Swap for runs if no wicket
    if (!newBall.isWicket && newOnStrike && newNonStriker) {
        const batsmenCrossed = newBall.runs > 0 && newBall.runs % 2 !== 0;
        if (batsmenCrossed) {
            [newOnStrike, newNonStriker] = [newNonStriker, newOnStrike];
        }
    }

    // 2. Wicket run-out crossing logic isn't fully trackable without UI for it, 
    // but we MUST swap at the end of the over regardless of wickets.
    if (isOverEnd) {
        [newOnStrike, newNonStriker] = [newNonStriker, newOnStrike];
    }
    
    updatedInnings.currentBatsmen = [newOnStrike, newNonStriker];
    
    if(isOverEnd) {
        const ballsInCompletedOver = [];
        let legalBallCount = 0;
        for (let i = updatedInnings.balls.length - 1; i >= 0; i--) {
            const ballToExamine = updatedInnings.balls[i];
            ballsInCompletedOver.unshift(ballToExamine);
            if (!ballToExamine.isWide && !ballToExamine.isNoBall) {
                legalBallCount++;
            }
            if (legalBallCount >= 6) {
                break;
            }
        }

        const allSameBowler = ballsInCompletedOver.length > 0 && ballsInCompletedOver.every(b => b.bowlerId === bowlerId);
        
        if (allSameBowler) {
            const runsInOver = ballsInCompletedOver.reduce((total, b) => {
                let runsThisBall = 0;
                if (b.isWide || b.isNoBall) {
                    runsThisBall += 1; // Penalty run counts against bowler
                }
                // Runs scored off the bat (not byes or leg byes) count against the bowler
                if (!b.isBye && !b.isLegBye) {
                    runsThisBall += b.runs;
                }
                return total + runsThisBall;
            }, 0);

            if (runsInOver === 0) {
                bowlerStat.maidens++;
            }
        }

        updatedInnings.lastBowlerId = updatedInnings.currentBowler;
        updatedInnings.currentBowler = null;
    }

    return { updatedInnings };
};

export const rebuildInnings = (originalInnings: Innings, balls: Ball[]): Innings => {
    // Create a fresh innings state, using the initial player setup
    const freshInnings: Innings = {
        battingTeamId: originalInnings.battingTeamId,
        bowlingTeamId: originalInnings.bowlingTeamId,
        score: 0,
        wickets: 0,
        overs: 0,
        balls: [],
        batsmanScores: {},
        bowlerScores: {},
        lastBowlerId: null,
        // Use initial players as the starting point for recalculation
        currentBatsmen: originalInnings.initialBatsmen || ['', null],
        currentBowler: originalInnings.initialBowler || null,
        // Preserve the initial state itself
        initialBatsmen: originalInnings.initialBatsmen,
        initialBowler: originalInnings.initialBowler,
        manualOverrides: originalInnings.manualOverrides || [],
    };

    // Reprocess every ball to reconstruct the state accurately
    const rebuiltInnings = balls.reduce(
        (acc, ball, index) => {
        const inningsWithOverride = { ...acc };
            // Find override that should be applied BEFORE this ball is processed
            const override = originalInnings.manualOverrides?.find(o => o.ballIndex === index);
            if (override) {
                inningsWithOverride.currentBatsmen = override.batsmen;
                inningsWithOverride.currentBowler = override.bowler;
            }
            return calculateStats(inningsWithOverride, ball).updatedInnings;
        },
        freshInnings
    );

    // FIX: After rebuilding, if the innings is mid-over, the current bowler was
    // not being correctly restored. This logic ensures the bowler from the
    // last valid ball is set as the current bowler.
    if (balls.length > 0) {
        const legalBallsSoFar = balls.filter(b => !b.isWide && !b.isNoBall).length;
        const isMidOver = legalBallsSoFar > 0 && legalBallsSoFar % 6 !== 0;

        if (isMidOver) {
            const lastBall = balls[balls.length - 1];
            rebuiltInnings.currentBowler = lastBall.bowlerId;
        }
    }

    // After all balls are processed, check for a final override.
    // This restores any manual selection that was made for the upcoming (now deleted) ball.
    const finalOverride = originalInnings.manualOverrides?.find(o => o.ballIndex === balls.length);
    if (finalOverride) {
        rebuiltInnings.currentBatsmen = finalOverride.batsmen;
        rebuiltInnings.currentBowler = finalOverride.bowler;
    }


    return rebuiltInnings;
};


export const calculatePlayerCareerStats = (playerId: string, matches: Match[]): PlayerCareerStats => {
    const stats: PlayerCareerStats = {
        matches: 0,
        inningsBatted: 0, notOuts: 0, runsScored: 0, ballsFaced: 0, highScore: 0,
        battingAverage: '0.00', strikeRate: '0.00', hundreds: 0, fifties: 0, thirties: 0, fours: 0, sixes: 0,
        inningsBowled: 0, ballsBowled: 0, oversBowled: '0.0', runsConceded: 0, wicketsTaken: 0, maidens: 0,
        bowlingAverage: '0.00', economyRate: '0.00', bestBowlingInnings: 'N/A',
    };

    let bestWickets = 0;
    let bestRuns = Infinity;

    const completedMatches = matches.filter(m => m.status === 'completed');

    for (const match of completedMatches) {
        let playedInMatch = false;
        const innings = [match.innings1, match.innings2].filter((i): i is Innings => !!i);

        for (const inning of innings) {
            // Batting stats
            const battingPerf = inning.batsmanScores[playerId];
            if (battingPerf) {
                playedInMatch = true;
                stats.inningsBatted++;
                stats.runsScored += battingPerf.runs;
                stats.ballsFaced += battingPerf.balls;
                stats.fours += battingPerf.fours;
                stats.sixes += battingPerf.sixes;
                if (battingPerf.status !== BattingStatus.OUT) stats.notOuts++;
                if (battingPerf.runs > stats.highScore) stats.highScore = battingPerf.runs;
                if (battingPerf.runs >= 100) stats.hundreds++;
                else if (battingPerf.runs >= 50) stats.fifties++;
                else if (battingPerf.runs >= 30) stats.thirties++;
            }

            // Bowling stats
            const bowlingPerf = inning.bowlerScores[playerId];
            if (bowlingPerf) {
                playedInMatch = true;
                stats.inningsBowled++;
                stats.runsConceded += bowlingPerf.runsConceded;
                stats.wicketsTaken += bowlingPerf.wickets;
                stats.maidens += bowlingPerf.maidens;
                const oversParts = String(bowlingPerf.overs).split('.');
                const fullOvers = parseInt(oversParts[0]) || 0;
                const partialBalls = parseInt(oversParts[1]) || 0;
                stats.ballsBowled += (fullOvers * 6) + partialBalls;

                if (bowlingPerf.wickets > bestWickets || (bowlingPerf.wickets === bestWickets && bowlingPerf.runsConceded < bestRuns)) {
                    bestWickets = bowlingPerf.wickets;
                    bestRuns = bowlingPerf.runsConceded;
                    stats.bestBowlingInnings = `${bestWickets}/${bestRuns}`;
                }
            }
        }
        if (playedInMatch) stats.matches++;
    }

    // Calculate derived stats
    const outs = stats.inningsBatted - stats.notOuts;
    stats.battingAverage = outs > 0 ? (stats.runsScored / outs).toFixed(2) : stats.runsScored.toFixed(2);
    stats.strikeRate = calculateStrikeRate(stats.runsScored, stats.ballsFaced);
    
    stats.oversBowled = formatOvers(stats.ballsBowled).toFixed(1);
    stats.economyRate = calculateEconomy(stats.runsConceded, stats.ballsBowled / 6);
    stats.bowlingAverage = stats.wicketsTaken > 0 ? (stats.runsConceded / stats.wicketsTaken).toFixed(2) : '0.00';

    return stats;
};

export const getTopPerformers = (match: Match, teams: Team[]): Performance[] => {
    if (match.status !== 'completed' || !match.innings1) return [];

    const allPlayers = teams.flatMap(t => t.players);
    const performances: Performance[] = [];
    const innings = [match.innings1, match.innings2].filter((i): i is Innings => !!i);

    for (const player of allPlayers) {
        let performanceScore = 0;
        let battingSummary = '';
        let bowlingSummary = '';
        let partOfMatch = false;

        for (const inning of innings) {
            const battingPerf = inning.batsmanScores[player.id];
            if (battingPerf) {
                partOfMatch = true;
                // Batting points: 1 per run, 25 for 50, 50 for 100, 15 for high SR not out
                performanceScore += battingPerf.runs;
                if (battingPerf.runs >= 100) performanceScore += 50;
                else if (battingPerf.runs >= 50) performanceScore += 25;

                const sr = parseFloat(calculateStrikeRate(battingPerf.runs, battingPerf.balls));
                if (sr > 150 && battingPerf.balls > 10) performanceScore += 15;
                if (battingPerf.status !== BattingStatus.OUT && battingPerf.runs > 20) performanceScore += 10;
                
                battingSummary = `${battingPerf.runs}(${battingPerf.balls})`;
            }

            const bowlingPerf = inning.bowlerScores[player.id];
            if (bowlingPerf) {
                partOfMatch = true;
                // Bowling points: 20 per wicket, 25 for 3wkts, 50 for 5wkts, 15 for good econ
                performanceScore += bowlingPerf.wickets * 20;
                if (bowlingPerf.wickets >= 5) performanceScore += 50;
                else if (bowlingPerf.wickets >= 3) performanceScore += 25;
                
                const econ = parseFloat(calculateEconomy(bowlingPerf.runsConceded, bowlingPerf.overs));
                if (econ <= 4.0 && bowlingPerf.overs >= (match.oversPerInnings / 5)) performanceScore += 20;
                
                bowlingSummary = `${bowlingPerf.wickets}/${bowlingPerf.runsConceded}`;
            }
        }
        
        if (partOfMatch) {
            const playerTeam = teams.find(t => t.players.some(p => p.id === player.id));
            if (playerTeam && playerTeam.id === match.winnerId) {
                performanceScore *= 1.25; // 25% bonus for winning team
            }

            performances.push({
                playerId: player.id,
                name: player.name,
                teamName: playerTeam?.name || 'N/A',
                score: performanceScore,
                battingStats: battingSummary,
                bowlingStats: bowlingSummary,
            });
        }
    }

    return performances.sort((a, b) => b.score - a.score).slice(0, 3);
};

export const determineWinner = (innings1: Innings, innings2: Innings): Team['id'] | 'draw' => {
    if (innings1.score > innings2.score) {
        return innings1.battingTeamId;
    }
    if (innings2.score > innings1.score) {
        return innings2.battingTeamId;
    }
    return 'draw';
};

export const getDismissalText = (
    outDetails: BatsmanScore['outDetails'], 
    getPlayerName: (id: string) => string
): string => {
    if (!outDetails) return '';
    const bowlerName = getPlayerName(outDetails.bowlerId);
    
    switch (outDetails.type) {
        case WicketType.BOWLED:
        case WicketType.LBW:
        case WicketType.HIT_WICKET:
            return `${outDetails.type.toLowerCase()} b ${bowlerName}`;
        case WicketType.CAUGHT: {
            const catcherName = outDetails.fielders?.[0] ? getPlayerName(outDetails.fielders[0]) : 'Fielder';
            return `c ${catcherName} b ${bowlerName}`;
        }
        case WicketType.STUMPED: {
            const keeperName = outDetails.fielders?.[0] ? getPlayerName(outDetails.fielders[0]) : 'Keeper';
            return `st ${keeperName} b ${bowlerName}`;
        }
        case WicketType.RUN_OUT: {
            const fielders = outDetails.fielders?.map(getPlayerName).join('/');
            return `run out (${fielders || 'Fielder'})`;
        }
        default:
            return `out`;
    }
};

const formatNRR = (nrr: number): string => {
    if (isNaN(nrr) || !isFinite(nrr)) {
        return '0.00';
    }
    return (nrr > 0 ? '+' : '') + nrr.toFixed(2);
};

export const calculatePointsTable = (
    relevantTeams: Team[],
    relevantMatches: Match[]
): PointsTableData[] => {
    if (relevantMatches.length === 0 || relevantTeams.length === 0) return [];

    const stats: Record<string, PointsTableData> = {};
    relevantTeams.forEach(team => {
        stats[team.id] = { teamId: team.id, teamName: team.name, logo: team.logo, played: 0, won: 0, lost: 0, drawn: 0, points: 0, nrr: '0.00' };
    });

    const nrrData: Record<string, { runsScored: number, ballsFaced: number, runsConceded: number, ballsBowled: number }> = {};
    relevantTeams.forEach(team => {
        nrrData[team.id] = { runsScored: 0, ballsFaced: 0, runsConceded: 0, ballsBowled: 0 };
    });

    relevantMatches.forEach(match => {
        const team1Id = match.team1Id;
        const team2Id = match.team2Id;

        if (!stats[team1Id] || !stats[team2Id]) return;

        stats[team1Id].played += 1;
        stats[team2Id].played += 1;

        if (match.wasAbandoned) {
            stats[team1Id].points += 1;
            stats[team2Id].points += 1;
            stats[team1Id].drawn += 1;
            stats[team2Id].drawn += 1;
            return;
        }

        if (match.winnerId && match.winnerId !== 'draw') {
            stats[match.winnerId].won += 1;
            stats[match.winnerId].points += 2;
            const loserId = team1Id === match.winnerId ? team2Id : team1Id;
            stats[loserId].lost += 1;
        } else {
            stats[team1Id].drawn += 1;
            stats[team2Id].drawn += 1;
            stats[team1Id].points += 1;
            stats[team2Id].points += 1;
        }

        const team1Score = match.innings1?.battingTeamId === team1Id ? match.innings1 : match.innings2;
        const team2Score = match.innings1?.battingTeamId === team2Id ? match.innings1 : match.innings2;

        if (team1Score) {
            nrrData[team1Id].runsScored += team1Score.score;
            const team1AllOut = team1Score.wickets >= 10;
            nrrData[team1Id].ballsFaced += team1AllOut ? match.oversPerInnings * 6 : oversToBalls(team1Score.overs);
        }
        if (team2Score) {
            nrrData[team1Id].runsConceded += team2Score.score;
            const team2AllOut = team2Score.wickets >= 10;
            nrrData[team1Id].ballsBowled += team2AllOut ? match.oversPerInnings * 6 : oversToBalls(team2Score.overs);
            
            nrrData[team2Id].runsScored += team2Score.score;
            nrrData[team2Id].ballsFaced += team2AllOut ? match.oversPerInnings * 6 : oversToBalls(team2Score.overs);

            if (team1Score) {
                nrrData[team2Id].runsConceded += team1Score.score;
                const team1AllOut = team1Score.wickets >= 10;
                nrrData[team2Id].ballsBowled += team1AllOut ? match.oversPerInnings * 6 : oversToBalls(team1Score.overs);
            }
        }
    });

    relevantTeams.forEach(team => {
        const data = nrrData[team.id];
        if (data.ballsFaced > 0 && data.ballsBowled > 0) {
            const scoringRate = (data.runsScored / data.ballsFaced) * 6;
            const concedingRate = (data.runsConceded / data.ballsBowled) * 6;
            const nrr = scoringRate - concedingRate;
            stats[team.id].nrr = formatNRR(nrr);
        }
    });

    return Object.values(stats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const nrrA = parseFloat(a.nrr);
        const nrrB = parseFloat(b.nrr);
        if (nrrB !== nrrA) return nrrB - nrrA;
        return a.teamName.localeCompare(b.teamName);
    });
};

export const getBallDisplay = (ball: Ball, isCurrent: boolean = false) => {
    let text = '';
    let className = 'w-7 h-7 rounded-full flex items-center justify-center font-medium leading-none tracking-tight ';
    let title = '';

    if (ball.isWicket) {
        text = 'W';
        if (ball.runs > 0) text = `${ball.runs}W`;
        className += 'bg-highlight text-white text-[11px]';
        title = `Wicket! ${ball.runs > 0 ? `+ ${ball.runs} run(s)` : ''}`;
    } else if (ball.isWide) {
        const totalRuns = ball.runs + 1;
        text = `${totalRuns}wd`;
        className += 'bg-yellow-400/80 text-text-primary text-[11px]';
        title = `${totalRuns} run(s) from wide`;
    } else if (ball.isNoBall) {
        text = `${ball.runs}nb`;
        className += 'bg-yellow-400/80 text-text-primary text-[11px]';
        title = `${ball.runs + 1} run(s) from no-ball`;
    } else if (ball.isBye) {
        text = `${ball.runs}b`;
        className += 'bg-gray-400 dark:bg-gray-600 text-white text-[11px]';
        title = `${ball.runs} bye(s)`;
    } else if (ball.isLegBye) {
        text = `${ball.runs}lb`;
        className += 'bg-gray-400 dark:bg-gray-600 text-white text-[11px]';
        title = `${ball.runs} leg bye(s)`;
    } else {
        // Normal delivery
        text = `${ball.runs}`;
        title = `${ball.runs} run(s)`;
        if (ball.runs === 6) {
             className += 'bg-purple-500 text-white text-[11px]';
        } else if (ball.runs === 4) {
             className += 'bg-brand-blue text-white text-[11px]';
        } else if (ball.runs <= 3) {
            if (isCurrent) {
                className += 'bg-brand-blue text-white text-[11px]';
            } else {
                className += 'bg-tertiary text-text-primary text-[11px]';
            }
            if (ball.runs === 0) {
                title = 'Dot ball';
            }
        } else {
             className += 'bg-tertiary text-text-primary text-[11px]';
        }
    }

    return { text, className, title };
};

export const getBallOutcomeChipClass = (ball: Ball): string => {
    if (ball.isWicket) {
        return "dark:!bg-danger dark:!text-white";
    }

    if (ball.isWide || ball.isNoBall || ball.isBye || ball.isLegBye) {
        return "dark:!bg-draft dark:!text-black";
    }

    if (ball.runs === 0) {
        return "dark:!bg-white dark:!text-black";
    }

    if ([1, 2, 3].includes(ball.runs)) {
         return "dark:!bg-accent dark:!text-black";
    }

    if (ball.runs === 4) {
        return "dark:!bg-info dark:!text-white";
    }

    if (ball.runs === 6) {
        return "dark:!bg-purple dark:!text-white";
    }

    return "dark:!bg-tertiary dark:!text-text-primary";
};

export const generateCommentaryForBall = (ball: Ball, getPlayerName: (id: string) => string): string => {
    const bowlerName = getPlayerName(ball.bowlerId).split(' ')[0] || '';
    const batsmanName = getPlayerName(ball.batsmanId).split(' ')[0] || '';
    let text = `${bowlerName} to ${batsmanName}, `;

    if (ball.isWicket && ball.wicket) {
        const outDetails = {
            bowlerId: ball.bowlerId,
            type: ball.wicket.type,
            fielders: ball.wicket.fielderIds
        };
        const dismissalText = getDismissalText(outDetails, getPlayerName);
        text += `WICKET! ${dismissalText}.`;
        if (ball.runs > 0) {
            text += ` Plus ${ball.runs} run${ball.runs > 1 ? 's' : ''}.`;
        }
        return text;
    }

    if (ball.isWide) {
        text += `wide. ${ball.runs > 0 ? `${ball.runs} extra run${ball.runs > 1 ? 's' : ''}.` : ''}`;
        return text;
    }
    if (ball.isNoBall) {
        text += `no ball. ${ball.runs > 0 ? `${ball.runs} run${ball.runs > 1 ? 's' : ''}.` : ''}`;
        return text;
    }
    if (ball.isBye) {
        text += `${ball.runs} bye${ball.runs !== 1 ? 's' : ''}.`;
        return text;
    }
    if (ball.isLegBye) {
        text += `${ball.runs} leg bye${ball.runs !== 1 ? 's' : ''}.`;
        return text;
    }

    switch (ball.runs) {
        case 0: text += 'no run.'; break;
        case 1: text += '1 run.'; break;
        case 4: text += 'FOUR runs.'; break;
        case 6: text += 'SIX runs!'; break;
        default: text += `${ball.runs} runs.`;
    }
    return text;
};

export const generateCommentaryData = (innings: Innings | undefined, getPlayerName?: (id: string) => string) => {
    if (!innings) return [];

    const grouped: { [over: number]: { ball: Ball, text: string, displayBallNumber: string }[] } = {};
    let legalBallsInOver = 0;
    let currentOverForDisplay = 0;

    innings.balls.forEach(ball => {
        if (!ball.isWide && !ball.isNoBall) {
            if (legalBallsInOver >= 6) {
                legalBallsInOver = 0;
                currentOverForDisplay++;
            }
            legalBallsInOver++;
        }
        
        const overKey = currentOverForDisplay;
        if (!grouped[overKey]) {
            grouped[overKey] = [];
        }

        let displayBallNumber = `${overKey}.${legalBallsInOver}`;
        if (ball.isWide) displayBallNumber += ' (wd)';
        if (ball.isNoBall) displayBallNumber += ' (nb)';

        grouped[overKey].push({
            ball,
            text: getPlayerName ? generateCommentaryForBall(ball, getPlayerName) : `${ball.runs} runs`, // simplified fallback
            displayBallNumber
        });
    });

    return Object.entries(grouped)
        .sort(([a], [b]) => Number(b) - Number(a)) // Newest over first
        .map(([over, balls]) => ({ over: Number(over) + 1, balls: balls.reverse() })); // Newest ball first within over
};
