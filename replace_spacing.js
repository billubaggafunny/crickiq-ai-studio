import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (dirPath === 'node_modules' || dirPath === '.git' || dirPath === 'dist') return;
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const MAP = {
    '3': '4',
    '5': '6',
    '7': '8',
    '9': '10',
    '11': '12',
    '14': '16'
};

let modified = 0;

walkDir('.', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && filePath !== 'index.html') return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    for (const [bad, good] of Object.entries(MAP)) {
        const prefixes = ['p', 'm', 'gap', 'pt', 'pb', 'pl', 'pr', 'mt', 'mb', 'ml', 'mr', 'px', 'py', 'mx', 'my', 'space-x', 'space-y'];
        const negPrefixes = ['-m', '-mt', '-mb', '-ml', '-mr', '-mx', '-my', '-space-x', '-space-y'];
        
        for (const prefix of prefixes) {
            const regex = new RegExp(`(?<=\\s|['"\`])${prefix}-${bad}(?=\\s|['"\`])`, 'g');
            newContent = newContent.replace(regex, `${prefix}-${good}`);
            const regexResp = new RegExp(`(?<=\\s|['"\`])([a-z]+:)${prefix}-${bad}(?=\\s|['"\`])`, 'g');
            newContent = newContent.replace(regexResp, `$1${prefix}-${good}`);
        }
        for (const prefix of negPrefixes) {
            const regex = new RegExp(`(?<=\\s|['"\`])${prefix}-${bad}(?=\\s|['"\`])`, 'g');
            newContent = newContent.replace(regex, `${prefix}-${good}`);
            const regexResp = new RegExp(`(?<=\\s|['"\`])([a-z]+:)${prefix}-${bad}(?=\\s|['"\`])`, 'g');
            newContent = newContent.replace(regexResp, `$1${prefix}-${good}`);
        }
    }
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Modified', filePath);
        modified++;
    }
});

console.log('Total modified:', modified);
