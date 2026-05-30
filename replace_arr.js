import fs from 'fs';
import path from 'path';

const files = [
    'components/QuickMatchHistory.tsx',
    'components/TournamentList.tsx',
    'components/LiveScoring.tsx',
    'components/Drawer.tsx',
    'components/Statistics.tsx'
];

files.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // QuickMatchHistory and TournamentList random gradients
    content = content.replace(/'from-[^']+'/g, "'bg-brand-gradient text-white border-0'");
    
    // Statistics dark:from-
    content = content.replace(/dark:from-[a-z0-9-\/]+/g, '');
    
    // LiveScoring active:from-, active:to-
    content = content.replace(/active:from-[a-aZ0-9-\/]+\s+active:to-[a-z0-9-\/]+/g, '');
    
    // Drawer hover:from- hover:to-
    content = content.replace(/hover:from-[a-z0-9-\/]+\s+hover:to-[a-z0-9-\/]+/g, '');
    
    // Also cleanup `bg-brand-gradient text-white text-white`
    content = content.replace(/text-white text-white/g, 'text-white');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Cleaned', filePath);
});
