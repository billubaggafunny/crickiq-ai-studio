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
    if (!filePath.endsWith('.tsx') || filePath.endsWith('CrickIQCard.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Convert <div className="glass-card ..."> to <CrickIQCard className="...">
    // For standard self-closing or enclosing divs, it might be tricky with regex if it's nested
    // But since `Drawer.tsx` is well-formatted, we can try to replace `<div className=" glass-card ` with `<CrickIQCard className="`
    // And if `content` matches `glass-card`, we can just replace all `<div className="(.*?)glass-card(.*?)">` and matching `</div>`? 
    // Wait, regex matching nested `<div>` is impossible in JS.
    // Instead, just doing a string match on `className="...glass-card..."` is dangerous if we don't know the closing tag.
    
    // Instead of parsing, we can just replace `glass-card` within className strings to generic standard classes if we want, OR we can replace it with CrickIQCard if we are careful.
    
    // Let's just replace `glass-card ` with `bg-white/80 dark:bg-[#1E1F2A]/80 backdrop-blur-md rounded-[20px] border border-black/5 dark:border-white/5 shadow-sm ` directly for those places? 
    // NO, the prompt says "Create: CrickIQCard... All future cards must inherit from this component. No local card implementations."
    
    // So let's replace `<div className="glass-card(.*?)">` with `<CrickIQCard className="$1">`. 
    // Warning: `</div>` won't be replaced this way!
    
    // So let's write a simple nested tag parser... wait, that's complex.
});
