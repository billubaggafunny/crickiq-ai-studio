import React, { useState, useMemo } from 'react';
import MatchTable from './MatchTable';
import { Match, Team, Tournament } from '../types';

export interface MatchesViewProps {
    matches: Match[];
    today: Date;
    getTeamById: (id: string) => Team | undefined;
    getTournamentById: (id: string) => Tournament | undefined;
    isMatchLive: boolean;
    handleShareMatch: (match: Match) => void;
    setEditingMatch: (match: Match) => void;
    handleDeleteMatch: (id: string) => void;
    onViewMatchResult: (matchId: string) => void;
    onContinueMatch: (match: Match) => void;
    onStartMatch: (match: Match) => void;
    setTossMatch: (match: Match) => void;
}

const MatchesView: React.FC<MatchesViewProps> = (props) => {
    // true: Tournament, false: Single Match (Quick Match)
    const [matchType, setMatchType] = useState(true);

    const filteredMatches = useMemo(() => {
        const today = new Date(props.today);
        today.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);

        return props.matches.filter(m => {
            const matchesType = matchType ? !m.isQuickMatch : m.isQuickMatch;
            if (!matchesType) return false;

            return true;
        }).map(m => {
            let statusDisplay = '';
            if (m.wasAbandoned) statusDisplay = 'Abandoned';
            else if (m.status === 'live') statusDisplay = 'Live';
            else if (m.status === 'completed') statusDisplay = 'Finished';
            else if (m.status === 'scheduled') {
                const matchDate = new Date(m.date);
                matchDate.setHours(0, 0, 0, 0);
                if (matchDate > dayAfterTomorrow) statusDisplay = 'Coming Soon';
                else statusDisplay = 'Scheduled';
            }
            return { ...m, statusDisplay };
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [props.matches, matchType, props.today]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-h2 font-bold text-text-primary">Matches</h2>
                <div className="flex items-center gap-2">
                    <span className={`text-sm ${matchType ? 'text-gray-500' : 'text-text-primary'}`}>Single Match</span>
                    <button 
                        onClick={() => setMatchType(!matchType)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${matchType ? 'bg-brand-blue' : 'bg-gray-300'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${matchType ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-sm ${matchType ? 'text-text-primary' : 'text-gray-500'}`}>Tournament</span>
                </div>
            </div>
            
            <MatchTable 
               list={filteredMatches}
               title={matchType ? "Tournament Matches" : "Quick Matches"}
               emptyMessage={`No ${matchType ? "Tournament" : "Quick"} matches.`}
               {...props}
            />
        </div>
    );
};

export default MatchesView;
