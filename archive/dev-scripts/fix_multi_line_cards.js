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

const stripCardRegex = /const Card:\s*React\.FC<[\s\S]*?>\s*=\s*\(\{ children, className, \.\.\.rest \}\) => \([\s\S]*?<\/div>\s*\);\n/g;

walkDir('./components', function(filePath) {
    if (!filePath.endsWith('.tsx') || filePath.endsWith('CrickIQCard.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(stripCardRegex, '');
    
    // Also replace `<div ... glass-card...>` in MatchManager and SettingsMenu and Calendar
    // Wait, Calendar.tsx line 91 uses `glass-card`. It's a dialog. It can be a CrickIQCard.
    // MatchManager line 810: `<div key={match.id} className="glass-card ...`
    
    content = content.replace(/<div([^>]*)className="[^"]*glass-card[^"]*"([^>]*)>/g, '<CrickIQCard$1$2>');
    content = content.replace(/<\/div>(\s*<!-- glass-card -->)/g, '</CrickIQCard>');

    if (original.match(/<Card\b/) && content !== original) {
        if (!content.includes("import CrickIQCard")) {
            content = "import CrickIQCard from './CrickIQCard';\n" + content;
        }
    }
    content = content.replace(/<Card\b/g, '<CrickIQCard');
    content = content.replace(/<\/Card>/g, '</CrickIQCard>');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed multiline cards in', filePath);
    }
});
