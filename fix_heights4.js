import fs from 'fs';
import path from 'path';

let filePath = 'components/TournamentList.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let newContent = content.replace(/py-1\.5/g, 'py-1');
newContent = newContent.replace(/<div className="flex items-center gap-4 text-text-secondary">/g, '<div className="flex items-center gap-2 text-text-secondary">');
        
if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed tournament card row spacing.');
}

// Points Table -> "Reduce card top/bottom padding, filter spacing, Table header spacing"
// The points table already had its Card changed to !p-4. Let's see if there's filtering.
filePath = 'components/PointsTable.tsx';
content = fs.readFileSync(filePath, 'utf8');
// find the spacing between filters
newContent = content.replace(/className="flex flex-col sm:flex-row items-stretch gap-4"/g, 'className="flex flex-col sm:flex-row items-stretch gap-2"');
// and the table header wrapper spacing
newContent = newContent.replace(/className="space-y-6"/g, 'className="space-y-4"');

if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed Points Table gap.');
}
