const fs = require('fs');
let content = fs.readFileSync('components/MatchScorecard.tsx', 'utf8');

// Add import Header
if (!content.includes('import Header')) {
    content = content.replace(
        "import { useNotification } from '../hooks/useNotification';",
        "import { useNotification } from '../hooks/useNotification';\nimport Header from './Header';"
    );
}

// Ensure the render component has defensive protections.
const matchCheck = "    if (!match || !team1 || !team2) return (<div className=\"p-4 text-center text-text-secondary\">Match data could not be loaded. Please try again.</div>);";
if (content.includes("    if (!team1 || !team2) return null;")) {
    content = content.replace("    if (!team1 || !team2) return null;", matchCheck);
}

fs.writeFileSync('components/MatchScorecard.tsx', content, 'utf8');
console.log("Fixed MatchScorecard.tsx.");
