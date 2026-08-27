const fs = require('fs');

const files = [
  'app/endless_runner/page.tsx',
  'app/heli_runner/page.tsx',
  'app/basket_shoot/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace from Game Over Banner comment up to Choose Your Name comment
  content = content.replace(/[ \t]*\{\/\* Game Over Banner \*\/\}[\s\S]*?(?=[ \t]*\{\/\* Choose Your Name \*\/})/g, '');

  fs.writeFileSync(file, content);
});
