import fs from 'fs';
import path from 'path';

export function replaceHeaders() {
    // 1. Home.tsx
    let homeCode = fs.readFileSync('components/Home.tsx', 'utf8');
    homeCode = homeCode.replace(/<header className="mb-4">[\s\S]*?<\/header>/, '');
    homeCode = homeCode.replace(/import { GoogleIcon } from '\.\.\/constants';/, "import { GoogleIcon } from '../constants';\nimport Header from './Header';");
    homeCode = homeCode.replace(/<div className="max-w-md w-full glass-card px-6 py-4">/, '<Header title="Sign In" />\n                <div className="max-w-md w-full glass-card px-6 py-4 mt-8">');
    fs.writeFileSync('components/Home.tsx', homeCode);

    // 2. SettingsModal.tsx
    let settingsCode = fs.readFileSync('components/SettingsModal.tsx', 'utf8');
    settingsCode = settingsCode.replace(/<div className="flex justify-between items-center mb-4 flex-shrink-0">[\s\S]*?<\/div>/, '<Header title={view === "main" ? "Settings" : view === "howToUse" ? "How to Use CrickIQ" : "Data Management"} showClose onCloseClick={onClose} />');
    // Also remove the `p-3 rounded-lg` or whatever was added earlier? No, the modal padding.
    // The `<Card className="... p-6 ...">` inside SettingsModal? 
    settingsCode = settingsCode.replace(/import React, { useState, useEffect } from 'react';/, "import React, { useState, useEffect } from 'react';\nimport Header from './Header';");
    fs.writeFileSync('components/SettingsModal.tsx', settingsCode);

    // 3. MatchScorecard.tsx
    let scorecardCode = fs.readFileSync('components/MatchScorecard.tsx', 'utf8');
    scorecardCode = scorecardCode.replace(/<div className="flex items-center justify-between p-4.*bg-brand-gradient.*">[\s\S]*?<\/div>/, `<Header title="Match Scorecard" showBack onBackClick={onClose} actionButton={<button onClick={handleShareScorecard} className="w-11 h-11 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors" title="Share"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg></button>} />`);
    scorecardCode = scorecardCode.replace(/import React, { useState } from 'react';/, "import React, { useState } from 'react';\nimport Header from './Header';");
    fs.writeFileSync('components/MatchScorecard.tsx', scorecardCode);

    // 4. QuickMatchSetup.tsx
    let qmCode = fs.readFileSync('components/QuickMatchSetup.tsx', 'utf8');
    qmCode = qmCode.replace(/<h2 className="text-h1 text-text-primary">Quick Match Setup<\/h2>/, '<Header title="Quick Match Setup" />');
    qmCode = qmCode.replace(/import React, { useState, useMemo } from 'react';/, "import React, { useState, useMemo } from 'react';\nimport Header from './Header';");
    fs.writeFileSync('components/QuickMatchSetup.tsx', qmCode);
}
replaceHeaders();
