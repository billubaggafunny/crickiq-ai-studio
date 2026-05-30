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

const removableHeaders = [
    '<h2 className="text-h1 text-text-primary items-center gap-2 flex pt-2">\\s*<CalendarIcon className="w-6 h-6" \/>\\s*Tournaments\\s*<\/h2>',
    '<h2 className="text-h1 text-text-primary items-center gap-2 flex pt-2">\\s*<TrophyIcon className="w-6 h-6" \/>\\s*Home\\s*<\/h2>',
    '<h2 className="text-h1 text-text-primary flex items-center gap-2 pt-2">\\s*<AnalyticsIcon className="w-6 h-6 text-accent" \/>\\s*Analytics Hub\\s*<\/h2>',
    '<h2 className="text-h1 text-text-primary">Team Stats<\/h2>',
    '<h2 className="text-h1 text-text-primary mb-6">Settings<\/h2>', // if exist
    '<h2 className="text-h1 text-text-primary">Quick Match Stats<\/h2>'
];

walkDir('.', function(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    removableHeaders.forEach(regexStr => {
        const regex = new RegExp(regexStr, 'g');
        content = content.replace(regex, '');
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Cleaned headers in', filePath);
    }
});
