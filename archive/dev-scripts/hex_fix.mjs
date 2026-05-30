import fs from 'fs';

let matchManager = fs.readFileSync('components/MatchManager.tsx', 'utf8');
matchManager = matchManager.replace(/dark:bg-\[#1a1a2e\]/g, 'dark:bg-secondary');
fs.writeFileSync('components/MatchManager.tsx', matchManager, 'utf8');

let analyticsWorkspace = fs.readFileSync('components/AnalyticsWorkspace.tsx', 'utf8');
analyticsWorkspace = analyticsWorkspace.replace(/dark:bg-\[#1a1a2e\]/g, 'dark:bg-secondary');
fs.writeFileSync('components/AnalyticsWorkspace.tsx', analyticsWorkspace, 'utf8');

let rankings = fs.readFileSync('components/Rankings.tsx', 'utf8');
rankings = rankings.replace(/dark:bg-\[#1a1a2e\]/g, 'dark:bg-secondary');
fs.writeFileSync('components/Rankings.tsx', rankings, 'utf8');

let liveScoring = fs.readFileSync('components/LiveScoring.tsx', 'utf8');
liveScoring = liveScoring.replace(/bg-\[#74dfc4\]/g, 'bg-teal-400');
liveScoring = liveScoring.replace(/bg-\[#9fb7d9\]/g, 'bg-slate-400');
liveScoring = liveScoring.replace(/bg-\[#fff59d\]/g, 'bg-yellow-300');
liveScoring = liveScoring.replace(/bg-\[#a2d2ff\]/g, 'bg-blue-300');
fs.writeFileSync('components/LiveScoring.tsx', liveScoring, 'utf8');

let appTxs = fs.readFileSync('App.tsx', 'utf8');
appTxs = appTxs.replace(/dark:bg-\[#1E1F2A\]/g, 'dark:bg-secondary');
fs.writeFileSync('App.tsx', appTxs, 'utf8');
