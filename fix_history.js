import fs from 'fs';
import path from 'path';

function fixScoreCards(filePath) {
    if (!filePath.endsWith('QuickMatchHistory.tsx') && !filePath.endsWith('MatchManager.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    if (filePath.endsWith('QuickMatchHistory.tsx')) {
        newContent = newContent.replace(/className="flex justify-between items-center text-caption text-white\/80 mb-4"/g, 'className="flex justify-between items-center text-caption text-white/80 mb-2"');
        newContent = newContent.replace(/<p className="text-xs text-center text-white\/80 mb-2">/g, '<p className="text-caption text-center text-white/80 mb-1">');
        newContent = newContent.replace(/<div className="space-y-2">/g, '<div className="space-y-1">');
        newContent = newContent.replace(/<div className="mt-4 text-center text-body/g, '<div className="mt-2 text-center text-body');
        // also remove `p-2` around team scores to `py-1.5 px-2` 
        newContent = newContent.replace(/p-2 rounded-lg/g, 'py-1.5 px-2 rounded-lg');
    }

    if (filePath.endsWith('MatchManager.tsx')) {
        // Similar to above but for MatchManager rendering completed matches
        newContent = newContent.replace(/<div className="space-y-2">/g, '<div className="space-y-1">');
        newContent = newContent.replace(/p-2 rounded-lg/g, 'py-1.5 px-2 rounded-lg');
    }

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed scorecard histories in', filePath);
    }
}

fixScoreCards('components/QuickMatchHistory.tsx');
fixScoreCards('components/MatchManager.tsx');

