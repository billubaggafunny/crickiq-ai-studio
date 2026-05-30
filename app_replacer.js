import fs from 'fs';
import path from 'path';

function fixApp() {
    let appCode = fs.readFileSync('App.tsx', 'utf8');

    // Remove the old mobile header
    appCode = appCode.replace(/\{\/\* Mobile Header \*\/\}\s*\{activeTab !== 'live'[^<]*<header className="md:hidden[\s\S]*?<\/header>\s*\}/, '');

    // Add generic title function
    const getScreenTitle = `
    const getScreenTitle = () => {
        if (selectedTournamentId) {
            const t = tournamentState.tournaments.find(t => t.id === selectedTournamentId);
            return t ? t.name : "Tournament";
        }
        if (activeTab === 'tournament') return "Home";
        if (activeTab === 'matches') return "Tournaments";
        if (activeTab === 'analytics') return "Analytics Workspace";
        if (activeTab === 'live') {
            return selectedMatch?.status === 'completed' ? "Match Result" : "Live Match";
        }
        return "CrickIQ";
    };
    `;
    if (!appCode.includes('getScreenTitle')) {
        appCode = appCode.replace(/const renderContent = \(\) => {/, getScreenTitle + '\n    const renderContent = () => {');
    }

    // Add Header import
    if (!appCode.includes(`import Header from './components/Header';`)) {
        appCode = appCode.replace(/import Drawer from '\.\/components\/Drawer';/, `import Drawer from './components/Drawer';\nimport Header from './components/Header';`);
    }

    // Insert Header inside flex-col
    const headerStr = `
                    <Header 
                        title={getScreenTitle()}
                        showMenu={true}
                        onMenuClick={() => setIsDrawerOpen(true)}
                        showSettings={true}
                        onSettingsClick={() => setIsSettingsOpen(true)}
                        showLogout={true}
                        onLogoutClick={handleLogout}
                    />
                    <main className="container mx-auto px-4 pb-24 md:pb-4 flex-grow overflow-y-auto no-scrollbar min-h-0">
    `;
    appCode = appCode.replace(/<main className="container mx-auto px-4 pb-24 md:pb-4 flex-grow overflow-y-auto no-scrollbar min-h-0">/, headerStr);

    fs.writeFileSync('App.tsx', appCode);
}
fixApp();
