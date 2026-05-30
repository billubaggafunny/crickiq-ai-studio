import fs from 'fs';
const filePath = 'components/Drawer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

let startIndex = 0;
while (true) {
    const divIdx = content.indexOf('<div', startIndex);
    if (divIdx === -1) break;
    
    const endOfOpenTag = content.indexOf('>', divIdx);
    const tag = content.substring(divIdx, endOfOpenTag + 1);
    
    if (tag.includes('glass-card') || tag.includes('p-6') && tag.includes('shadow-sm') && !tag.includes('glass-card')) {
        // Find matching </div>
        let stack = 1;
        let scanIdx = endOfOpenTag + 1;
        
        while (stack > 0 && scanIdx < content.length) {
            const nextOpen = content.indexOf('<div', scanIdx);
            const nextClose = content.indexOf('</div', scanIdx);
            
            if (nextClose === -1) break;
            
            if (nextOpen !== -1 && nextOpen < nextClose) {
                stack++;
                scanIdx = nextOpen + 4;
            } else {
                stack--;
                scanIdx = nextClose + 6; // '</div>'.length == 6
                if (stack === 0) {
                    // Match found!
                    // Replace <div ...> with <CrickIQCard ...> and </div> with </CrickIQCard>
                    const matchingCloseIdx = nextClose;
                    let newTag = tag.replace('<div', '<CrickIQCard');
                    newTag = newTag.replace(/glass-card\s*/g, '');
                    newTag = newTag.replace(/bg-brand-gradient\s*text-white\s*/g, '');
                    newTag = newTag.replace(/px-6\s*py-4\s*/g, '');
                    newTag = newTag.replace(/shadow-sm\s*/g, '');
                    newTag = newTag.replace(/border-0\s*/g, '');
                    newTag = newTag.replace(/\s*className="\s*"/, '');
                    
                    content = content.substring(0, divIdx) + newTag + content.substring(endOfOpenTag + 1, matchingCloseIdx) + '</CrickIQCard>' + content.substring(matchingCloseIdx + 6);
                    
                    startIndex = divIdx + newTag.length; // move past the opening tag
                    break;
                }
            }
        }
        if (stack !== 0) {
            startIndex = endOfOpenTag + 1;
        }
    } else {
        startIndex = endOfOpenTag + 1;
    }
}

if (!content.includes('import CrickIQCard')) {
    content = "import CrickIQCard from './CrickIQCard';\n" + content;
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Processed Drawer.tsx');
