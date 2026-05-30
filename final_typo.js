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

    // Remaining text-sm / text-xs replacing to text-body / text-caption based on common patterns.
    newContent = newContent.replace(/\s+text-sm\b/g, ' text-body');
    newContent = newContent.replace(/\s+text-xs\b/g, ' text-caption');
    
    // Remove unwanted font-weights
    newContent = newContent.replace(/\s+font-thin\b/g, '');
    newContent = newContent.replace(/\s+font-light\b/g, '');
    newContent = newContent.replace(/\s+font-extrabold\b/g, '');
    newContent = newContent.replace(/\s+font-black\b/g, '');
    newContent = newContent.replace(/\s+font-medium\b/g, '');
    // newContent = newContent.replace(/\s+font-semibold\b/g, '');
    // newContent = newContent.replace(/\s+font-bold\b/g, '');

    // text-h1, text-h2 missing sizes
    newContent = newContent.replace(/\s+text-3xl\b/g, ' text-h1');
    newContent = newContent.replace(/\s+text-2xl\b/g, ' text-h1');
    newContent = newContent.replace(/\s+text-xl\b/g, ' text-h2');
    newContent = newContent.replace(/\s+text-lg\b/g, ' text-h3');
    newContent = newContent.replace(/\s+text-base\b/g, ' text-body');

    // To prevent something taking double tokens like text-h1 text-h1
    newContent = newContent.replace(/\b(text-(?:h1|h2|h3|body|caption|table-header|table-cell|form-label|form-input|button|tab|status))\s+(?:\1)\b/g, '$1');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Final typo cleanup in', filePath);
    }
});
