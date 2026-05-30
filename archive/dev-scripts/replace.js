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

let modified = 0;

walkDir('.', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && filePath !== 'index.html') return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    if (filePath === 'index.html') {
        const cssReplacements = [
            [/--color-theme-purple:\s*#[0-9a-fA-F]+;/g, '--color-theme-purple: #7C3AED;'],
            [/--color-theme-blue:\s*#[0-9a-fA-F]+;/g, '--color-theme-blue: #3B82F6;'],
            [/--color-theme-orange:\s*#[0-9a-fA-F]+;/g, '--color-theme-orange: #F59E0B;'],
            [/--color-theme-green:\s*#[0-9a-fA-F]+;/g, '--color-theme-green: #22C55E;'],
            [/--color-premium-purple:\s*#[0-9a-fA-F]+;/g, '--color-premium-purple: #7C3AED;'],
            [/--color-premium-blue:\s*#[0-9a-fA-F]+;/g, '--color-premium-blue: #3B82F6;'],
            [/--color-highlight:\s*#[0-9a-fA-F]+;/g, '--color-highlight: #EF4444;'],
            [/--color-accent:\s*var\(--color-theme-purple\);/g, '--color-accent: #7C3AED;'],
            [/--color-accent-light:\s*var\(--color-theme-purple-light\);/g, '--color-accent-light: #7C3AED;']
        ];
        
        for (const [regex, replacement] of cssReplacements) {
            newContent = newContent.replace(regex, replacement);
        }
        
        if (!newContent.includes('brand-gradient')) {
            newContent = newContent.replace(
                /colors: \{/,
                "colors: {\n              'brand-purple': '#7C3AED',\n              'brand-blue': '#3B82F6',\n              'success': '#22C55E',\n              'warning': '#F59E0B',\n              'danger': '#EF4444',"
            );
            newContent = newContent.replace(
                /extend: \{/,
                "extend: {\n            backgroundImage: {\n              'brand-gradient': 'linear-gradient(to right, #7C3AED, #3B82F6)',\n            },"
            );
        }
        
        // Remove background image gradients in index.html styles
        newContent = newContent.replace(/background-image:\s*linear-gradient[^;]+;/g, 'background-image: none;');
    } else {
        // Replace tailwind class decorative gradients
        // This regex matches `bg-gradient-to-[a-z]+ from-[a-z0-9-]+ to-[a-z0-9-]+` 
        // as well as `via-[a-z0-9-]+` if present.
        const regex1 = /bg-gradient-[a-z0-9-]+\s+from-[a-z0-9-]+\s*(?:via-[a-z0-9-]+\s*)?to-[a-z0-9-]+/g;
        // We might also just have `bg-gradient-to-[a-z]+` without from/to on the same line if split, but that's unlikely in classNames.
        // Let's replace any `bg-gradient-...`, `from-...`, `to-...` with `bg-brand-gradient` if they occur together.
        newContent = newContent.replace(regex1, 'bg-brand-gradient text-white');
        
        // Also sometimes they are separated `from-purple-400 to-purple-600 bg-gradient-to-r`
        const regex2 = /from-[a-z0-9-]+\s+(?:via-[a-z0-9-]+\s*)?to-[a-z0-9-]+\s+bg-gradient-[a-z0-9-]+/g;
        newContent = newContent.replace(regex2, 'bg-brand-gradient text-white');
        
        // A catch all for remaining random color gradients:
        // Let's just find anything with 'bg-gradient-to-X', capture the full string of classes related:
        // This is safe provided they don't break lines in the class string.
    }

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Modified', filePath);
        modified++;
    }
});

console.log('Total modified:', modified);
