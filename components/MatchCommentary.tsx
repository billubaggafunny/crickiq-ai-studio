import React, { useMemo, useCallback } from 'react';
import { Innings, Team } from '../types';
import { generateCommentaryData, getBallDisplay } from '../utils/cricketLogic';

interface MatchCommentaryProps {
    innings: Innings;
    battingTeam: Team;
    bowlingTeam: Team;
}

const CommentaryFeedDisplay: React.FC<{ data: ReturnType<typeof generateCommentaryData> }> = ({ data }) => {
    if (data.length === 0) {
        return <p className="text-gray-500 text-center py-8">Commentary will appear here as the match progresses.</p>;
    }

    return (
        <div className="space-y-6">
            {data.map(({ over, balls }) => (
                <div key={`over-${over}`}>
                    <h4 className="font-bold text-gray-900 mb-2 border-b border-blue-500/15 pb-1 sticky top-0 bg-white/90 backdrop-blur-sm py-1 z-10">Over {over}</h4>
                    <div className="space-y-4 pt-2">
                        {balls.map(({ ball, text, displayBallNumber }, index) => {
                            const { className: ballClass, text: ballText, title } = getBallDisplay(ball);
                            return (
                                <div key={index} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div className="flex flex-col items-center flex-shrink-0 w-12 pt-1">
                                        <div className={`${ballClass} flex-shrink-0 shadow-sm`} title={title}>{ballText}</div>
                                        <span className="text-[10px] text-gray-400 font-mono mt-1">{displayBallNumber}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 leading-relaxed pt-1.5 flex-1">{text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

const MatchCommentary: React.FC<MatchCommentaryProps> = ({ innings, battingTeam, bowlingTeam }) => {
    const getPlayerName = useCallback((id: string) => {
        return bowlingTeam?.players.find(p => p.id === id)?.name || battingTeam?.players.find(p => p.id === id)?.name || 'Unknown';
    }, [battingTeam, bowlingTeam]);

    const commentaryData = useMemo(() => generateCommentaryData(innings, getPlayerName), [innings, getPlayerName]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: battingTeam.logo }}>
                        {battingTeam.name.substring(0,2).toUpperCase()}
                    </div>
                    {battingTeam.name} Innings
                 </h3>
                 <div className="text-sm font-mono font-medium text-gray-500">{innings.score}/{innings.wickets}</div>
            </div>
            <div className="p-4 md:p-6 bg-white overflow-y-auto max-h-[600px] relative">
                <CommentaryFeedDisplay data={commentaryData} />
            </div>
        </div>
    );
};

export default MatchCommentary;
