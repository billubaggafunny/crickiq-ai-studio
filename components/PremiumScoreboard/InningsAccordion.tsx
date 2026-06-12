import React, { useState } from 'react';
import type { Match, Team, Innings } from '../../types';
import BattingTable from './BattingTable';
import BowlingTable from './BowlingTable';

interface InningsAccordionProps {
    innings: Innings;
    teams: Team[];
    match: Match;
    inningsLabel: string;
    isExpanded: boolean;
    onToggle: () => void;
}

export default function InningsAccordion({ innings, teams, match, inningsLabel, isExpanded, onToggle }: InningsAccordionProps) {
    const battingTeam = teams.find(t => t.id === innings.battingTeamId);
    const bowlingTeam = teams.find(t => t.id !== innings.battingTeamId);
    
    return (
        <div className={`bg-white dark:bg-[#07111F] rounded-3xl shadow-sm overflow-hidden border border-gray-100 dark:border-[#26364F] ${isExpanded ? '' : 'pb-0'}`}>
            <div className={`p-4 bg-gradient-to-r from-[#10367D] to-[#1E5CB8] dark:bg-none dark:bg-[#00C49A] dark:border-b-0 text-white flex justify-between items-center cursor-pointer ${isExpanded ? 'rounded-t-3xl' : 'rounded-3xl'}`} onClick={onToggle}>
                <div className="flex items-center gap-3">
                     <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-white/20 text-[#10367D] dark:border-none dark:text-white font-bold text-lg">
                        {battingTeam?.name.substring(0, 1)}
                     </div>
                     <div>
                         <h3 className="font-bold text-lg dark:text-white">{battingTeam?.name} {inningsLabel}</h3>
                         <p className="text-sm opacity-80 dark:opacity-100 dark:text-white/90">{innings.overs} Overs</p>
                     </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xl font-bold dark:text-white">{innings.score}/{innings.wickets}</div>
                    <div className="w-8 h-8 rounded-full bg-[#ACD1FD] dark:bg-white/20 dark:border-none text-[#10367D] dark:text-white flex items-center justify-center font-bold text-xl">
                        {isExpanded ? '-' : '+'}
                    </div>
                </div>
            </div>
            
            {isExpanded && (
                <div className="p-4">
                    <BattingTable innings={innings} teams={teams} match={match} />
                    <div className="mt-6 border-t border-gray-100 dark:border-[#26364F] pt-4">
                        <h4 className="font-bold text-gray-900 dark:text-[#F8FAFC] mb-2 px-4">{bowlingTeam?.name} Bowling</h4>
                        <BowlingTable innings={innings} teams={teams} match={match} />
                    </div>
                </div>
            )}
        </div>
    );
}
