const fs = require('fs');

const fixLocalStorage = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove the useEffect that overwrites localStorage
  content = content.replace(/useEffect\(\(\) => \{\n\s*localStorage.setItem\('isLightMode', String\(isLightMode\)\);\n\s*\}, \[isLightMode\]\);\n\n\s*/g, '');

  // Update onClick to write to localStorage directly
  content = content.replace(/onClick=\{\(\) => setIsLightMode\(!isLightMode\)\}/g, "onClick={() => { const next = !isLightMode; setIsLightMode(next); localStorage.setItem('isLightMode', String(next)); }}");

  fs.writeFileSync(filePath, content);
  console.log('Fixed ' + filePath);
};

fixLocalStorage('app/page.tsx');
fixLocalStorage('app/endless_runner/page.tsx');
fixLocalStorage('app/heli_runner/page.tsx');
fixLocalStorage('app/basket_shoot/page.tsx');

