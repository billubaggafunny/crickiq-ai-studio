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

    // Standardize glass-card padding to p-6
    newContent = newContent.replace(/glass-card\s+p-[0-9]+/g, 'glass-card p-6');
    newContent = newContent.replace(/glass-card\s+flex\s+flex-col\s+items-center\s+justify-center\s+gap-2/g, 'h-32 glass-card p-6 flex flex-col items-center justify-center gap-2');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed cards in', filePath);
    }
});
