import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (dirPath.includes('node_modules') || dirPath.includes('.git') || dirPath.includes('dist')) return;
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./components', function(filePath) {
    if (!filePath.endsWith('.tsx') || filePath.endsWith('CrickIQTable.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We want to add w-full to the first <Th in a table, but only if it's "Team", "Batsman", "Bowler", "Player", etc.
    // Also the corresponding first <Td.
    // Actually, rather than regex magic, we can just replace `<Th >Batsman</Th>` with `<Th className="w-full max-w-[120px] truncate">Batsman</Th>`
    
    content = content.replace(/<Th >Batsman<\/Th>/g, '<Th className="w-full">Batsman</Th>');
    content = content.replace(/<Th >Bowler<\/Th>/g, '<Th className="w-full">Bowler</Th>');
    content = content.replace(/<Th >Player<\/Th>/g, '<Th className="w-full">Player</Th>');
    content = content.replace(/<Th >Team<\/Th>/g, '<Th className="w-full">Team</Th>');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed full width columns in', filePath);
    }
});
