import fs from 'fs';
import path from 'path';

let filePath = 'components/Statistics.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let newContent = content.replace(/gap-10 md:gap-12/g, 'gap-6');

if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed huge gap in Statistics.');
}

// In components/QuickMatchSetup.tsx we might have some gap-6 we can reduce.
filePath = 'components/QuickMatchSetup.tsx';
content = fs.readFileSync(filePath, 'utf8');
newContent = content.replace(/gap-6/g, 'gap-4'); // For form inputs grid
if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed QuickMatchSetup form gap.');
}

// Check other gap-6 in TournamentList, TournamentManager, etc if they apply to grids inside cards where gap-4 is better
