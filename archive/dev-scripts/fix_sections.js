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

    // Replace basic block level space-y-6 with space-y-8 for sections
    newContent = newContent.replace(/className="space-y-6"/g, 'className="space-y-8"');
    newContent = newContent.replace(/className="space-y-6 animate-fade-in"/g, 'className="space-y-8 animate-fade-in"');
    newContent = newContent.replace(/className="animate-fade-in space-y-6"/g, 'className="animate-fade-in space-y-8"');
    
    // Also verify form inputs spacing:
    // If a form has space-y-6, we replaced some above, but space-y-8 might be too big for forms.
    // However, CrickIQ typically uses space-y-6 for the root content wrapper, and within forms it used space-y-4 or space-y-2. Let's rely on standard layouts.

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed section gaps in', filePath);
    }
});
