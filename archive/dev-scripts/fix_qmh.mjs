import fs from 'fs';

let content = fs.readFileSync('components/QuickMatchHistory.tsx', 'utf8');

content = content.replace(/text-white\/80/g, 'text-text-secondary');
content = content.replace(/bg-white\/30/g, 'bg-accent/10 text-accent font-bold');
content = content.replace(/bg-black\/20/g, 'bg-black/5 dark:bg-white/5');

fs.writeFileSync('components/QuickMatchHistory.tsx', content, 'utf8');
