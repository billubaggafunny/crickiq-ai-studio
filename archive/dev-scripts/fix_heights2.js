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

walkDir('.', function(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    // Further Card Optimization
    // Match card internal paddings (often have `p-4` or similar, reducing empty spacing)
    // Reduce top-level `space-y-6` under headers or specific cases to `space-y-4`
    
    if (filePath.includes('QuickMatchSetup.tsx') || filePath.includes('ScheduleGenerator.tsx') || filePath.includes('SettingsModal.tsx')) {
        newContent = newContent.replace(/className="space-y-6"/g, 'className="space-y-4"');
    }
    
    // Reduce "mb-6" and "mb-8" to "mb-4". They correspond to 24px and 32px respectively, replacing with 16px.
    newContent = newContent.replace(/\bmb-[68]\b/g, 'mb-4');
    
    // Settings modal large paddings
    if (filePath.includes('SettingsModal.tsx')) {
        newContent = newContent.replace(/p-4\s+rounded-lg/g, 'p-3 rounded-lg');
    }
    
    // Tournament Card metadata row spacing `gap-2` could be `gap-1` potentially, but let's just make sure inner spacing is nice.
    
    // MatchManager Tabs - already done earlier.
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed additional heights in', filePath);
    }
});
