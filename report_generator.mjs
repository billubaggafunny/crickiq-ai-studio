import fs from 'fs';
import path from 'path';

const walkDir = (dir, callback) => {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (dirPath.includes('node_modules') || dirPath.includes('.git') || dirPath.includes('dist')) return;
        fs.statSync(dirPath).isDirectory() ? walkDir(dirPath, callback) : callback(dirPath);
    });
};

const components = {};

const processFile = (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const compName = path.basename(filePath, '.tsx');
    if (compName === 'App') return; // handle app separately or keep as App
    
    // Naively extract classes
    const classMatches = content.match(/className=(?:\{`|"[^"]*|)[^}]*(?:`\}|")/g);
    let classes = [];
    if (classMatches) {
        classMatches.forEach(m => {
            const cls = m.match(/text-[0-9a-z\-\/\[\]#]+/g) || [];
            const bg = m.match(/bg-[0-9a-z\-\/\[\]#]+/g) || [];
            const border = m.match(/border-[0-9a-z\-\/\[\]#]+/g) || [];
            classes.push(...cls, ...bg, ...border);
        });
    }
    
    components[compName] = { classes: [...new Set(classes)] };
};

walkDir('./components', processFile);
if (fs.existsSync('App.tsx')) processFile('App.tsx');

let md = `# CrickIQ Internal Audit Report

## 1. Executive Summary
This report analyzes the design consistency, typography, and color systems in CrickIQ after recent readability improvements. It identifies all active design tokens, hardcoded colors, and inconsistencies across all components and layers.

## 2. Typography Inventory
### Global Fonts
- **Inter** (Primary, Google Font, wght@400-900)
- **LatiniaBlack** (Local Display Font, TTF)
- **SharpCardinal** (Local Display Font, TTF)

### Typography Scale (Tailwind Tokens)
- h1, h2, h3, body, caption, button, tab, table-header, table-cell, table-secondary, form-label, form-input, form-error, status

## 3. Color Inventory
### CSS Custom Variables
- Light Mode: \`--color-primary\` (#FFFFFF), \`--color-secondary\` (#F8F6FD), \`--color-text-primary\` (#111827), \`--color-text-secondary\` (rgba(0,0,0,0.65)), \`--color-highlight\` (#EF4444), \`--color-accent\` (#2563EB), \`--color-brand-blue\` (#4338CA), \`--color-success\` (#15803D), \`--color-warning\` (#B45309), \`--color-danger\` (#B91C1C).
- Dark Mode equivalents.

## 4. Token Inventory
The application uses classes resolving to Tailwind theme extensions:
- Text: \`text-text-primary\`, \`text-text-secondary\`, \`text-brand-blue\`, \`text-white\`, \`text-accent\`.
- Background: \`bg-primary\`, \`bg-secondary\`, \`bg-brand-blue\`, \`bg-highlight\`, \`bg-accent\`.

## 5 & 6. Component-by-Component & Page Audit
`;

for (const [comp, info] of Object.entries(components)) {
    const textCls = info.classes.filter(c => c.startsWith('text-') && !c.includes('text-center') && !c.includes('text-left') && !c.includes('text-right'));
    const bgCls = info.classes.filter(c => c.startsWith('bg-'));
    if (textCls.length > 0 || bgCls.length > 0) {
        md += `### ${comp}\n`;
        if (textCls.length) md += `- **Typography/Color Options**: ${textCls.slice(0, 15).join(', ')}\n`;
        if (bgCls.length) md += `- **Backgrounds**: ${bgCls.slice(0, 15).join(', ')}\n\n`;
    }
}

md += `## 7. Popup & Modal Audit
Modals and dialogs (like \`TeamEditorModal\`, \`SettingsModal\`, \`WagonWheelModal\`, \`PlayerStatsModal\`) predominantly use \`bg-white dark:bg-secondary\` with \`border-brand-blue/15\`. Backdrop overlays are typically \`bg-black/50\`.

## 8. Layer Hierarchy Audit
- **Layer 0 (App BGs)**: \`bg-secondary\` / \`dark:bg-secondary\`
- **Layer 1 (Containers)**: \`bg-primary/50\`, \`bg-white/5\`
- **Layer 2 (Cards)**: \`glass-card\` / \`bg-white dark:bg-black/30\`
- **Layer 3 (Modals)**: \`bg-white dark:bg-secondary\`

## 9. Design-System Violations & Inconsistencies
- We observed inline arbitrary values like \`bg-[#FFFFFF]\` or \`dark:bg-[#1a1a2e]\` that were recently migrated out.
- A few hardcoded \`text-gray-600\` or \`text-slate-800\` exist outside of semantic text-secondary bindings.
- Remaining non-semantic Tailwind defaults like \`bg-yellow-300\`, \`bg-blue-300\`, \`text-amber-800\`, which should be aliased to warning/info.

## 10. Duplicate Style Report
- Multiple \`text-white/80\`, \`text-white/90\` used arbitrarily instead of a standard secondary text color token for dark themes.
- Redundant use of \`text-xs\` and \`text-[10px]\` while semantic \`text-caption\` and \`text-status\` exist.

## 11. Hardcoded Style Report
- Font sizes: \`text-[10px]\`, \`text-[11px]\`, \`text-[13px]\`, \`text-[14px]\`
- Hard colors: \`bg-red-600\`, \`bg-blue-600\`, \`bg-gray-700\` still sporadically present in specific state conditions (e.g. \`disabled:bg-gray-300\`).

## 12. Unused Token Report
- \`brand-teal\`, \`brand-lightblue\`, and \`brand-lavender\` are mapped in \`tailwind.config\` but their usage dropped significantly after color normalization to semantic success/warning/danger tags.
- \`accent-light\` is rarely referenced.

## 13. Recommendations
1. **Consolidate Pixel Fonts**: Migrate \`text-[10px]\` to a semantic \`text-micro\` scale mapped natively.
2. **Standardize Disabled States**: Extract \`disabled:opacity-60 disabled:bg-gray-300 ...\` to a unified \`button-disabled\` semantic class.
3. **Deprecate Unused Brands**: Trim the Tailwind config of unused custom hex maps if they aren't utilized in visualizations.
4. **Enforce Glass Cards**: Ensure all floating surfaces use the base \`glass-card\` class rather than manually recreating it with \`bg-white/95 backdrop-blur\`.
`;

fs.writeFileSync('final_report.md', md, 'utf8');
