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

    // Find "font-bold  text-white" or "rounded-full   text-white"
    // Wait, the regex replace in clean_card_classes was: content = content.replace(/bg-brand-gradient\s*text-white\s*border-0/g, '');
    // So the original string was "bg-brand-gradient text-white" OR "bg-brand-gradient text-white border-0".
    // Let's replace: "font-bold  text-white" with "font-bold bg-brand-gradient text-white text-white" (if one text-white was already there, which I stripped, wait I stripped bg-brand-gradient text-white).
    // The previous state was `className="... font-bold bg-brand-gradient text-white ..."`
    // After replace: `className="... font-bold  ..."`
    
    // Oh, the buttons in MatchManager lines 867, 871, 875, 880:
    // `rounded-full font-bold  text-white` -> we want `rounded-full font-bold bg-brand-gradient text-white`
    
    // Let's do a regex to find all buttons that have `text-white` but lack `bg-` and add `bg-brand-gradient text-white`.
    // Actually, simple string replace:
    content = content.replace(/font-bold\s+text-white shadow-/g, 'font-bold bg-brand-gradient text-white shadow-');
    content = content.replace(/text-h3\s+text-white shadow-/g, 'text-h3 bg-brand-gradient text-white shadow-');
    
    // QuickMatchStats.tsx might not have buttons, but LiveScoring.tsx:
    content = content.replace(/className="([^"]*?)text-white([^"]*?)"/g, (match, prefix, suffix) => {
        if (!prefix.includes('bg-') && !suffix.includes('bg-') && match.includes('button')) {
            // maybe it's a button? wait.
            return match;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed manual buttons in', filePath);
    }
});
