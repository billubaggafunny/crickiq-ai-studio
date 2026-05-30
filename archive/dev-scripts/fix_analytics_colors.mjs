import fs from 'fs';

let content = fs.readFileSync('components/QuickMatchStats.tsx', 'utf8');
// Top Scorer Value
content = content.replace(/<p className="text-3xl text-brand-blue">\{topScorer\.runsScored\}<\/p>/g, '<p className="text-3xl text-brand-teal">{topScorer.runsScored}</p>');
content = content.replace(/<Bar dataKey="runs" fill="var\(--color-accent\)"/g, '<Bar dataKey="runs" fill="#68CFCB"');

// Top Wicket Taker Value
content = content.replace(/<p className="text-3xl text-brand-blue">\{topBowler\.wicketsTaken\}<\/p>/g, '<p className="text-3xl text-brand-lightblue">{topBowler.wicketsTaken}</p>');
content = content.replace(/<Bar dataKey="wickets" fill="var\(--color-accent\)"/g, '<Bar dataKey="wickets" fill="#74BDE8"');

fs.writeFileSync('components/QuickMatchStats.tsx', content, 'utf8');

// Statistics.tsx
content = fs.readFileSync('components/Statistics.tsx', 'utf8');

// Replace general bar chart colors with brand-lavender if they use --color-accent? Or whatever fits.
content = content.replace(/fill="var\(--color-accent\)"/g, 'fill="#BF9FF2"'); // Premium Stats for general charts

// Any top scorers / bowlers in Statistics.tsx?
content = content.replace(/<p className="text-3xl font-bold text-brand-blue">\{topScorer\.totalRuns\}<\/p>/g, '<p className="text-3xl font-bold text-brand-teal">{topScorer.totalRuns}</p>');
content = content.replace(/<p className="text-3xl font-bold text-brand-blue">\{topWicketTaker\.totalWickets\}<\/p>/g, '<p className="text-3xl font-bold text-brand-lightblue">{topWicketTaker.totalWickets}</p>');

fs.writeFileSync('components/Statistics.tsx', content, 'utf8');
