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

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Specifically target occurrences found in Drawer.tsx
    content = content.replace(/text-text-secondary opacity-30/g, 'text-text-secondary');
    content = content.replace(/text-text-secondary opacity-[5678]0/g, 'text-text-secondary');
    content = content.replace(/ opacity-50 font-normal/g, ' font-normal text-text-secondary');
    content = content.replace(/ opacity-[567]0 text-center/g, ' text-center');
    content = content.replace(/ opacity-60 pointer-events-none/g, ' pointer-events-none');
    content = content.replace(/ text-center opacity-70/g, ' text-center');
    content = content.replace(/ cursor-not-allowed opacity-[67]0/g, ' cursor-not-allowed text-text-secondary');
    content = content.replace(/ disabled:opacity-50/g, ' disabled:opacity-60 disabled:bg-gray-300 disabled:text-gray-600 disabled:dark:bg-gray-700 disabled:dark:text-gray-400');
    content = content.replace(/ opacity-80 mb-4/g, ' mb-4');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed opacity in', filePath);
    }
}

walkDir('./components', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    fixFile(filePath);
});
fixFile('App.tsx');
