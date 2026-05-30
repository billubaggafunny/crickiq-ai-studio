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

    // Find the Button component and replace it.
    // It looks roughly like:
    // const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ... }> = ... { ... return <button ... }
    
    const buttonRegex = /const Button:\s*React\.FC<React\.ButtonHTMLAttributes<HTMLButtonElement>\s*&\s*\{\s*variant\?:\s*'primary'\s*\|\s*'secondary'\s*\|\s*'blue'\s*\}\s*>\s*=\s*\(\{ children, className.*?=>\s*\{[\s\S]*?<\/button>\s*\n\};/g;

    const stdButton = `const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'blue' }> = ({ children, className = '', variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-full text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses =
        variant === 'secondary' ? 'text-text-primary hover:brightness-105 border border-border-color'
        : variant === 'blue' ? 'bg-premium-blue text-white'
        : 'bg-brand-gradient text-white border-0'; // primary

    return <button {...props} className={\`\${baseClasses} \${variantClasses} \${className}\`}>{children}</button>
};`;
    
    content = content.replace(buttonRegex, stdButton);
    
    // Also try finding variants without 'blue' if it exists
    const buttonRegexSimple = /const Button:\s*React\.FC<React\.ButtonHTMLAttributes<HTMLButtonElement>\s*&\s*\{\s*variant\?:\s*'primary'\s*\|\s*'secondary'\s*\}\s*>\s*=\s*\(\{ children, className.*?=>\s*\{[\s\S]*?<\/button>\s*\n\};/g;

    const stdButtonSimple = `const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }> = ({ children, className = '', variant = 'primary', ...props }) => {
    const baseClasses = 'px-4 py-2 rounded-full text-button transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md';
    const variantClasses =
        variant === 'secondary' ? 'text-text-primary hover:brightness-105 border border-border-color'
        : 'bg-brand-gradient text-white border-0'; // primary

    return <button {...props} className={\`\${baseClasses} \${variantClasses} \${className}\`}>{children}</button>
};`;

    content = content.replace(buttonRegexSimple, stdButtonSimple);

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed buttons in', filePath);
    }
});
