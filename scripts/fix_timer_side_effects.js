const fs = require('fs');

const files = [
  'app/endless_runner/page.tsx',
  'app/heli_runner/page.tsx',
  'app/basket_shoot/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');

  // Find the exact block to replace
  const regex = /const timer = setInterval\(\(\) => \{\n\s*setTimeLeft\(\(prev\) => \{\n\s*if \(prev === 2\) \{\n\s*html2canvas\(document\.body\)\.then\(\(canvas\) => setFinalPoseImage\(canvas\.toDataURL\('image\/jpeg', 0\.7\)\)\);\n\s*\}\n\s*if \(prev <= 1\) \{\n\s*handleGameOver\("Waktu Habis"\);\n\s*return 0;\n\s*\}\n\s*return prev - 1;\n\s*\}\);\n\s*\}, 1000\);/g;

  content = content.replace(regex, `const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);`);

  // Insert the new useEffect right below the timer useEffect
  const newEffect = `
  useEffect(() => {
    if (isPlaying && isGameActive && !isGameOver) {
      if (timeLeft === 1) {
        html2canvas(document.body).then((canvas) => setFinalPoseImage(canvas.toDataURL('image/jpeg', 0.7)));
      } else if (timeLeft <= 0) {
        handleGameOver("Waktu Habis");
      }
    }
  }, [timeLeft, isPlaying, isGameActive, isGameOver]);
`;
  
  content = content.replace(
    /return \(\) => clearInterval\(timer\);\n\s*\}\n\s*\}, \[isPlaying, isGameActive, isGameOver\]\);/,
    `return () => clearInterval(timer);\n    }\n  }, [isPlaying, isGameActive, isGameOver]);\n${newEffect}`
  );

  fs.writeFileSync(file, content);
});
