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

    // Fix CTA buttons taking brand-gradient to have mt-6
    // E.g., class="... mt-4 ... bg-brand-gradient" -> class="... mt-6 ... bg-brand-gradient"
    const regex = /className="([^"]*)mt-[0-9]+([^"]*)bg-brand-gradient([^"]*)"/g;
    newContent = newContent.replace(regex, 'className="$1mt-6$2bg-brand-gradient$3"');
    
    // Also change space-y-6 inside form-like areas or generally where space-y-6 is used between inputs to space-y-4 where possible?
    // Let's standardise the main space-y to space-y-8 for sections.
    // Major section gaps. Wait, we can't blindly replace space-y without looking.
    
    // We can replace standard flex gaps:
    // If it's a major container maybe we don't have enough context. But we can ensure spacing tokens are clean.
    
    // Let's ensure form inputs space-y is 4.
    // often `<div className="space-y-4">` enclosing inputs.
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed buttons in', filePath);
    }
});
