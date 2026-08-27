const fs = require('fs');

const files = [
  { path: 'app/heli_runner/page.tsx', type: 'heli_runner' },
  { path: 'app/basket_shoot/page.tsx', type: 'basket_shoot' }
];

files.forEach(f => {
  let content = fs.readFileSync(f.path, 'utf-8');

  // Add state if not exists
  if (!content.includes('const [playerAge, setPlayerAge] = useState("");')) {
    content = content.replace(
      'const [playerName, setPlayerName] = useState("");',
      'const [playerName, setPlayerName] = useState("");\n  const [playerAge, setPlayerAge] = useState("");'
    );
  }

  // Update startGame
  content = content.replace(
    'if (!playerName.trim()) return;',
    'if (!playerName.trim() || !playerAge.trim()) return;'
  );

  // Update saveGameScore call
  content = content.replace(
    `saveGameScore(\n          playerName.trim(),\n          '${f.type}',\n          score\n        );`,
    `saveGameScore(\n          playerName.trim(),\n          '${f.type}',\n          score,\n          parseInt(playerAge)\n        );`
  );
  content = content.replace(
    `saveGameScore(playerName, '${f.type}', score);`,
    `saveGameScore(playerName, '${f.type}', score, parseInt(playerAge));`
  );

  // Update UI
  content = content.replace(
    'placeholder="ENTER NAME"',
    'placeholder="NAMA PEMAIN"'
  );
  content = content.replace(
    /className=\{\`flex-1 rounded-full px-8 py-5 font-bold focus:outline-none transition-colors text-xl \$\{isLightMode \? 'bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-([^']+)' : 'bg-\[#1c1e1c\] border border-white\/5 text-white placeholder:text-\[#555\] focus:border-\[([^\]]+)\]'\}\`\}/g,
    "className={`flex-[2] rounded-full px-8 py-5 font-bold focus:outline-none transition-colors text-xl ${isLightMode ? 'bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-$1 shadow-sm' : 'bg-[#1c1e1c] border border-white/5 text-white placeholder:text-[#555] focus:border-[$2]'}`}\n                  />\n                  <input \n                    type=\"number\" \n                    value={playerAge}\n                    onChange={(e) => setPlayerAge(e.target.value)}\n                    placeholder=\"UMUR\"\n                    className={`flex-1 rounded-full px-6 py-5 font-bold focus:outline-none transition-colors text-xl ${isLightMode ? 'bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-$1 shadow-sm' : 'bg-[#1c1e1c] border border-white/5 text-white placeholder:text-[#555] focus:border-[$2]'}`}"
  );

  fs.writeFileSync(f.path, content);
});
