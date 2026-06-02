const fs = require('fs');
const file = 'components/PlayerDetailsPage.tsx';
let src = fs.readFileSync(file, 'utf8');

const statsUI = `
            {/* Stats Tab Content */}
            {activeTab === 'Stats' && (
                <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto pb-safe bg-secondary">
                    {playerStats.overallMatches === 0 ? (
                        <div className="p-6 m-4 text-center text-sm font-medium text-text-secondary bg-primary rounded-[20px] shadow-sm border border-brand-blue/10">
                            No career stats available yet.
                        </div>
                    ) : (
                        <div className="p-4 flex flex-col gap-4">
                            {/* Stats Filter Segmented Control */}
                            <div className="flex bg-primary rounded-xl p-1 shadow-sm border border-brand-blue/10 overflow-x-auto no-scrollbar">
                                {['Batting', 'Bowling', 'Fielding', ...(playerStats.keeping.isRelevant ? ['Keeping'] : [])].map(section => (
                                    <button
                                        key={section}
                                        onClick={() => setStatSection(section as any)}
                                        className={\`flex-1 min-w-[80px] py-1.5 px-3 rounded-lg text-sm font-bold transition-colors \${
                                            statSection === section
                                                ? 'bg-secondary text-text-primary shadow-sm border border-brand-blue/10'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }\`}
                                    >
                                        {section}
                                    </button>
                                ))}
                            </div>

                            {/* Batting Grid */}
                            {statSection === 'Batting' && (
                                <div className="bg-primary rounded-[20px] shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-800 text-center">
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Matches</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.matches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Innings</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.innings}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Runs</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.runs}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Average</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.average}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Strike Rate</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.strikeRate}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Highest Score</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.highest}{playerStats.batting.highestNotOut ? '*' : ''}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">MOM</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.mom}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">4s</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.fours}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">6s</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.sixes}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">30s</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.thirties}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">50s</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.batting.fifties}</span>
                                        </div>
                                        {playerStats.batting.hundreds > 0 && (
                                            <div className="p-4 flex flex-col justify-center">
                                                <span className="text-xs text-text-secondary font-medium mb-1">100s</span>
                                                <span className="font-bold text-text-primary text-base">{playerStats.batting.hundreds}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bowling Grid */}
                            {statSection === 'Bowling' && (
                                <div className="bg-primary rounded-[20px] shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-800 text-center">
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Matches</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.matches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Innings</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.innings}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Overs</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.overs}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Balls Bowled</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.balls}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Runs Conceded</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.runs}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Wickets</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.wickets}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Average</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.average}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Economy</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.economy}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Strike Rate</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.strikeRate}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">3W</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.threeW}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">4W</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.bowling.fourW}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">MOM</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.mom}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Fielding Grid */}
                            {statSection === 'Fielding' && (
                                <div className="bg-primary rounded-[20px] shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-800 text-center">
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Catches</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.fielding.catches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Run Outs</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.fielding.runOuts}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">MOM</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.mom}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Keeping Grid */}
                            {statSection === 'Keeping' && (
                                <div className="bg-primary rounded-[20px] shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="grid grid-cols-3 divide-x divide-y divide-gray-100 dark:divide-gray-800 text-center">
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Matches as WK</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.keeping.matches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Catches</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.keeping.catches}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Stumpings</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.keeping.stumpings}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">Run Outs</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.keeping.runOuts}</span>
                                        </div>
                                        <div className="p-4 flex flex-col justify-center">
                                            <span className="text-xs text-text-secondary font-medium mb-1">MOM</span>
                                            <span className="font-bold text-text-primary text-base">{playerStats.mom}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}
`;

let targetLine = "{/* Teams Tab Content */}";
src = src.replace(targetLine, statsUI + '\n            ' + targetLine);

src = src.replace("{activeTab !== 'Overview' && activeTab !== 'Teams' && (", "{activeTab !== 'Overview' && activeTab !== 'Teams' && activeTab !== 'Stats' && (");

fs.writeFileSync(file, src);
