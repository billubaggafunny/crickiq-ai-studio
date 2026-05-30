import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/--color-secondary: #F5F3FF;/, '--color-secondary: #F8F6FD;');
html = html.replace(/background-color: rgba\(255, 255, 255, 0.6\);/, 'background-color: #FFFFFF;');
html = html.replace(/border: 1px solid var\(--color-border\);/, 'border: 1px solid rgba(113,147,237,0.10);');
html = html.replace(/box-shadow: 0 8px 32px 0 rgba\(31, 38, 135, 0.1\);/g, 'box-shadow: none;');

html = html.replace(/:root {[\s\S]*?html\.dark {/, `:root {
        --color-primary: #FFFFFF;
        --color-secondary: #F8F6FD;
        --color-text-primary: #111827;
        --color-text-secondary: rgba(0,0,0,0.55);
        --color-highlight: #EF4444;
        --color-border: rgba(113,147,237,0.10);

        --color-accent: #7193ED;
        --color-accent-light: #74BDE8;
      }
      html.dark {`);

// Also change tailwind config
html = html.replace(/colors: \{[\s\S]*?\},/, `colors: {
              'brand-teal': '#68CFCB',
              'brand-lightblue': '#74BDE8',
              'brand-blue': '#7193ED',
              'brand-lavender': '#BF9FF2',
              'success': '#22C55E',
              'warning': '#F59E0B',
              'danger': '#EF4444',
              'primary': 'var(--color-primary)',
              'secondary': 'var(--color-secondary)',
              'accent': 'var(--color-accent)',
              'highlight': 'var(--color-highlight)',
              'text-primary': 'var(--color-text-primary)',
              'text-secondary': 'var(--color-text-secondary)',
              'border-color': 'var(--color-border)',
            },`);

html = html.replace(/'brand-gradient': '[^']*'/, `'brand-gradient': 'linear-gradient(90deg, #BF9FF2 0%, #7193ED 100%)'`);

// Remove dynamic themes if any
let startIdx = html.indexOf('/* Dynamic Theme Switching */');
if (startIdx !== -1) {
    let endIdx = html.indexOf('/* Font size classes */');
    if (endIdx !== -1) {
        html = html.substring(0, startIdx) + html.substring(endIdx);
    }
}

fs.writeFileSync('index.html', html, 'utf8');
