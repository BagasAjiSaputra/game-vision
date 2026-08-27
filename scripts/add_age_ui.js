const fs = require('fs');

const files = [
  { path: 'app/endless_runner/page.tsx', gameType: 'EndlessRunner' },
  { path: 'app/heli_runner/page.tsx', gameType: 'HeliRunner' },
  { path: 'app/basket_shoot/page.tsx', gameType: 'BasketShoot' }
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf-8');

  // 1. Add state
  content = content.replace(
    'const [playerName, setPlayerName] = useState("");',
    'const [playerName, setPlayerName] = useState("");\n  const [playerAge, setPlayerAge] = useState<string>("");'
  );

  // 2. Add validation to startGame
  content = content.replace(
    'const startGame = (name: string) => {\n    if (!name.trim()) return;',
    'const startGame = (name: string, ageStr: string) => {\n    if (!name.trim() || !ageStr) return;'
  );
  
  // Also fix the onClick of the Play button
  // Actually, wait, let's look at how the Play button is triggered.
  // Wait, I need to see the Play button first to see if it uses startGame(playerName) or what.
  fs.writeFileSync(f.path, content);
});
