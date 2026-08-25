const fs = require('fs');
let code = fs.readFileSync('components/Game.tsx', 'utf-8');

// Remove CarMesh component and useGLTF preloads
code = code.replace(/function CarMesh\([\s\S]*?useGLTF\.preload\("\/models\/endless_runner\/trash\.glb"\);\n/g, '');

// Remove modelIdx from ObstacleData
code = code.replace(/  modelIdx\?: number;\n/g, '');

// Remove modelIdx from Obstacle props
code = code.replace(/  modelIdx = 0\n/g, '');

// Remove full obstacle rendering
code = code.replace(/      \{type === "full" && \([\s\S]*?\}\)\n/g, '');

// Remove modelIdx generation in spawning
code = code.replace(/, modelIdx: Math\.floor\(Math\.random\(\) \* 3\) \}/g, ' }');

// Change spawning array to remove "full"
code = code.replace(/const types: ObstacleType\[\] = \["high", "full", "full"\];/g, 'const types: ObstacleType[] = ["high"];');

// Remove modelIdx prop passed to Obstacle component
code = code.replace(/          modelIdx=\{obs\.modelIdx\}\n/g, '');

fs.writeFileSync('components/Game.tsx', code);
console.log('Fixed Game.tsx (Removed CarMesh)');
