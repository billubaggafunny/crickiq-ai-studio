import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('./components', function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content.replace(/text-text-secondary\/[0-9]+/g, 'text-text-secondary');
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated ${filePath}`);
        }
    }
});
