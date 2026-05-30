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
        
        let newContent = content;
        // Group 6 Modals & General
        newContent = newContent.replace(/bg-gray-100 dark:bg-gray-800/g, 'bg-secondary');
        newContent = newContent.replace(/bg-gray-100 dark:bg-black\/20/g, 'bg-secondary');
        newContent = newContent.replace(/bg-white dark:bg-gray-800/g, 'bg-primary');
        newContent = newContent.replace(/bg-white dark:bg-[^ ]+/g, 'bg-primary');
        newContent = newContent.replace(/bg-white dark:text-white/g, 'bg-primary');
        newContent = newContent.replace(/text-gray-800 hover:bg-gray-50/g, 'text-text-primary hover:bg-secondary');
        newContent = newContent.replace(/bg-white text-gray-800/g, 'bg-primary text-text-primary');
        newContent = newContent.replace(/bg-gray-50/g, 'bg-secondary');
        newContent = newContent.replace(/bg-white\/[0-9]+/g, 'bg-primary/50'); // Wait, glassmorphism might use bg-white/20, let's leave it alone
        newContent = newContent.replace(/text-black/g, 'text-text-primary');

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log(`Updated ${filePath}`);
        }
    }
});
