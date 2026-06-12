import React, { useMemo } from 'react';
import type { Match, Team } from '../../types';
import { calculateRunRate } from '../../utils/cricketLogic';

interface MatchInsightsProps {
    match: Match;
    teams: Team[];
}

export default function MatchInsights({ match, teams }: MatchInsightsProps) {
    const insights = useMemo(() => {
        const stats = {
            highestScore: 'Not available',
            bestBowling: 'Not available',
            mostBoundaries: 'Not available',
            mostSixes: 'Not available',
            partnership: 'Not available'
        };

        const innings = [match.innings1, match.innings2].filter((i): i is any => !!i);
        if (innings.length === 0) return stats;

        // Highest score
        let highest = 0;
        let highestPlayer = '';
        let highestBalls = 0;
        
        // Best bowling
        let bestWickets = 0;
        let bestRuns = 999;
        let bestBowler = '';

        // Flatten performers
        innings.forEach(inning => {
            Object.values(inning.batsmanScores).forEach((b: any) => {
                if (b.runs > highest) {
                    highest = b.runs;
                    highestPlayer = b.playerId;
                    highestBalls = b.balls;
                }
            });
            Object.values(inning.bowlerScores).forEach((bo: any) => {
                if (bo.wickets > bestWickets || (bo.wickets === bestWickets && bo.runsConceded < bestRuns)) {
                    bestWickets = bo.wickets;
                    bestRuns = bo.runsConceded;
                    bestBowler = bo.playerId;
                }
            });
        });

        if (highestPlayer) {
            const p = teams.flatMap(t => t.players).find(pl => pl.id === highestPlayer);
            if (p) stats.highestScore = `${p.name} ${highest}(${highestBalls})`;
        }
        if (bestBowler) {
            const p = teams.flatMap(t => t.players).find(pl => pl.id === bestBowler);
            if (p) stats.bestBowling = `${p.name} ${bestWickets}/${bestRuns}`;
        }
        
        return stats;
    }, [match, teams]);

    return (
        <div className="bg-white dark:bg-[#07111F] p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-[#26364F]">
            <h3 className="font-bold text-gray-900 dark:text-[#00C49A] mb-4 flex items-center gap-2">
                MATCH INSIGHTS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Highest Score', value: insights.highestScore },
                    { label: 'Best Bowling', value: insights.bestBowling },
                    { label: 'Most Boundaries', value: insights.mostBoundaries },
                    { label: 'Most Sixes', value: insights.mostSixes },
                    { label: 'Partnership', value: insights.partnership }
                ].map((stat, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-[#162338] dark:border dark:border-[#26364F] rounded-xl">
                        <p className="text-[10px] text-gray-500 uppercase font-bold dark:text-[#CBD5E1]">{stat.label}</p>
                        <p className="font-bold text-xs mt-1 truncate dark:text-[#F8FAFC]">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
