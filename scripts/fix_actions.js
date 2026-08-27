const fs = require('fs');
let content = fs.readFileSync('app/actions.ts', 'utf-8');
content = content.replace(
  'export async function saveGameScore(playerName: string, gameType: string, score: number, age: number | null = null, school: string | null = null) {',
  'export async function saveGameScore(playerName: string, gameType: string, score: number, age?: number, school?: string) {'
);
content = content.replace(
  /update\(\{ score: score, age: age, school: school, created_at: new Date\(\)\.toISOString\(\) \}\)/g,
  'update({ score, age, ...(school !== undefined ? {school} : {}), created_at: new Date().toISOString() })'
);
content = content.replace(
  /\{\n\s*player_name: playerName,\n\s*game_type: gameType,\n\s*score: score,\n\s*age: age,\n\s*school: school\n\s*\}/g,
  '{ player_name: playerName, game_type: gameType, score, age, ...(school !== undefined ? {school} : {}) }'
);
fs.writeFileSync('app/actions.ts', content);
