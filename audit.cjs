const fs = require('fs');
const path = require('path');

const componentsDir = path.join(process.cwd(), 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

const counts = { bgWhite: 0, textGray: 0, bgGray: 0, borderGray: 0, bgPrimary: 0, bgSecondary: 0, textPrimary: 0, textSecondary: 0 };
const fileData = {};

files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const bgWhite = (content.match(/bg-white/g) || []).length;
    const textGray = (content.match(/text-gray-\d+/g) || []).length;
    const bgGray = (content.match(/bg-gray-\d+/g) || []).length;
    const borderGray = (content.match(/border-gray-\d+/g) || []).length;
    const bgPrimary = (content.match(/bg-primary/g) || []).length;
    const bgSecondary = (content.match(/bg-secondary/g) || []).length;
    const textPrimary = (content.match(/text-text-primary/g) || []).length;
    const textSecondary = (content.match(/text-text-secondary/g) || []).length;

    counts.bgWhite += bgWhite;
    counts.textGray += textGray;
    counts.bgGray += bgGray;
    counts.borderGray += borderGray;
    counts.bgPrimary += bgPrimary;
    counts.bgSecondary += bgSecondary;
    counts.textPrimary += textPrimary;
    counts.textSecondary += textSecondary;

    if (bgWhite > 0 || textGray > 0 || bgGray > 0 || borderGray > 0) {
        fileData[file] = { bgWhite, textGray, bgGray, borderGray };
    }
});

console.log(JSON.stringify({ counts, fileData }, null, 2));
