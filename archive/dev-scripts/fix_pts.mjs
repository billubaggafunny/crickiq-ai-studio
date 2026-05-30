import fs from 'fs';
let c = fs.readFileSync('components/PointsTable.tsx', 'utf8');
c = c.replace(/className="border-b border-brand-blue\/15 last:border-b-0 hover:bg-white dark:hover:bg-black\/20 transition-colors duration-200"/g, '');
c = c.replace(/className="border-b border-brand-blue\/15"/g, '');
fs.writeFileSync('components/PointsTable.tsx', c, 'utf8');
