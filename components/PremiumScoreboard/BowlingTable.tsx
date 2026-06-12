import React from 'react';
import type { Match, Team, Innings } from '../../types';
import { calculateRunRate } from '../../utils/cricketLogic';
import { getPlayerDisplayFromSnapshot } from '../../utils/playerSnapshots';

interface BowlingTableProps {
    innings: Innings;
    teams: Team[];
    match: Match;
}

export default function BowlingTable({ innings, teams, match }: BowlingTableProps) {
    const getPlayerName = (playerId: string): string => getPlayerDisplayFromSnapshot(match, playerId, teams);

    return (
        <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-[#ACD1FD]/20 dark:bg-[rgba(0,196,154,0.10)] text-[#10367D] dark:text-[#00C49A]">
                        <th className="px-4 py-2 text-left">BOWLER</th>
                        <th className="px-4 py-2 text-right">O</th>
                        <th className="px-4 py-2 text-right">M</th>
                        <th className="px-4 py-2 text-right">R</th>
                        <th className="px-4 py-2 text-right">W</th>
                        <th className="px-4 py-2 text-right">ECON</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.values(innings.bowlerScores).map(stats => {
                        const bowlerName = getPlayerName(stats.playerId);
                        
                        return (
                            <tr key={stats.playerId} className="border-b border-gray-100 dark:border-[#26364F]">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-[#F8FAFC]">
                                    {bowlerName}
                                </td>
                                <td className="px-4 py-3 text-right dark:text-[#F8FAFC]">{stats.overs}</td>
                                <td className="px-4 py-3 text-right dark:text-[#F8FAFC]">{stats.maidens}</td>
                                <td className="px-4 py-3 text-right dark:text-[#F8FAFC]">{stats.runsConceded}</td>
                                <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-[#F87171]">{stats.wickets}</td>
                                <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-[#00C49A]">{calculateRunRate(stats.runsConceded, stats.overs)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
