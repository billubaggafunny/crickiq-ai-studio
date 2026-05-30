import fs from 'fs';

let f = 'components/Statistics.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/const Card[\s\S]*?<\/div>[\s\S]*?\);\n/g, '');
if(!c.includes("import CrickIQCard")) c = "import CrickIQCard from './CrickIQCard';\n" + c;
fs.writeFileSync(f, c);

f = 'components/TournamentStats.tsx';
c = fs.readFileSync(f, 'utf8');
c = c.replace(/const Card[\s\S]*?<\/div>[\s\S]*?\);\n/g, '');
if(!c.includes("import CrickIQCard")) c = "import CrickIQCard from './CrickIQCard';\n" + c;
fs.writeFileSync(f, c);

f = 'components/AnalyticsOverview.tsx';
c = fs.readFileSync(f, 'utf8');
c = c.replace(/const Card[\s\S]*?<\/div>[\s\S]*?\);\n/g, '');
if(!c.includes("import CrickIQCard")) c = "import CrickIQCard from './CrickIQCard';\n" + c;
fs.writeFileSync(f, c);
