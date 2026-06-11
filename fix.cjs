const fs = require('fs');
const filePath = 'components/AnalyticsOverview.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const regex1 = /<div className="flex flex-col h-full gap-6">\s*<div className="flex justify-between items-center gap-4">[\s\S]*?<div className="mt-auto pt-2">/m;

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
  {formatInningsScore(t1Innings)}
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
  {formatInningsScore(t2Innings)}
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

// Highest Team Score fix
const regex2 = /<p className="text-lg text-text-primary">\s*\{stats\.highestTeamScore\s*\?\s*formatScore\(stats\.highestTeamScore\.score, stats\.highestTeamScore\.wickets\)\s*:\s*"N\/A"\}\s*<\/p>/m;

const replacement2 = `<p className="font-mono font-bold text-2xl tracking-tighter text-text-primary">
  {stats.highestTeamScore
  ? formatScore(stats.highestTeamScore.score, stats.highestTeamScore.wickets)
  : "N/A"}
  </p>`;

content = content.replace(regex2, replacement2);

fs.writeFileSync(filePath, content);
console.log('Fixed file');
