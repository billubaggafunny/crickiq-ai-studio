const fs = require('fs');

let content = fs.readFileSync('components/TournamentProgressTracker.tsx', 'utf-8');

const regex = /ClockIcon className="w-4 h-4 animate-pulse" \/>/;
const replacement = `ClockIcon className="w-4 h-4" />`;

if (regex.test(content)) {
    fs.writeFileSync('components/TournamentProgressTracker.tsx', content.replace(regex, replacement));
    console.log('Updated TournamentProgressTracker.tsx');
} else {
    console.error('Failed to match TournamentProgressTracker.tsx');
}
