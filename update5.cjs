const fs = require('fs');

let content = fs.readFileSync('components/MatchManager.tsx', 'utf-8');

const regex = /<CrickIQCard\s+key=\{match\.id\}\s+accentColor=\{team1\.logo\}\s+className="flex flex-col space-y-4 cursor-pointer hover:-translate-y-1 transition-transform duration-300"\s+onClick=\{.*\}\s*>[\s\S]*?<\/CrickIQCard>/g;

let matchCount = 0;
content = content.replace(regex, (match) => {
    matchCount++;
    return `<CrickIQCard
            key={match.id}
            className="p-0 bg-secondary shadow-sm rounded-3xl overflow-hidden relative border border-border/20 cursor-pointer hover:-translate-y-1 transition-transform duration-300"
            onClick={() => onViewMatchResult(match.id)}
        >
            <div className="absolute top-0 left-0 bottom-0 w-1.5 opacity-80" style={{ backgroundColor: team1.logo || '#4285F4' }}></div>
            <div className="p-4 pb-0 pl-5">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="bg-black/5 dark:bg-white/10 text-text-secondary px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            {match.wasAbandoned ? 'Abandoned' : 'Completed'}
                        </span>
                        {getStageTag(match)}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-tertiary/20 p-2 -mx-2 rounded-xl border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2 flex-1">
                            <div 
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm"
                                style={{ backgroundColor: team1.logo || '#3B82F6' }}
                            >
                                {team1.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm md:text-base font-semibold truncate text-text-primary">
                                {team1.name}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 shrink-0">
                            {team1Score ? (
                                <>
                                    <span className="font-mono font-bold text-lg md:text-xl tracking-tighter text-text-primary">
                                        {team1Score.score}/{team1Score.wickets ?? 0}
                                    </span>
                                    <span className="font-mono text-xs text-text-secondary">
                                        ({team1Score.overs ?? 0})
                                    </span>
                                </>
                            ) : (
                                <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-tertiary/20 p-2 -mx-2 rounded-xl border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2 flex-1">
                            <div 
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm"
                                style={{ backgroundColor: team2.logo || '#EF4444' }}
                            >
                                {team2.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm md:text-base font-semibold truncate text-text-primary">
                                {team2.name}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5 shrink-0">
                            {team2Score ? (
                                <>
                                    <span className="font-mono font-bold text-lg md:text-xl tracking-tighter text-text-primary">
                                        {team2Score.score}/{team2Score.wickets ?? 0}
                                    </span>
                                    <span className="font-mono text-xs text-text-secondary">
                                        ({team2Score.overs ?? 0})
                                    </span>
                                </>
                            ) : (
                                <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-tertiary/50 border-t border-black/5 dark:border-white/5 p-3 pl-5 mt-4 text-center">
                <span className={\`text-[12px] font-bold uppercase tracking-tight \${match.wasAbandoned ? 'text-red-500' : 'text-text-primary'}\`}>
                    {winnerMessage}
                </span>
                {manOfTheMatchPlayer && (
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-brand-blue mt-1">
                        🌟 Player of the Match: {manOfTheMatchPlayer.name}
                    </span>
                )}
            </div>
        </CrickIQCard>`;
});

fs.writeFileSync('components/MatchManager.tsx', content);
console.log('Replaced ' + matchCount + ' occurrences in MatchManager.tsx');
