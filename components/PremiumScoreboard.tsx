import React, { useState, useMemo } from 'react';
import type { Match, Team, Tournament } from '../types';
import { getTopPerformers } from '../utils/cricketLogic';
import { getPlayerDisplayFromSnapshot } from '../utils/playerSnapshots';
import ScoreHero from './PremiumScoreboard/ScoreHero';
import InningsAccordion from './PremiumScoreboard/InningsAccordion';
import MatchInsights from './PremiumScoreboard/MatchInsights';
import { TrophyIcon } from '../constants'; // Need this for TrophyIcon

interface PremiumScoreboardProps {
    match: Match;
    tournament: Tournament;
    teams: Team[];
    setManOfTheMatch?: (matchId: string, playerId: string) => void;
}

export default function PremiumScoreboard({ match, tournament, teams, setManOfTheMatch }: PremiumScoreboardProps) {
    const [expandedInnings, setExpandedInnings] = useState<number>(match.status === 'completed' ? 1 : 2);
    
    const manOfTheMatchPlayer = useMemo(() => {
        if (!match.manOfTheMatchId) return null;
        const name = getPlayerDisplayFromSnapshot(match, match.manOfTheMatchId, teams);
        const allPlayers = teams.flatMap(t => t.players);
        const p = allPlayers.find(p => p.id === match.manOfTheMatchId);
        if (p) return { ...p, name };
        return { id: match.manOfTheMatchId, name, role: 'Player', number: 0, originalId: '', globalPlayerId: '' };
    }, [match, teams]);

    const topPerformers = useMemo(() => {
        if (match.manOfTheMatchId) return [];
        return getTopPerformers(match, teams);
    }, [match, teams]);
    
    const getPlayerMatchStats = (playerId: string) => {
        const stats: {batting: string | null, bowling: string | null} = { batting: null, bowling: null };
        const innings = [match.innings1, match.innings2].filter((i): i is any => !!i); // Assuming 'any' for now, check types.
        
        for (const inning of innings) {
            const batPerf = inning.batsmanScores[playerId];
            if(batPerf) stats.batting = `${batPerf.runs}(${batPerf.balls})`;

            const bowlPerf = inning.bowlerScores[playerId];
            if(bowlPerf) stats.bowling = `${bowlPerf.wickets}/${bowlPerf.runsConceded} (${bowlPerf.overs})`;
        }
        return stats;
    };

    return (
        <div className="space-y-4 pt-4 pb-8 px-1 sm:px-4">
            <ScoreHero match={match} tournament={tournament} teams={teams} />

            {topPerformers.length > 0 && setManOfTheMatch && (
                <div>
                        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4 text-center">Select Man of the Match</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {topPerformers.map(p => {
                            return (
                                <button 
                                    key={p.playerId}
                                    onClick={() => setManOfTheMatch!(match.id, p.playerId)}
                                    className="text-left p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                                >
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{p.name}</p>
                                </button>
                            )})}
                        </div>
                </div>
            )}
            
            <div className="space-y-4">
                {match.innings1 && (
                    <InningsAccordion 
                        innings={match.innings1} 
                        teams={teams} 
                        match={match} 
                        inningsLabel="Innings 1"
                        isExpanded={expandedInnings === 1}
                        onToggle={() => setExpandedInnings(1)}
                    />
                )}
                {match.innings2 && (
                    <InningsAccordion 
                        innings={match.innings2} 
                        teams={teams} 
                        match={match} 
                        inningsLabel="Innings 2"
                        isExpanded={expandedInnings === 2}
                        onToggle={() => setExpandedInnings(2)}
                    />
                )}
            </div>

            <MatchInsights match={match} teams={teams} />
        </div>
    );
}
