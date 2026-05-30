import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (dirPath === 'node_modules' || dirPath === '.git' || dirPath === 'dist') return;
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('.', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Mobile Header inside App.tsx
    if (filePath.includes('App.tsx')) {
        newContent = newContent.replace(/<header className="md:hidden\s+p-4/g, '<header className="md:hidden px-4 py-3');
    }

    if (filePath.includes('PointsTable.tsx')) {
        // Find Cards and ensure minimal padding for Points Table Card
        newContent = newContent.replace(/<Card>/g, '<Card className="!p-4 sm:!p-6">');
        // If there's already some className it won't match, but we have <Card> naked in PointsTable
    }
    
    if (filePath.includes('Statistics.tsx')) {
        // Space between filters and cards
        newContent = newContent.replace(/space-y-6 pb-12/g, 'space-y-4 pb-8');
    }
    
    if (filePath.includes('MatchHistory') || filePath.includes('MatchScorecard')) {
        // Scorecard summary spacing
        newContent = newContent.replace(/space-y-6/g, 'space-y-4');
    }

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed heights 3 in', filePath);
    }
});
