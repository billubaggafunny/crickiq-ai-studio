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

    // We replace variant map in Button
    // Looking for something like:
    /*
        variant === 'secondary' ? 'text-text-primary hover:brightness-105 border border-border-color'
        : variant === 'blue' ? 'bg-brand-blue text-white'
        : 'bg-brand-gradient text-white border-0'; // primary
    */
    
    // Some buttons may just be manually assigned. 
    // Wait, the easiest is to just use a blanket regex for Button definitions.
    
    content = content.replace(/const variantClasses =([\s\S]*?); \/\/ primary/gm, 
        `const variantClasses = variant === 'secondary' ? 'bg-brand-lightblue text-white border-0' : variant === 'blue' ? 'bg-brand-blue text-white border-0' : 'bg-brand-gradient text-white border-0'; // primary`);

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed Buttons in', filePath);
    }
});
