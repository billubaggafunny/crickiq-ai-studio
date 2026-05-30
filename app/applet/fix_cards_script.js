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

    // Remove local Card definitions
    const cardDefRegex1 = /const Card:\s*React\.FC<\{[\s\S]*?className\?: string;?\s*\}?\s*&\s*React\.HTMLAttributes<HTMLDivElement>>\s*=\s*\(\{\s*children,\s*className,\s*\.\.\.rest\s*\}\)\s*=>\s*\([\s\S]*?\);\n/g;
    const cardDefRegex2 = /const Card:\s*React\.FC<\{[\s\S]*?className\?: string\s*\}>\s*=\s*\(\{\s*children,\s*className,\s*\}\)\s*=>\s*\([\s\S]*?\);\n/g;
    const cardDefRegex3 = /\/\/\s*FIX:[^\n]*\nconst Card:\s*React\.FC<\{ children: React\.ReactNode; className\?: string \} & React\.HTMLAttributes<HTMLDivElement>> = \(\{ children, className, \.\.\.rest \}\) => \(\n\s*<div \{\.\.\.rest\} className=\{\`glass-card[^`]*\`\}>\{children\}<\/div>\n\);\n/g;
    const cardDefRegex4 = /const Card: React\.FC<\{ children: React\.ReactNode; className\?: string \} & React\.HTMLAttributes<HTMLDivElement>> = \(\{ children, className, \.\.\.rest \}\) => \(\n\s*<div \{\.\.\.rest\} className=\{\`glass-card[^`]*\`\}>\{children\}<\/div>\n\);\n/g;

    content = content.replace(cardDefRegex1, '');
    content = content.replace(cardDefRegex2, '');
    content = content.replace(cardDefRegex3, '');
    content = content.replace(cardDefRegex4, '');
    content = content.replace(/const Card: React\.FC<\s*\{\s*children: React\.ReactNode;\s*className\?: string;\s*\}\s*&\s*React\.HTMLAttributes<HTMLDivElement>\s*> = \(\{ children, className, \.\.\.rest \}\) => \(\s*<div \{\.\.\.rest\} className=\{`glass-card[^`]*`\}>\{children\}<\/div>\s*\);\n/g, '');

    // Add import for CrickIQCard if not present and if Card (now CrickIQCard) was used
    if (original.match(/<Card\b/) && content !== original) {
        if (!content.includes("import CrickIQCard")) {
            content = "import CrickIQCard from './CrickIQCard';\n" + content;
        }
    }

    // Replace <Card> with <CrickIQCard>
    content = content.replace(/<Card\b/g, '<CrickIQCard');
    content = content.replace(/<\/Card>/g, '</CrickIQCard>');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed cards in', filePath);
    }
});
