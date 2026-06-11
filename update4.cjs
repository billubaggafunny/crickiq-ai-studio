const fs = require('fs');

let content = fs.readFileSync('components/UpcomingMatchWidget.tsx', 'utf-8');

// remove let badgeColor = 'bg-gray-100...';
content = content.replace(/let badgeColor = '.*?';\n\s*/g, '');
content = content.replace(/badgeColor = '.*?';\n\s*/g, '');

fs.writeFileSync('components/UpcomingMatchWidget.tsx', content);
