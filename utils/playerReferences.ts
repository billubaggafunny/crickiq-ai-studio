import { Match } from "../types";

export interface PlayerReferenceSummary {
    hasReferences: boolean;
    matchCount: number;
    ballCount: number;
    inningsCount: number;
    scorecardCount: number;
    manOfMatchCount: number;
    squadCount: number;
    reasons: string[];
}

export function getPlayerReferenceSummary(playerId: string, matches: Match[]): PlayerReferenceSummary {
    let matchCount = 0;
    let ballCount = 0;
    let inningsCount = 0;
    let scorecardCount = 0;
    let manOfMatchCount = 0;
    let squadCount = 0;
    const reasons = new Set<string>();

    for (const match of matches) {
        let inMatch = false;

        // Squad check
        if (match.team1SquadIds?.includes(playerId) || match.team2SquadIds?.includes(playerId)) {
            squadCount++;
            inMatch = true;
            reasons.add("Selected in Match Squad");
        }

        // Snapshots check
        if (match.playerSnapshots && match.playerSnapshots[playerId]) {
            squadCount++;
            inMatch = true;
            reasons.add("Appears in Match Snapshots");
        }

        // MOTM check
        if (match.manOfTheMatchId === playerId) {
            manOfMatchCount++;
            inMatch = true;
            reasons.add("Man of the Match");
        }

        const checkInnings = (innings: Innings) => {
            if (!innings) return;
            let inInnings = false;

            // Scorecard
            if (innings.batsmanScores && innings.batsmanScores[playerId]) {
                scorecardCount++;
                inInnings = true;
                inMatch = true;
                reasons.add("Appears in Batting Scorecard");
            }
            if (innings.bowlerScores && innings.bowlerScores[playerId]) {
                scorecardCount++;
                inInnings = true;
                inMatch = true;
                reasons.add("Appears in Bowling Scorecard");
            }

            // Balls
            if (innings.balls && Array.isArray(innings.balls)) {
                for (const ball of innings.balls) {
                    let inBall = false;
                    if (ball.batsmanId === playerId) inBall = true;
                    if (ball.bowlerId === playerId) inBall = true;
                    if (ball.wicket) {
                        if (ball.wicket.fielderIds?.includes(playerId)) inBall = true;
                        if (ball.wicket.runOutBatsmanId === playerId) inBall = true;
                    }
                    if (inBall) {
                        ballCount++;
                        inInnings = true;
                        inMatch = true;
                        reasons.add("Involved in Ball events");
                    }
                }
            }

            if (inInnings) {
                inningsCount++;
            }
        };

        checkInnings(match.innings1);
        checkInnings(match.innings2);

        if (inMatch) {
            matchCount++;
        }
    }

    return {
        hasReferences: matchCount > 0 || ballCount > 0 || squadCount > 0 || scorecardCount > 0 || manOfMatchCount > 0,
        matchCount,
        ballCount,
        inningsCount,
        scorecardCount,
        manOfMatchCount,
        squadCount,
        reasons: Array.from(reasons)
    };
}
