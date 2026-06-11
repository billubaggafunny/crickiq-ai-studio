const fs = require('fs');
let content = fs.readFileSync('components/AnalyticsOverview.tsx', 'utf8');

const regex1 = /<div className="flex flex-col h-full gap-6">[\s\S]*?<div className="mt-auto pt-2">/m;

const replacement1 = `<div className="flex flex-col h-full gap-5">
  <div className="space-y-4">
  <div className="flex justify-between items-center">
  <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2">
  {team1 && <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team1.logoColor || team1.logo || '#3B82F6' }}>
  {team1.teamInitials || team1.name.substring(0, 2).toUpperCase()}
  </div>}
  <span className="text-sm md:text-base font-semibold truncate text-text-primary">
  {team1?.name || "Unknown Team"}
  </span>
  </div>
  <div className="flex items-baseline gap-1.5 shrink-0">
  {t1Innings ? (
  <>
  <span className="font-mono font-bold text-lg md:text-xl tracking-tighter text-text-primary">
  {formatScore(t1Innings.score, t1Innings.wickets)}
  </span>
  <span className="font-mono text-xs text-text-secondary">
  ({t1Innings.overs ?? 0})
  </span>
  </>
  ) : (
  <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
  )}
  </div>
  </div>

  <div className="flex justify-between items-center">
  <div className="flex items-center gap-3 overflow-hidden min-w-0 mr-2">
  {team2 && <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-sm" style={{ backgroundColor: team2.logoColor || team2.logo || '#3B82F6' }}>
  {team2.teamInitials || team2.name.substring(0, 2).toUpperCase()}
  </div>}
  <span className="text-sm md:text-base font-semibold truncate text-text-primary">
  {team2?.name || "Unknown Team"}
  </span>
  </div>
  <div className="flex items-baseline gap-1.5 shrink-0">
  {t2Innings ? (
  <>
  <span className="font-mono font-bold text-lg md:text-xl tracking-tighter text-text-primary">
  {formatScore(t2Innings.score, t2Innings.wickets)}
  </span>
  <span className="font-mono text-xs text-text-secondary">
  ({t2Innings.overs ?? 0})
  </span>
  </>
  ) : (
  <span className="font-mono font-bold text-lg md:text-xl text-text-secondary opacity-50">DNB</span>
  )}
  </div>
  </div>
  </div>

  <div className="mt-4 pt-3 border-t border-border/50 flex flex-col items-center">
  <span className="text-sm font-bold uppercase tracking-tight text-text-primary text-center w-full">
  {winnerMessage}
  </span>
  {momName && (
  <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mt-1 text-center w-full">
  🌟 MOM: {momName}
  </span>
  )}
  </div>

  <div className="mt-auto pt-2">`;

content = content.replace(regex1, replacement1);

// Now for Highest Team Score
const regex2 = /<div className="flex-1 min-w-0 pr-4 relative z-10">\s*<p className="text-\[11px\] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">\s*Highest Team Score\s*<\/p>\s*<p className="text-lg text-text-primary">\s*\{stats\.highestTeamScore[\s\S]*?N\/A"\}\s*<\/p>/m;

const replacement2 = `<div className="flex-1 min-w-0 pr-4 relative z-10">
  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
  Highest Team Score
  </p>
  <p className="font-mono font-bold text-2xl tracking-tighter text-text-primary">
  {stats.highestTeamScore
  ? formatScore(stats.highestTeamScore.score, stats.highestTeamScore.wickets)
  : "N/A"}
  </p>`;

content = content.replace(regex2, replacement2);

fs.writeFileSync('components/AnalyticsOverview.tsx', content);
