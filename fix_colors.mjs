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

walkDir('./', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove text-premium-purple
    content = content.replace(/text-premium-purple/g, 'text-brand-blue');
    content = content.replace(/text-premium-blue/g, 'text-brand-blue');
    content = content.replace(/bg-premium-blue/g, 'bg-brand-blue');
    content = content.replace(/bg-premium-purple/g, 'bg-brand-blue');

    // Remove arbitrary text-accent etc on tabs? 
    // They say "Active Tab Colors: Text: #7193ED" -> text-brand-blue
    content = content.replace(/text-accent/g, 'text-brand-blue');
    content = content.replace(/bg-accent/g, 'bg-brand-blue');
    content = content.replace(/ring-accent/g, 'ring-brand-blue');
    content = content.replace(/border-accent/g, 'border-brand-blue');
    // Primary buttons
    // The previous bg-accent text-white buttons should probably become primary buttons
    // Wait, let's just make sure Buttons have "bg-brand-gradient" if they are primary. 
    // Or we leave bg-brand-blue on secondary ones. Let me check what they used before:
    // "Create Tournament", "Schedule Match", "Compare Teams", "Start Match", "Manage Tournament" -> Primary
    
    // Bottom Navigation
    // it was using text-premium-purple and bg-premium-purple / text-text-secondary. Now replaced.

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
