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
    if (!filePath.endsWith('.tsx') || filePath.endsWith('CrickIQTable.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    if (!original.includes('<table')) return;

    // We'll replace <table with <Table, </thead> with </Thead>, etc.
    // Wait, first we need to handle the import.
    if (!content.includes('import { Table, Thead, Tbody, Tr, Th, Td } from \'./CrickIQTable\'')) {
        content = "import { Table, Thead, Tbody, Tr, Th, Td } from './CrickIQTable';\n" + content;
    }

    // Now string replacements for Table tags. We must be very careful with casing, we only replace exactly `<table`, `</table>`, etc.
    
    // For <table
    // Also remove any surrounding <div className="overflow-x-auto"> since CrickIQTable has that builtin.
    content = content.replace(/<div className="overflow-x-auto[^>]*>\s*<table/g, '<table');
    content = content.replace(/<\/table>\s*<\/div>/g, '</table>');
    
    content = content.replace(/<table/g, '<Table');
    content = content.replace(/<\/table>/g, '</Table>');
    
    content = content.replace(/<thead/g, '<Thead');
    content = content.replace(/<\/thead>/g, '</Thead>');
    
    content = content.replace(/<tbody/g, '<Tbody');
    content = content.replace(/<\/tbody>/g, '</Tbody>');
    
    content = content.replace(/<tr/g, '<Tr');
    content = content.replace(/<\/tr>/g, '</Tr>');
    
    content = content.replace(/<th/g, '<Th');
    content = content.replace(/<\/th>/g, '</Th>');
    
    content = content.replace(/<td/g, '<Td');
    content = content.replace(/<\/td>/g, '</Td>');
    
    // Also remove generic utility classes that the primitive already enforces, such as p-2, p-3, px-4, py-2, font-semibold, text-text-primary, whitespace-nowrap, w-full, etc. from Table, Th, and Td tags to let the defaults through, BUT leave text-right, text-left, text-center, font-bold, text-accent.
    
    const tagClassRegex = /<(Table|Thead|Tbody|Tr|Th|Td)\b([^>]*)className="([^"]+)"([^>]*)>/g;
    
    content = content.replace(tagClassRegex, (match, tag, beforeClass, className, afterClass) => {
        let newClasses = className
             .replace(/\bw-full\b/g, '')
             .replace(/\btext-left\b/g, '')
             .replace(/\btext-body\b/g, '')
             .replace(/\bwhitespace-nowrap\b/g, '')
             .replace(/\btext-caption\b/g, '')
             .replace(/\buppercase\b/g, '') // optionally keep
             .replace(/\btext-text-secondary\b/g, '')
             .replace(/\btext-text-primary\b/g, '')
             .replace(/\bdivide-y\b/g, '')
             .replace(/\bdivide-border-color\b/g, '')
             .replace(/\bp-2\b/g, '')
             .replace(/\bp-3\b/g, '')
             .replace(/\bp-4\b/g, '')
             .replace(/\bpx-4\b/g, '')
             .replace(/\bpy-2\b/g, '')
             .replace(/\bpy-3\b/g, '')
             .replace(/\bpy-4\b/g, '')
             .replace(/\btext-table-header\b/g, '')
             .replace(/\s+/g, ' ')
             .trim();
        
        if (newClasses) {
             return `<${tag}${beforeClass}className="${newClasses}"${afterClass}>`;
        } else {
             return `<${tag}${beforeClass}${afterClass}>`;
        }
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed tables in', filePath);
    }
});
