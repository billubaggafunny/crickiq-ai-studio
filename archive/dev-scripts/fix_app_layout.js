import fs from 'fs';
import path from 'path';

function fixAppLayout() {
    let appCode = fs.readFileSync('App.tsx', 'utf8');

    // 1. Move Header above flex-row layout
    // Find the wrapper and aside
    // We already inserted `<Header ... />` and `<main ...` in a previous script!
    // Let's remove the <Header ... /> from `flex-1 flex flex-col overflow-hidden` and put it above the parent.
    appCode = appCode.replace(/<div className=\{\`h-screen flex flex-col md:flex-row font-sans \$\{currentThemeClass\} safe-pad-b safe-pad-l safe-pad-r\`\}>/, 
        `<div className={\`h-screen flex flex-col font-sans \$\{currentThemeClass\} safe-pad-b safe-pad-l safe-pad-r\`}>`);
    
    const headerCode = `
                    <Header 
                        title={getScreenTitle()}
                        showMenu={true}
                        onMenuClick={() => setIsDrawerOpen(true)}
                        showSettings={true}
                        onSettingsClick={() => setIsSettingsOpen(true)}
                        showLogout={true}
                        onLogoutClick={handleLogout}
                    />
`;

    // 2. Remove old header from inside flex-1 ... overflow-hidden
    appCode = appCode.replace(/<Header[\s\S]*?onLogoutClick=\{handleLogout\}\n\s*\/>\n/, '');

    // 3. Put Header right inside the parent div 
    appCode = appCode.replace(/\{\/\* Desktop Sidebar \*\/\}/, headerCode + '\n                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">\n                    {/* Desktop Sidebar */}');

    // 4. Remove Logo header from aside
    appCode = appCode.replace(/<div className="flex items-center gap-4 pt-2 pl-2">[\s\S]*?<\/div>/, '');

    // 5. Remove Settings / Logout from aside
    appCode = appCode.replace(/<div className="space-y-2">\s*<button onClick=\{\(\) => setIsSettingsOpen\(true\)\}[\s\S]*?<\/div>\s*<\/aside>/, '</aside>');

    // 6. Close the new flex-1 div after footer
    appCode = appCode.replace(/(<\/footer>\s*<\/div>\s*<\/div>\s*<\/NotificationProvider>)/, '</footer>\n                    </div>\n                </div>\n        </NotificationProvider>');

    fs.writeFileSync('App.tsx', appCode);
}

fixAppLayout();
