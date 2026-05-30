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

    // H1s in titles
    newContent = newContent.replace(/className="text-2xl\s+font-bold\s+text-text-primary/g, 'className="text-h1 text-text-primary');
    newContent = newContent.replace(/className="text-xl\s+md:text-2xl\s+font-bold\s+text-text-primary/g, 'className="text-h1 text-text-primary');
    newContent = newContent.replace(/className="text-2xl\s+font-extrabold\s+text-text-primary/g, 'className="text-h1 text-text-primary');
    newContent = newContent.replace(/className="text-2xl\s+font-black\s+text-text-primary/g, 'className="text-h1 text-text-primary');
    
    // H2s
    // Usually H2 is sub-headings inside main screens
    newContent = newContent.replace(/className="text-xl\s+font-bold/g, 'className="text-h2');
    newContent = newContent.replace(/className="text-xl\s+font-semibold/g, 'className="text-h2');
    
    // H3s
    newContent = newContent.replace(/className="text-lg\s+font-bold/g, 'className="text-h3');
    newContent = newContent.replace(/className="text-lg\s+font-semibold/g, 'className="text-h3');

    // Body
    // Many places use text-sm text-text-secondary. Let's make text-text-secondary standard to text-body if it's text-base.
    newContent = newContent.replace(/text-sm\s+font-normal/g, 'text-body');
    
    // Buttons
    // Usually px-4 py-2 font-bold
    newContent = newContent.replace(/font-bold\s+text-sm/g, 'text-button');
    newContent = newContent.replace(/font-bold\s+text-white/g, 'text-button text-white');
    
    // Clean up duplicates if text-button text-button text-white happen
    newContent = newContent.replace(/text-button\s+text-button/g, 'text-button');

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed typography in', filePath);
    }
});
