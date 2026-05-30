
import React, { useMemo, useState, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Player, Match, Team, Innings, Ball } from '../types';
import { WicketType } from '../types';

interface WagonWheelModalProps {
    player: Player & { teamName?: string; teamId?: string; logo?: string, ballsFaced?: number, runsScored?: number, wicketsTaken?: number, strikeRate?: string, economyRate?: string, highScore?: number, bestBowlingInnings?: string };
    matches: Match[];
    teams: Team[];
    type: 'batting' | 'bowling';
    onClose: () => void;
}

const RUN_COLORS: { [key: number]: string } = {
    1: '#9CA3AF', // gray-400
    2: '#60A5FA', // blue-400
    3: '#A78BFA', // violet-400
    4: '#FBBF24', // amber-400
    6: 'var(--color-danger)', // red-500
};

// Generates a random angle in degrees. 0 is straight down, 90 is square leg, 270 is point.
const getAngleForRuns = (runs: number): number => {
    const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

    const straight = randomBetween(-15, 15);
    const offSide = randomBetween(285, 345);
    const legSide = randomBetween(15, 75);

    switch (runs) {
        case 4: case 6:
            // Boundaries are typically well-hit into open areas
            return [straight, offSide, legSide, randomBetween(105, 255)][Math.floor(Math.random() * 4)];
        default:
             // Singles can go anywhere
            return randomBetween(0, 360);
    }
};

const WagonWheelDisplay: React.FC<{ shots: { runs: number; angle: number }[], runsInSectors: { runs: number; angle: number }[] }> = ({ shots, runsInSectors }) => {
    const viewBoxSize = 400;
    const center = viewBoxSize / 2;

    return (
        <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-auto">
            {/* Outer Ring */}
            <circle cx={center} cy={center} r={viewBoxSize/2 - 5} fill="#1f1f1f" />

            {/* Sector lines and text */}
            {runsInSectors.map((sector, index) => {
                const boundaryAngleRad = (sector.angle - 22.5 - 90) * (Math.PI / 180);
                const textAngleRad = (sector.angle - 90) * (Math.PI / 180);

                const lineX2 = center + 195 * Math.cos(boundaryAngleRad);
                const lineY2 = center + 195 * Math.sin(boundaryAngleRad);
                const textX = center + 178 * Math.cos(textAngleRad);
                const textY = center + 178 * Math.sin(textAngleRad);
                
                return (
                    <g key={index}>
                        <line x1={center} y1={center} x2={lineX2} y2={lineY2} stroke="#404040" strokeWidth="1" />
                        <text x={textX} y={textY} fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                            {sector.runs > 0 ? sector.runs : ''}
                        </text>
                    </g>
                );
            })}
            
            {/* Field */}
            <ellipse cx={center} cy={center} rx="155" ry="155" fill="#166534" />
            <ellipse cx={center} cy={center} rx="62" ry="62" stroke="#65a30d" strokeWidth="1.5" strokeDasharray="5 5" fill="none" />

            {/* Pitch */}
            <rect x={center - 8} y={center - 70} width="16" height="140" fill="#a16207" />
            <rect x={center - 10} y={center - 73} width="20" height="4" fill="#854d0e" />
            <rect x={center - 10} y={center + 69} width="20" height="4" fill="#854d0e" />

            {/* Shots */}
            <g>
                {shots.map((shot, index) => {
                    const svgAngleRad = (shot.angle - 90) * (Math.PI / 180);
                    const length = 40 + (shot.runs * 18);
                    
                    const endX = center + length * Math.cos(svgAngleRad);
                    const endY = center + length * Math.sin(svgAngleRad);
                    
                    return (
                        <line
                            key={index}
                            x1={center} y1={center}
                            x2={endX} y2={endY}
                            stroke={RUN_COLORS[shot.runs] || '#ffffff'}
                            strokeWidth="2" strokeLinecap="round"
                        />
                    );
                })}
            </g>
        </svg>
    );
};

