import fs from 'fs';

let content = fs.readFileSync('components/Comparison.tsx', 'utf8');

content = content.replace(/disabled:shadow-md  text-white/g, 'disabled:shadow-md bg-brand-gradient text-white border-0');
content = content.replace(/color: '#4DD0E1'/g, "color: '#68CFCB'");
content = content.replace(/color: '#FF7043'/g, "color: '#7193ED'"); // or brand-blue

fs.writeFileSync('components/Comparison.tsx', content, 'utf8');

// also team editor modal
content = fs.readFileSync('components/TeamEditorModal.tsx', 'utf8');
content = content.replace(/const variantClasses =[\s\S]*?; \/\/ primary/gm, `const variantClasses = variant === 'secondary' ? 'bg-brand-lightblue text-white border-0' : variant === 'blue' ? 'bg-brand-blue text-white border-0' : 'bg-brand-gradient text-white border-0'; // primary`);
fs.writeFileSync('components/TeamEditorModal.tsx', content, 'utf8');

