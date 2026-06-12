import React from 'react';
import type { Match, Team, Innings } from '../../types';
import { BattingStatus } from '../../types';
import { calculateStrikeRate, getDismissalText } from '../../utils/cricketLogic';
import { getPlayerDisplayFromSnapshot } from '../../utils/playerSnapshots';

interface BattingTableProps {
    innings: Innings;
    teams: Team[];
    match: Match;
}

export default function BattingTable({ innings, teams, match }: BattingTableProps) {
    const getPlayerName = (playerId: string): string => getPlayerDisplayFromSnapshot(match, playerId, teams);
    
    // Sort batsmen
    const sortedBatsmen = Object.keys(innings.batsmanScores)
        .sort((a, b) => {
            const aIdx = innings.balls.findIndex(ball => ball.batsmanId === a);
            const bIdx = innings.balls.findIndex(ball => ball.batsmanId === b);
            return aIdx - bIdx;
        });

    const extras = (() => {
        let wides = 0, noBalls = 0, byes = 0, legByes = 0;
        innings.balls.forEach(ball => {
            if (ball.isWide) wides += 1 + ball.runs;
            if (ball.isNoBall) noBalls += 1 + ball.runs;
            if (ball.isBye) byes += ball.runs;
            if (ball.isLegBye) legByes += ball.runs;
        });
        return {
            total: wides + noBalls + byes + legByes,
            wides, noBalls, byes, legByes
        };
    })();

    const inningsFallOfWickets = (() => {
        const wicketEvents: { wicketNumber: number; score: number; over: string; playerName: string }[] = [];
        const ballsWithWickets = innings.balls
            .map((ball, index) => ({ ball, index }))
            .filter(({ ball }) => ball.isWicket && ball.wicket);
        
        let wicketsSoFar = 0;
        for (const { ball, index } of ballsWithWickets) {
            wicketsSoFar++;
            const ballsUpToWicket = innings.balls.slice(0, index + 1);
            const scoreAtWicket = ballsUpToWicket.reduce((acc, b) => acc + b.runs + (b.isWide || b.isNoBall ? 1 : 0), 0);
            const legalBallsAtWicket = ballsUpToWicket.filter(b => !b.isWide && !b.isNoBall).length;
            const overNumber = Math.floor((legalBallsAtWicket - 1) / 6);
            const ballInOver = ((legalBallsAtWicket - 1) % 6) + 1;
            
            wicketEvents.push({
                wicketNumber: wicketsSoFar,
                score: scoreAtWicket,
                over: `${overNumber}.${ballInOver}`,
                playerName: getPlayerName(ball.wicket!.playerId)
            });
        }
        return wicketEvents;
    })();

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-[#ACD1FD]/20 dark:bg-[rgba(0,196,154,0.10)] text-[#10367D] dark:text-[#00C49A]">
                        <th className="px-4 py-2 text-left">BATTER</th>
                        <th className="px-4 py-2 text-right">R</th>
                        <th className="px-4 py-2 text-right">B</th>
                        <th className="px-4 py-2 text-right">4s</th>
                        <th className="px-4 py-2 text-right">6s</th>
                        <th className="px-4 py-2 text-right">SR</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedBatsmen.map(playerId => {
                        const stats = innings.batsmanScores[playerId];
                        const player = teams.flatMap(t => t.players).find(p => p.id === playerId);
                        if (!stats || !player) return null;
                        
                        return (
                            <tr key={playerId} className="border-b border-gray-100 dark:border-[#26364F]">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-[#F8FAFC]">
                                    {player.name}
                                    <p className="text-xs text-gray-500 dark:text-[#CBD5E1]">{stats.status === BattingStatus.OUT ? getDismissalText(stats.outDetails, getPlayerName) : stats.status}</p>
                                </td>
                                <td className="px-4 py-3 text-right font-bold dark:text-[#F8FAFC]">{stats.runs}</td>
                                <td className="px-4 py-3 text-right dark:text-[#F8FAFC]">{stats.balls}</td>
                                <td className="px-4 py-3 text-right dark:text-[#F8FAFC]">{stats.fours}</td>
                                <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-[#F87171]">{stats.sixes}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-[#00C49A]">{calculateStrikeRate(stats.runs, stats.balls)}</td>
                            </tr>
                        );
                    })}
                    
                    {/* Extras */}
                    <tr className="border-b border-gray-100 dark:border-[#26364F]">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-[#F8FAFC]">Extras</td>
                        <td colSpan={5} className="px-4 py-3 text-gray-500 dark:text-[#CBD5E1]">
                            {`${extras.total} (lb ${extras.legByes}, wd ${extras.wides}, nb ${extras.noBalls}, b ${extras.byes})`}
                        </td>
                    </tr>
                    
                    {/* Fall of Wickets */}
                    <tr className="border-b border-gray-100 dark:border-[#26364F]">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-[#F8FAFC]">Fall of Wickets</td>
                        <td colSpan={5} className="px-4 py-3 text-gray-500 dark:text-[#CBD5E1] whitespace-normal">
                            {inningsFallOfWickets.length > 0
                                ? inningsFallOfWickets.map((fow) => `${fow.wicketNumber}-${fow.score} (${fow.playerName.split(" ")[0]}, ${fow.over})`).join(", ")
                                : "Not available"}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
