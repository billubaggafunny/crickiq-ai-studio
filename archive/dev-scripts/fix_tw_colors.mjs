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

    content = content.replace(/text-blue-500/g, 'text-brand-blue');
    content = content.replace(/text-blue-600/g, 'text-brand-blue');
    content = content.replace(/bg-blue-600 hover:bg-blue-700/g, 'bg-brand-gradient');
    content = content.replace(/bg-blue-50/g, 'bg-brand-blue/10');
    content = content.replace(/bg-blue-100/g, 'bg-brand-blue/20');

    content = content.replace(/bg-purple-600 hover:bg-purple-700/g, 'bg-brand-gradient');
    content = content.replace(/text-purple-600/g, 'text-brand-lavender');
    content = content.replace(/text-purple-500/g, 'text-brand-lavender');
    content = content.replace(/bg-purple-50/g, 'bg-brand-lavender/10');
    content = content.replace(/bg-purple-100/g, 'bg-brand-lavender/20');
    
    content = content.replace(/text-green-500/g, 'text-success');
    content = content.replace(/text-green-600/g, 'text-success');
    content = content.replace(/bg-green-50/g, 'bg-success/10');
    content = content.replace(/bg-green-100/g, 'bg-success/20');
    
    content = content.replace(/text-red-500/g, 'text-danger');
    content = content.replace(/text-red-600/g, 'text-danger');
    content = content.replace(/bg-red-50/g, 'bg-danger/10');
    content = content.replace(/bg-red-100/g, 'bg-danger/20');
    
    content = content.replace(/text-yellow-500/g, 'text-warning');
    content = content.replace(/text-yellow-600/g, 'text-warning');
    content = content.replace(/bg-yellow-50/g, 'bg-warning/10');
    content = content.replace(/bg-yellow-100/g, 'bg-warning/20');
    content = content.replace(/bg-yellow-500\/20/g, 'bg-warning/20');
    content = content.replace(/dark:bg-yellow-900\/20/g, 'dark:bg-warning/20');
    content = content.replace(/dark:bg-yellow-900\/30/g, 'dark:bg-warning/20');
    content = content.replace(/dark:to-yellow-800\/10/g, '');
    
    // Gradients
    content = content.replace(/bg-gradient-to-br from-yellow-50 to-yellow-100/g, 'bg-warning/10');
    content = content.replace(/bg-gradient-to-r from-amber-400 to-yellow-500/g, 'bg-warning text-white');
    content = content.replace(/bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500/g, 'bg-warning text-white');
    content = content.replace(/bg-gradient-to-r from-yellow-400\/10 to-yellow-500\/10 hover:from-yellow-400\/20 hover:to-yellow-500\/20 text-yellow-600 dark:text-yellow-400/g, 'bg-brand-gradient text-white');
    content = content.replace(/text-yellow-400/g, 'text-white'); // in case it was applied to the above
    
    content = content.replace(/text-orange-500/g, 'text-warning');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed Tailwind colors in', filePath);
    }
});
