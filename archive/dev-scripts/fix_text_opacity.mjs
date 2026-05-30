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
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/text-white\/80/g, 'text-white/90');
    content = content.replace(/text-white\/60/g, 'text-white/80');
    content = content.replace(/text-black\/50/g, 'text-black/70');
    content = content.replace(/text-gray-400/g, 'text-gray-500'); 
    content = content.replace(/text-gray-500/g, 'text-slate-600'); // Better on light mode
    
    // In dark mode we usually use dark:text-gray-400 or dark:text-gray-300, replacing gray-500 might break dark mode class.
    // Actually Tailwind `text-text-secondary` handles light/dark appropriately.
    // Let's replace raw text-gray-500 with text-text-secondary.
    content = content.replace(/text-gray-500/g, 'text-text-secondary');
    content = content.replace(/text-gray-600/g, 'text-text-secondary');
    
    // For specific instances like `<p className="text-sm text-text-secondary">`, make sure we don't have conflicting text colors.

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed opacity in', filePath);
    }
});
