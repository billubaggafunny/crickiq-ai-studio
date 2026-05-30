import fs from 'fs';

let content = fs.readFileSync('components/QuickMatchHistory.tsx', 'utf8');
content = content.replace(/bg-gradient-to-br text-white \$\{gradientClass\}/g, '');
content = content.replace(/text-caption text-white\/80/g, 'text-caption text-text-secondary');
content = content.replace(/bg-white\/20 text-white border-white\/30/g, 'bg-accent/10 border-accent/30 text-accent');
content = content.replace(/const gradientClass = GRADIENTS\[index % GRADIENTS.length\];/g, '');
content = content.replace(/const GRADIENTS = \[[\s\S]*?\];/g, '');
content = content.replace(/\/\/ Colorful gradients for the cards\n/, '');
fs.writeFileSync('components/QuickMatchHistory.tsx', content, 'utf8');

content = fs.readFileSync('components/TournamentList.tsx', 'utf8');
content = content.replace(/bg-gradient-to-r \$\{gradientClass\} text-white/g, 'bg-brand-gradient text-white'); // Hero Card? Actually they were just random gradients. Let's make all of them normal card headers, or Hero cards?
// Wait, "Maximum: 1 hero card per screen." For TournamentList, maybe not all of them hero cards.
// Let's replace the tournament card header with standard styles.
content = content.replace(/bg-gradient-to-r \$\{gradientClass\} text-white/g, 'bg-primary border-b border-border-color text-text-primary'); 
content = content.replace(/const gradientClass = GRADIENTS\[index % GRADIENTS.length\];/g, '');
content = content.replace(/const GRADIENTS = \[[\s\S]*?\];/g, '');
content = content.replace(/bg-white\/20/g, 'bg-accent/10 text-accent'); // adjust badges
// ensure text-white doesn't stay if not desired
content = content.replace(/text-white\/80/g, 'text-accent/80');

fs.writeFileSync('components/TournamentList.tsx', content, 'utf8');
