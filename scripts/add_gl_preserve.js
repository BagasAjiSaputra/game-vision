const fs = require('fs');

['components/Game.tsx', 'components/HeliGame.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(
    /<Canvas shadows camera=\{\{ position: \[0, 4, 10\], fov: 60 \}\}>/,
    '<Canvas shadows camera={{ position: [0, 4, 10], fov: 60 }} gl={{ preserveDrawingBuffer: true }}>'
  );
  content = content.replace(
    /<Canvas shadows camera=\{\{ position: \[0, 2, 8\], fov: 60 \}\}>/,
    '<Canvas shadows camera={{ position: [0, 2, 8], fov: 60 }} gl={{ preserveDrawingBuffer: true }}>'
  );
  fs.writeFileSync(file, content);
});
