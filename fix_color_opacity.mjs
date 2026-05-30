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
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/text-([a-z]+)-([0-9]{3})\/90/g, 'text-$1-$2');
    content = content.replace(/text-([a-z]+)-([0-9]{3})\/80/g, 'text-$1-$2');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