const DismissalAnalysis: React.FC<{ wickets: { type: WicketType }[] }> = ({ wickets }) => {
    const dismissalCounts = useMemo(() => {
        return wickets.reduce((acc, wicket) => {
            acc[wicket.type] = (acc[wicket.type] || 0) + 1;
            return acc;
        }, {} as Record<WicketType, number>);
    }, [wickets]);

    // FIX: The sort function was causing a type error due to poor type inference. By using index access (e.g., b[1]) instead of destructuring in the callback parameters, we ensure TypeScript correctly infers the type as 'number' for the arithmetic operation.
    // FIX: Explicitly typing the sort callback parameters resolves the type inference issue.
    const sortedDismissals = Object.entries(dismissalCounts).sort((a, b) => (b[1] as number) - (a[1] as number));

    return (
        <div className="space-y-4">
            {sortedDismissals.map(([type, count]) => (
                 <div key={type} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                    <span className="text-base font-semibold text-text-secondary">{type}</span>
                    <span className="text-h2 text-white">{count}</span>
                </div>
            ))}
        </div>
    );
};

const BowlingChart: React.FC<{ data: { matchName: string; wickets: number; runs: number }[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div style={{ height: 250, width: '100%', minHeight: 250, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No data available</div>;
    }
    return (
        <div style={{ width: '100%', height: 250, minHeight: 250, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="matchName" stroke="rgba(255, 255, 255, 0.7)" fontSize={12} />
                    <YAxis yAxisId="left" orientation="left" stroke="#FBBF24" allowDecimals={false} label={{ value: 'Wickets', angle: -90, position: 'insideLeft', fill: '#FBBF24', dy: 40, dx: 10, style: {fontSize: '12px'} }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#60A5FA" label={{ value: 'Runs Conceded', angle: 90, position: 'insideRight', fill: '#60A5FA', dy: -50, dx: -5, style: {fontSize: '12px'} }} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(30, 30, 30, 0.9)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '0.25rem',
                            color: 'white'
                        }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}}/>
                    <Bar yAxisId="left" dataKey="wickets" fill="#FBBF24" name="Wickets" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="runs" fill="#60A5FA" name="Runs Conceded" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const WagonWheelModal: React.FC<WagonWheelModalProps> = ({ player, matches, teams, type, onClose }) => {
    const [touchStartY, setTouchStartY] = useState<number | null>(null);
    const [touchMoveY, setTouchMoveY] = useState<number | null>(null);
    const modalContentRef = useRef<HTMLDivElement>(null);

    const transformValue = useMemo(() => {
        if (touchStartY === null || touchMoveY === null) return 'translateY(0)';
        const diff = touchMoveY - touchStartY;
        // Only allow dragging down
        return `translateY(${Math.max(0, diff)}px)`;
    }, [touchStartY, touchMoveY]);

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        const scrollableContent = modalContentRef.current?.querySelector('.overflow-y-auto');
        // If content is scrolled, don't initiate drag-to-close
        if (scrollableContent && scrollableContent.scrollTop > 0) {
            return;
        }
        setTouchStartY(e.targetTouches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartY === null) return;
        setTouchMoveY(e.targetTouches[0].clientY);
    };

    const handleTouchEnd = () => {
        if (touchStartY === null || touchMoveY === null) {
            setTouchStartY(null);
            setTouchMoveY(null);
            return;
        }
        
        const diff = touchMoveY - touchStartY;
        const SWIPE_THRESHOLD = 100; // Drag down by 100px to close

        if (diff > SWIPE_THRESHOLD) {
            onClose();
        }

        // Reset for next interaction
        setTouchStartY(null);
        setTouchMoveY(null);
    };

    const { shots, wickets, runsBreakdown, offSideRuns, legSideRuns, runsInSectors, perMatchBowlingStats } = useMemo(() => {
        const allShots: { runs: number; angle: number }[] = [];
        const allWickets: { type: WicketType }[] = [];
        const runsBreakdown: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 6: 0 };
        let offSideRuns = 0;
        let legSideRuns = 0;
        const perMatchBowlingStats: { matchName: string; wickets: number; runs: number }[] = [];

        const sectors: Record<string, { range: [number, number], runs: number }> = {
            STRAIGHT: { range: [337.5, 22.5], runs: 0 },
            MID_WICKET: { range: [22.5, 67.5], runs: 0 },
            SQUARE_LEG: { range: [67.5, 112.5], runs: 0 },
            FINE_LEG: { range: [112.5, 157.5], runs: 0 },
            BEHIND: { range: [157.5, 202.5], runs: 0 },
            THIRD_MAN: { range: [202.5, 247.5], runs: 0 },
            POINT: { range: [247.5, 292.5], runs: 0 },
            COVER: { range: [292.5, 337.5], runs: 0 },
        };
        
        const completedMatches = matches.filter(m => m.status === 'completed');

        completedMatches.forEach(match => {
            const innings = [match.innings1, match.innings2].filter((i): i is Innings => !!i);
            
            let matchWickets = 0;
            let matchRuns = 0;
            let playedInMatchAsBowler = false;

            innings.forEach(inning => {
                inning.balls.forEach((ball: Ball) => {
                    if (type === 'batting' && ball.batsmanId === player.id && !ball.isBye && !ball.isLegBye) {
                        const shotAngle = getAngleForRuns(ball.runs);
                        
                        if (ball.runs > 0) allShots.push({ runs: ball.runs, angle: shotAngle });
                        if (runsBreakdown[ball.runs] !== undefined) runsBreakdown[ball.runs]++;
                        if (shotAngle >= 180) offSideRuns += ball.runs; else legSideRuns += ball.runs;
                        
                        for (const sector of Object.values(sectors)) {
                            const [start, end] = sector.range;
                            if (start > end ? (shotAngle >= start || shotAngle < end) : (shotAngle >= start && shotAngle < end)) {
                                sector.runs += ball.runs;
                            }
                        }
                    }
                });

                if (type === 'bowling') {
                    const bowlingPerf = inning.bowlerScores[player.id];
                    if (bowlingPerf) {
                        playedInMatchAsBowler = true;
                        matchWickets += bowlingPerf.wickets;
                        matchRuns += bowlingPerf.runsConceded;

                        inning.balls.forEach((ball: Ball) => {
                            if (ball.bowlerId === player.id && ball.isWicket && ball.wicket) {
                                const bowlerWicketTypes = [WicketType.BOWLED, WicketType.CAUGHT, WicketType.LBW, WicketType.STUMPED, WicketType.HIT_WICKET];
                                if (bowlerWicketTypes.includes(ball.wicket.type)) {
                                     allWickets.push({ type: ball.wicket.type });
                                }
                            }
                        });
                    }
                }
            });

            if (playedInMatchAsBowler) {
                const opponentId = match.team1Id === player.teamId ? match.team2Id : player.teamId ? match.team1Id : undefined;
                const opponent = teams.find(t => t.id === opponentId);
                const matchName = `vs ${opponent ? opponent.name.split(' ').pop() : '??'}`;
                perMatchBowlingStats.push({ matchName, wickets: matchWickets, runs: matchRuns });
            }
        });

        const runsInSectorsForSVG = [
            { runs: sectors.COVER.runs, angle: 315 },
            { runs: sectors.POINT.runs, angle: 270 },
            { runs: sectors.THIRD_MAN.runs, angle: 225 },
            { runs: sectors.BEHIND.runs, angle: 180 },
            { runs: sectors.FINE_LEG.runs, angle: 135 },
            { runs: sectors.SQUARE_LEG.runs, angle: 90 },
            { runs: sectors.MID_WICKET.runs, angle: 45 },
            { runs: sectors.STRAIGHT.runs, angle: 0 },
        ];

        return { shots: allShots, wickets: allWickets, runsBreakdown, offSideRuns, legSideRuns, runsInSectors: runsInSectorsForSVG, perMatchBowlingStats };
    }, [player.id, player.teamId, matches, type, teams]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-end z-50 animate-fade-in" onClick={onClose}>
            <div
                ref={modalContentRef}
                className={`w-full max-w-lg max-h-[95vh] flex flex-col rounded-t-2xl shadow-xl bg-zinc-800 text-white ${touchStartY === null ? 'transition-transform duration-300 ease-out' : ''}`}
                onClick={e => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: transformValue }}
            >
                <div className="p-4 text-center border-b border-white/10 flex-shrink-0 cursor-grab">
                    <div className="w-10 h-1.5 bg-zinc-600 rounded-2xl mx-auto mb-4"></div>
                    <h2 className="text-h3">
                        {type === 'batting' ? "Wagon Wheel" : "Dismissal Analysis"}
                    </h2>
                </div>
                
                <div className="flex-grow p-4 space-y-4 overflow-y-auto no-scrollbar">
                    {type === 'batting' ? (
                        <>
                            <WagonWheelDisplay shots={shots} runsInSectors={runsInSectors} />
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 grid grid-cols-[1fr_1fr_1fr_2px_1fr_1fr] gap-x-3 text-center text-white">
                                <div><div className="text-xs opacity-70">Runs</div><div className="font-bold text-h3">{player.runsScored}</div></div>
                                <div><div className="text-xs opacity-70">Balls</div><div className="font-bold text-h3">{player.ballsFaced}</div></div>
                                <div><div className="text-xs opacity-70">SR</div><div className="font-bold text-h3">{player.strikeRate}</div></div>
                                <div className="w-px h-full bg-white/20"></div>
                                <div><div className="text-xs opacity-70">Off-S</div><div className="font-bold text-h3">{offSideRuns}</div></div>
                                <div><div className="text-xs opacity-70">Leg-S</div><div className="font-bold text-h3">{legSideRuns}</div></div>
                            </div>
                            <div className="bg-black/50 p-4 rounded-2xl flex justify-around items-center">
                                {Object.entries(runsBreakdown).map(([run, count]) => {
                                    const runNum = parseInt(run, 10);
                                    if (runNum === 3 || runNum === 5) return null; // Hide 3s and 5s as per image
                                    return (
                                        <div key={run} className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black" style={{ backgroundColor: RUN_COLORS[runNum] }}>
                                                {run}
                                            </div>
                                            <span className="text-white font-bold mt-1 text-body">{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-black/20">
                                <h3 className="text-h3 mb-2">Bowling Summary</h3>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-body">
                                    <div className="font-semibold text-text-secondary">Total Wickets</div><div className="font-bold text-right text-brand-blue">{player.wicketsTaken}</div>
                                    <div className="font-semibold text-text-secondary">Best Bowling</div><div className="font-bold text-right text-text-primary">{player.bestBowlingInnings}</div>
                                    <div className="font-semibold text-text-secondary">Economy</div><div className="font-bold text-right text-text-primary">{player.economyRate}</div>
                                </div>
                            </div>
                            
                            {perMatchBowlingStats.length > 0 && (
                                <div className="p-4 rounded-lg bg-black/20">
                                    <h3 className="text-h3 mb-4">Runs vs Wickets (Match by Match)</h3>
                                    <BowlingChart data={perMatchBowlingStats} />
                                </div>
                            )}

                             <div className="p-4 rounded-lg bg-black/20">
                                <h3 className="text-h3 mb-4">Dismissal Types</h3>
                                {wickets.length > 0 ? <DismissalAnalysis wickets={wickets} /> : <p className="text-text-secondary">No wickets to analyze.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WagonWheelModal;
