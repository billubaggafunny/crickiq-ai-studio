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
    if (!filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We want to force all text-like inputs to use the new border system.
    // Instead of regexing inputs, we can just replace border classes on inputs.
    // Basically `bg-white/80 dark:bg-black/20 border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue` ->
    // -> `bg-white border border-brand-blue/15 rounded-lg focus:outline-none focus:border-brand-blue focus:ring-0 shadow-sm`
    // "Border: rgba(113,147,237,0.15)" is brand-blue/15.
    
    // Replace standard patterns
    content = content.replace(/border-border-color focus:ring-brand-blue/g, 'border-brand-blue/15 focus:border-brand-blue focus:ring-0 shadow-sm');
    content = content.replace(/bg-white\/80 dark:bg-black\/20/g, 'bg-white text-black');
    content = content.replace(/border-gray-300 dark:border-gray-600/g, 'border-brand-blue/15');
    content = content.replace(/bg-white\/50/g, 'bg-white'); // some backgrounds
    content = content.replace(/bg-transparent/g, 'bg-white');
    content = content.replace(/border-border-color/g, 'border-brand-blue/15');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed inputs in', filePath);
    }
});
