import React, { useMemo } from 'react';
import { Innings, Team } from '../types';
import { getBallDisplay } from '../utils/cricketLogic';

interface MatchOversProps {
    innings: Innings;
    battingTeam: Team;
}

const MatchOvers: React.FC<MatchOversProps> = ({ innings, battingTeam }) => {
    const oversData = useMemo(() => {
        if (!innings || innings.balls.length === 0) return [];
        const grouped: { [over: number]: typeof innings.balls } = {};
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
            if (!grouped[currentOverForDisplay]) grouped[currentOverForDisplay] = [];
            grouped[currentOverForDisplay].push(ball);
        });

         return Object.entries(grouped)
            .sort(([a], [b]) => Number(b) - Number(a)) // Newest over first
            .map(([over, balls]) => {
                const totalRuns = balls.reduce((sum, b) => sum + b.runs + (b.isWide || b.isNoBall ? 1 : 0), 0);
                const wickets = balls.filter(b => b.isWicket).length;
                return { over: Number(over) + 1, balls, totalRuns, wickets };
            });
    }, [innings]);

    if (!innings || innings.balls.length === 0) {
         return <p className="text-gray-500 text-center py-8">No overs bowled yet.</p>;
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: battingTeam.logo }}>
                        {battingTeam.name.substring(0,2).toUpperCase()}
                    </div>
                    {battingTeam.name} Overs
                 </h3>
                 <div className="text-sm font-mono font-medium text-gray-500">Overs: {innings.overs}</div>
            </div>
            <div className="p-4 md:p-6 space-y-4 max-h-[600px] overflow-y-auto">
                 {oversData.map(({ over, balls, totalRuns, wickets }) => (
                     <div key={over} className="border border-gray-100 rounded-lg p-3 sm:p-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                         <div className="flex justify-between items-center mb-3">
                             <div className="font-bold text-gray-700">Over {over}</div>
                             <div className="text-sm text-gray-500 font-medium">
                                 {totalRuns} Run{totalRuns !== 1 ? 's' : ''} {wickets > 0 && <span className="text-highlight ml-1 font-bold"> • {wickets} Wicket{wickets > 1 ? 's' : ''}</span>}
                             </div>
                         </div>
                         <div className="flex flex-wrap gap-2">
                             {balls.map((ball, i) => {
                                 const { text, className, title } = getBallDisplay(ball);
                                 return (
                                     <div key={i} className={`${className} shadow-sm border border-gray-200/50`} title={title}>
                                         {text}
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 ))}
            </div>
        </div>
    );
};

export default MatchOvers;
