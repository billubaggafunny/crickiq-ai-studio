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

    content = content.replace(/accent-premium-purple/g, 'accent-brand-blue');
    content = content.replace(/accent-theme-orange/g, 'accent-warning');
    content = content.replace(/var\(--color-theme-orange\)/g, '#F59E0B');
    content = content.replace(/-purple-500\/10/g, ''); // empty class remnants
    content = content.replace(/dark:border-premium-purple/g, 'dark:border-brand-blue');
    
    // Orange classes -> warning
    content = content.replace(/bg-orange-50\/50/g, 'bg-warning/10');
    content = content.replace(/dark:bg-orange-900\/10/g, 'dark:bg-warning/10');
    content = content.replace(/dark:bg-orange-900\/30/g, 'dark:bg-warning/20');
    content = content.replace(/border-orange-100\/50/g, 'border-warning/30');
    content = content.replace(/dark:border-orange-800\/30/g, 'dark:border-warning/30');
    content = content.replace(/text-orange-700/g, 'text-warning');
    content = content.replace(/dark:text-orange-400/g, 'text-warning');
    
    // Purple classes -> brand-lavender
    content = content.replace(/dark:bg-purple-900\/30/g, 'dark:bg-brand-lavender/30');
    content = content.replace(/dark:text-purple-400/g, 'text-brand-lavender');
    content = content.replace(/border-purple-500\/10/g, 'border-brand-lavender/10');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed stragglers in', filePath);
    }
});
