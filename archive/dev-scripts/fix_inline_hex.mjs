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

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/border-\[#7193ED\]\/10/g, 'border-brand-blue/10');
    content = content.replace(/#7193ED/g, 'var(--color-brand-blue)');
    content = content.replace(/#68CFCB/g, 'var(--color-brand-teal)');
    content = content.replace(/#74BDE8/g, 'var(--color-brand-lightblue)');
    content = content.replace(/#BF9FF2/g, 'var(--color-brand-lavender)');
    content = content.replace(/#22C55E/g, 'var(--color-success)');
    content = content.replace(/#F59E0B/g, 'var(--color-warning)');
    content = content.replace(/#EF4444/g, 'var(--color-danger)');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed inline hex in', filePath);
    }
}

walkDir('./components', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    fixFile(filePath);
});
fixFile('App.tsx');
