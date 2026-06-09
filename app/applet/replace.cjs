const fs = require("fs");

function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, "utf-8");

    // hover:bg-gray-*
    content = content.replace(/hover:bg-gray-200\/50/g, "hover:bg-black/5 dark:hover:bg-white/5");
    content = content.replace(/hover:bg-gray-200/g, "hover:bg-black/5 dark:hover:bg-white/5");
    content = content.replace(/hover:bg-gray-100/g, "hover:bg-black/5 dark:hover:bg-white/5");
    content = content.replace(/hover:bg-gray-50/g, "hover:bg-black/5 dark:hover:bg-white/5");

    // bg-gray-* -> bg-tertiary
    content = content.replace(/bg-gray-200/g, "bg-tertiary");
    content = content.replace(/bg-gray-100/g, "bg-tertiary");
    content = content.replace(/bg-gray-50/g, "bg-tertiary");

    // border-gray-* -> border-border
    content = content.replace(/border-gray-100/g, "border-border");
    content = content.replace(/border-gray-200/g, "border-border");
    content = content.replace(/border-gray-300/g, "border-border");

    // text-gray-*
    content = content.replace(/text-gray-900/g, "text-text-primary");
    content = content.replace(/text-gray-800/g, "text-text-primary");
    content = content.replace(/text-gray-700/g, "text-text-secondary");
    content = content.replace(/text-gray-600/g, "text-text-secondary");
    content = content.replace(/text-gray-500/g, "text-text-secondary");
    content = content.replace(/text-gray-400/g, "text-text-secondary");

    // bg-white -> bg-secondary
    // Wait: for `MatchDetailsHub.tsx` we might want `bg-secondary` globally for `bg-white` 
    // EXCEPT inside CrickIQCard where it's redundant.
    content = content.replace(/CrickIQCard className="([^"]*) bg-white/g, "CrickIQCard className=\"$1 bg-secondary");
    content = content.replace(/\bbg-white\b/g, "bg-secondary");

    // Special cases
    // Hub background uses bg-primary
    content = content.replace(/\bbg-body-bg\b/g, "bg-primary");

    fs.writeFileSync(filePath, content);
}

migrateFile("components/MatchDetailsHub.tsx");
migrateFile("components/TeamDetailsHub.tsx");
