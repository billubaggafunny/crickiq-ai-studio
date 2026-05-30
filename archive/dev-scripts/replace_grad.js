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

const REGEXES = [
    /bg-gradient-to-[a-z]+\s+from-[a-z0-9-\/]+\s+to-[a-z0-9-\/]+/g,
    /bg-gradient-to-[a-z]+\s+from-[a-z0-9-\/]+\s+via-[a-z0-9-\/]+\s+to-[a-z0-9-\/]+/g,
    /from-[a-z0-9-\/]+\s+via-[a-z0-9-\/]+\s+to-[a-z0-9-\/]+\s+bg-gradient-to-[a-z]+/g,
    /from-[a-z0-9-\/]+\s+to-[a-z0-9-\/]+\s+bg-gradient-to-[a-z]+/g,
    // Dark mode variants
    /dark:from-[a-z0-9-\/]+\s+dark:to-[a-z0-9-\/]+/g,
    /dark:from-[a-z0-9-\/]+\s+dark:via-[a-z0-9-\/]+\s+dark:to-[a-z0-9-\/]+/g,
    // specific separated ones based on previous grep:
    /bg-gradient-to-r\s+from-accent\s+to-theme-orange/g,
    /bg-gradient-to-br\s+from-white\s+to-gray-200/g,
    /bg-gradient-to-b\s+from-purple-200\s+to-white/g,
    /bg-gradient-to-br\s+from-amber-200\s+via-yellow-300\s+to-amber-200/g,
    /from-accent\s+to-theme-orange/g,
    /bg-gradient-to-[a-z]+\s+from-[^'" ]+\s+to-[^'" ]+/g,
    /bg-gradient-to-[a-z]+\s+from-[^'" ]+\s+via-[^'" ]+\s+to-[^'" ]+/g
];

let modified = 0;

walkDir('.', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && filePath !== 'index.html') return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    if (filePath !== 'index.html') {
        REGEXES.forEach(regex => {
            newContent = newContent.replace(regex, (match) => {
                if(match.includes('dark:')) return 'dark:bg-brand-gradient dark:text-white';
                return 'bg-brand-gradient text-white border-0';
            });
        });
        
        // Catch stragglers
        newContent = newContent.replace(/bg-gradient-to-[a-z]+\s+(dark:bg-[^ ]+\s+)?from-[^ ]+\s+to-[^ ]+/g, 'bg-brand-gradient text-white border-0 $1');
    }

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Modified', filePath);
        modified++;
    }
});

console.log('Total modified:', modified);
