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

let modified = 0;

walkDir('.', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // 1. Reduce top-level section space-y-8 (32px) to space-y-6 (24px) for major vertical spacing
    newContent = newContent.replace(/space-y-8/g, 'space-y-6');

    // 2. Reduce card paddings from p-6 (24px) to px-6 py-4 (24px h, 16px v)
    newContent = newContent.replace(/glass-card\s+p-6/g, 'glass-card px-6 py-4');

    // 3. Tab bar optimization
    // `px-4 py-2.5` -> `px-4 py-1.5`
    newContent = newContent.replace(/py-2\.5/g, 'py-1.5');
    // For MatchManager & others: `py-2 px-1` -> `py-1.5 px-1`
    newContent = newContent.replace(/className="([^"]*)py-2\s+px-1([^"]*)"/g, 'className="$1py-1.5 px-1$2"');
    
    // AnalyticsWorkspace tabs
    newContent = newContent.replace(/py-2.5\s+text-body\s+font-semibold/g, 'py-1.5 text-body font-semibold');
    
    // 4. Header title gaps: `pt-4` in headers -> `pt-2`
    // Typically `className="text-h1.*pt-4"` -> `pt-2`
    newContent = newContent.replace(/className="([^"]*)text-h1([^"]*)pt-4([^"]*)"/g, 'className="$1text-h1$2pt-2$3"');

    // 5. Input stacking optimization inside forms
    // Any remaining `space-y-6` under forms could be `space-y-4`
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed heights in', filePath);
        modified++;
    }
});
console.log('Total files modified:', modified);
