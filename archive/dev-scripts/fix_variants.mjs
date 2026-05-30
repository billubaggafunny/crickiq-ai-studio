import fs from 'fs';

let content = fs.readFileSync('components/MatchManager.tsx', 'utf8');
content = content.replace(/variant="blue"/g, 'variant="primary"');
fs.writeFileSync('components/MatchManager.tsx', content, 'utf8');

content = fs.readFileSync('components/TournamentList.tsx', 'utf8');
content = content.replace(/variant="blue"/g, 'variant="primary"');
fs.writeFileSync('components/TournamentList.tsx', content, 'utf8');

content = fs.readFileSync('components/TeamEditorModal.tsx', 'utf8');
content = content.replace(/variant="blue"/g, 'variant="primary"');
fs.writeFileSync('components/TeamEditorModal.tsx', content, 'utf8');

content = fs.readFileSync('components/TournamentManager.tsx', 'utf8');
content = content.replace(/variant="blue"/g, 'variant="primary"');
fs.writeFileSync('components/TournamentManager.tsx', content, 'utf8');

