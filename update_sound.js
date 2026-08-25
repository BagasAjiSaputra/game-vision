const fs = require('fs');
let code = fs.readFileSync('components/Game.tsx', 'utf-8');

// Update SoundManager class
const oldSoundManagerMatch = code.match(/class SoundManager \{[\s\S]*?\n\}\n/);
if (oldSoundManagerMatch) {
  let smCode = oldSoundManagerMatch[0];
  smCode = smCode.replace('class SoundManager {', 'class SoundManager {\n  public masterVolume: number = 0.5;\n');
  
  // Replace gain values
  smCode = smCode.replace(/gain\.gain\.setValueAtTime\(([\d.]+),/g, 'gain.gain.setValueAtTime($1 * this.masterVolume,');
  smCode = smCode.replace(/gain\.gain\.exponentialRampToValueAtTime\(([\d.]+),/g, 'gain.gain.exponentialRampToValueAtTime($1 * this.masterVolume,');
  smCode = smCode.replace(/gain\.gain\.linearRampToValueAtTime\(([\d.]+),/g, 'gain.gain.linearRampToValueAtTime($1 * this.masterVolume,');
  
  code = code.replace(oldSoundManagerMatch[0], smCode);
}

// Update Game props to include volume
code = code.replace(
  /onScoreUpdate,\n  onCoinsUpdate,\n  \}: \{/,
  'onScoreUpdate,\n  onCoinsUpdate,\n  volume = 0.5\n  }: {\n  volume?: number;'
);

// Add useEffect to sync volume
const gameBodyMatch = code.match(/const nextObstacleId = useRef\(1\);/);
if (gameBodyMatch) {
  code = code.replace(
    '  const nextObstacleId = useRef(1);',
    '  useEffect(() => {\n    sounds.masterVolume = volume;\n  }, [volume]);\n\n  const nextObstacleId = useRef(1);'
  );
}

fs.writeFileSync('components/Game.tsx', code);
console.log('Updated Game.tsx SoundManager and props');
