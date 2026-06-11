const fs = require('fs');

// 1. Update ScheduleGenerator.tsx
let sgContent = fs.readFileSync('components/ScheduleGenerator.tsx', 'utf-8');
const sgRegex = /<ul className="space-y-2 pl-2">[\s\S]*?<\/ul>/;
const sgReplacement = `<div className="space-y-3">
                                        {(matches as { team1Name: string, team2Name: string }[]).map((match, index) => (
                                            <div key={index} className="flex justify-between items-center bg-tertiary/20 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                                                <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2 flex-1">
                                                    <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 text-text-primary font-bold text-sm">
                                                        {match.team1Name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-semibold truncate text-text-primary">
                                                        {match.team1Name}
                                                    </span>
                                                </div>
                                                <span className="shrink-0 text-[10px] font-bold text-text-secondary px-2 opacity-50 uppercase tracking-widest">VS</span>
                                                <div className="flex items-center gap-3 overflow-hidden min-w-0 ml-2 flex-1 flex-row-reverse text-right">
                                                    <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-black/5 dark:bg-white/10 text-text-primary font-bold text-sm">
                                                        {match.team2Name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-semibold truncate text-text-primary">
                                                        {match.team2Name}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>`;

if (sgRegex.test(sgContent)) {
    fs.writeFileSync('components/ScheduleGenerator.tsx', sgContent.replace(sgRegex, sgReplacement));
    console.log('Updated ScheduleGenerator.tsx');
} else {
    console.error('Failed to match ScheduleGenerator.tsx');
}
