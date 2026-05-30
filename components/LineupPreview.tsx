import React from 'react';
import type { Team } from '../types';
import { getRoleIcon } from '../constants';

interface LineupPreviewProps {
    team: Team;
    playerStats: Map<string, { matches: number; runsScored: number; wicketsTaken: number; }>;
}

const LineupPreview: React.FC<LineupPreviewProps> = ({ team, playerStats }) => (
    <div className="bg-primary/50 rounded-xl p-4">
        <h4
            className="text-center text-button text-white text-body p-2 rounded-lg mb-2"
            style={{ backgroundColor: team.logo }}
        >
            {team.name}
        </h4>
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 px-1.5 pb-1 text-caption text-text-secondary font-semibold">
            <span>Player</span>
            <span title="Role" className="w-6 text-center">Role</span>
            <span title="Matches Played" className="w-8 text-center">MP</span>
            <span title="Runs Scored" className="w-8 text-center">Runs</span>
            <span title="Wickets Taken" className="w-8 text-center">Wkts</span>
        </div>
        <ul className="space-y-1 max-h-96 overflow-y-auto no-scrollbar no-swipe pr-1">
            {team.players
                .slice()
                .sort((a, b) => a.number - b.number)
                .map(player => {
                    const isCaptain = player.id === team.captainId;
                    const isViceCaptain = player.id === team.viceCaptainId;
                    const stats = playerStats.get(player.id) || { matches: 0, runsScored: 0, wicketsTaken: 0 };
                    return (
                        <li key={player.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 items-center p-1.5 bg-secondary/70 dark:bg-black/20 rounded-md text-body">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="font-mono text-caption text-text-secondary w-5 text-center flex-shrink-0">{player.number}</span>
                                <div className="flex items-center gap-1 truncate">
                                    <span className="font-semibold text-text-primary truncate">{player.name}</span>
                                    {isCaptain && <span className="flex-shrink-0 text-caption font-bold text-warning bg-warning/100/20 px-1.5 rounded-2xl">C</span>}
                                    {isViceCaptain && <span className="flex-shrink-0 text-caption font-bold text-slate-600 bg-gray-500/20 px-1.5 rounded-2xl">VC</span>}
                                </div>
                            </div>
                            <div className="w-6 flex justify-center text-text-secondary" title={player.role}>
                                {getRoleIcon(player.role, { className: "w-4 h-4" })}
                            </div>
                            <div className="w-8 text-center font-semibold text-text-secondary">{stats.matches}</div>
                            <div className="w-8 text-center font-bold text-text-primary">{stats.runsScored}</div>
                            <div className="w-8 text-center font-bold text-text-primary">{stats.wicketsTaken}</div>
                        </li>
                    )
                })}
        </ul>
    </div>
);

export default LineupPreview;