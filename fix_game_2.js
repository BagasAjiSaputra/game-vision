const fs = require('fs');
let code = fs.readFileSync('components/Game.tsx', 'utf-8');

// Restore CoinData
if (!code.includes('interface CoinData')) {
    const coinDataCode = `interface CoinData {
  id: number;
  lane: number;
  z: number;
  y: number;
}`;
    code = code.replace(/\/\/ ==========================================\n\/\/ Coin Item Component/, coinDataCode + '\n\n// ==========================================\n// Coin Item Component');
}

// Remove onPowerupUpdate from Game props
code = code.replace(/onPowerupUpdate\n/g, '');

// Remove powerups rendering loop
code = code.replace(/\{\/\* Powerups \*\/\}[\s\S]*?\}\)\}/, '');

fs.writeFileSync('components/Game.tsx', code);
console.log('Fixed Game.tsx again');

// Fix page.tsx
let pageCode = fs.readFileSync('app/endless_runner/page.tsx', 'utf-8');
pageCode = pageCode.replace(/onPowerupUpdate=\{handlePowerupUpdate\}/g, '');
fs.writeFileSync('app/endless_runner/page.tsx', pageCode);
console.log('Fixed page.tsx again');
