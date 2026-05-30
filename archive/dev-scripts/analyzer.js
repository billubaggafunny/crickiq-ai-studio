const fs = require('fs');
const path = require('path');

const walkDir = (dir, callback) => {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (dirPath.includes('node_modules') || dirPath.includes('.git') || dirPath.includes('dist')) return;
        fs.statSync(dirPath).isDirectory() ? walkDir(dirPath, callback) : callback(dirPath);
    });
};

const typography = {};
const colors = {};

const textColors = {};
const bgColors = {};
const borderColors = {};

const processFile = (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    
    const fontMatches = content.match(/text-(h1|h2|h3|body|caption|button|tab|table-header|table-cell|table-secondary|form-label|form-input|form-error|status|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\[.*?\])/g);
    if (fontMatches) fontMatches.forEach(f => typography[f] = (typography[f] || 0) + 1);

    const textColorMatches = content.match(/text-((?!h1|h2|h3|body|caption|button|tab|table|form|status|xs|sm|base|lg|xl|2xl|3xl)[a-z0-9\-]+(\/[0-9]+)?)/g);
    if (textColorMatches) textColorMatches.forEach(c => textColors[c] = (textColors[c] || 0) + 1);

    const bgColorMatches = content.match(/bg-([a-z0-9\-]+(\/[0-9]+)?)/g);
    if (bgColorMatches) bgColorMatches.forEach(c => bgColors[c] = (bgColors[c] || 0) + 1);

    const borderColorMatches = content.match(/border-([a-z0-9\-]+(\/[0-9]+)?)/g);
    if (borderColorMatches) borderColorMatches.forEach(c => borderColors[c] = (borderColors[c] || 0) + 1);
};

walkDir('./components', processFile);
if (fs.existsSync('App.tsx')) processFile('App.tsx');

console.log("=== TYPOGRAPHY ===");
Object.entries(typography).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`${k}: ${v}`));

console.log("\n=== TEXT COLORS ===");
Object.entries(textColors).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`${k}: ${v}`));

console.log("\n=== BG COLORS ===");
Object.entries(bgColors).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`${k}: ${v}`));

console.log("\n=== BORDER COLORS ===");
Object.entries(borderColors).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`${k}: ${v}`));
