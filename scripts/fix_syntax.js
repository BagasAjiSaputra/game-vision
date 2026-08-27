const fs = require('fs');

let endless = fs.readFileSync('app/endless_runner/page.tsx', 'utf-8');
const endlessLines = endless.split('\n');
// Keep only up to line 413
fs.writeFileSync('app/endless_runner/page.tsx', endlessLines.slice(0, 413).join('\n') + '\n');

let basket = fs.readFileSync('app/basket_shoot/page.tsx', 'utf-8');
const basketLines = basket.split('\n');
// Keep only up to line 399
fs.writeFileSync('app/basket_shoot/page.tsx', basketLines.slice(0, 399).join('\n') + '\n');

