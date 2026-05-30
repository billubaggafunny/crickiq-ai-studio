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

    // Clean up classNames on CrickIQCard
    // We want to remove bg-brand-gradient, text-white, border-0, dark:bg-brand-gradient, dark:text-white, border-purple-500/20, etc.
    // However, text-white might be needed for contrast if someone forced it, but since we are standardizing the background, text-primary/secondary should be used.
    
    // Instead of parsing perfectly, let's just regex replace common bad background/border strings inside CrickIQCard className="...".
    
    content = content.replace(/bg-brand-gradient\s*text-white\s*border-0\s*dark:bg-brand-gradient\s*dark:text-white\s*border\s*border-[a-z]+-500\/20/g, '');
    content = content.replace(/bg-brand-gradient\s*text-white\s*border-0/g, '');
    content = content.replace(/bg-brand-gradient\s*text-white/g, '');
    content = content.replace(/dark:bg-brand-gradient\s*dark:text-white/g, '');
    content = content.replace(/bg-gradient-to-[a-z]{1,2}.*?to-[a-z]+-\d{2,3}/g, '');
    
    // Some cards have padding manually specified like px-4 py-6 or py-4 px-6. We can strip padding from CrickIQCard className if we want them to use default.
    // The prompt says "Remove custom padding values. No p-3. No p-5. No p-6. Only official token." (padding is p-6 as standard, but we default to it).
    // Let's replace padding utilities in CrickIQCard.
    
    // This requires slightly more careful regex, specifically inside `<CrickIQCard ... className="...px-6 py-4..."`
    
    // But since it's hard to reliably target only CrickIQCard with regex, we can target ALL p-\d px-\d py-\d inside components if they are on glass-card or Card?
    // Let's just fix up the <CrickIQCard> tags.
    
    const crickIQCardRegex = /<CrickIQCard([^>]*)className="([^"]+)"([^>]*)>/g;
    content = content.replace(crickIQCardRegex, (match, prefix, className, suffix) => {
        let newClassName = className
            .replace(/\b(px|py|p|pt|pb|pl|pr)-\d+\b/g, '')
            .replace(/\b(px|py|p|pt|pb|pl|pr)-\d+\.\d+\b/g, '')
            .replace(/\b(shadow|border)-(sm|md|lg|xl)\b/g, '')
            .replace(/\bborder-0\b/g, '')
            .replace(/\bborder\b/g, '')
            .replace(/\bbg-\S+\b/g, '')
            .replace(/\bdark:bg-\S+\b/g, '')
            .replace(/\bdark:text-white\b/g, '')
            .replace(/\btext-white\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        return `<CrickIQCard${prefix}${newClassName ? ` className="${newClassName}"` : ''}${suffix}>`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Cleaned card classes in', filePath);
    }
});
