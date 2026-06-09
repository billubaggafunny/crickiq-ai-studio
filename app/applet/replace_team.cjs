const fs = require("fs");

let content = fs.readFileSync("components/TeamDetailsHub.tsx", "utf-8");

// text-gray-400 (if it's not a dark mode override like dark:text-gray-400)
// Actually we can just do word replacements, but respect dark mode:
// e.g. text-gray-400 -> text-text-secondary
content = content.replace(/\btext-gray-400\b/g, "text-text-secondary");

// bg-gray-100 -> bg-tertiary
// Actually, `bg-gray-100 dark:bg-white/5` 
content = content.replace(/\bbg-gray-100\b/g, "bg-tertiary");

// text-gray-600 -> text-text-secondary
content = content.replace(/\btext-gray-600\b/g, "text-text-secondary");

// text-gray-[987]00
content = content.replace(/\btext-gray-[98]00\b/g, "text-text-primary");
content = content.replace(/\btext-gray-700\b/g, "text-text-secondary");

// bg-white dark:bg-slate-900 -> bg-secondary
// wait, `bg-white dark:bg-slate-900`
content = content.replace(/\bbg-white dark:bg-slate-900\b/g, "bg-secondary");

// bg-gray-400 -> bg-tertiary
// Not sure what this is used for, let me inspect before using this replace.
fs.writeFileSync("components/TeamDetailsHub.tsx", content);
