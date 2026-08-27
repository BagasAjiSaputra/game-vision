const fs = require('fs');

const files = [
  'app/endless_runner/page.tsx',
  'app/heli_runner/page.tsx',
  'app/basket_shoot/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Remove import
  content = content.replace(/import \* as htmlToImage from ['"]html-to-image['"];\n?/g, '');

  // Remove state
  content = content.replace(/[ \t]*const \[finalPoseImage, setFinalPoseImage\] = useState<string \| null>\(null\);\n?/g, '');

  // Remove setFinalPoseImage(null)
  content = content.replace(/[ \t]*setFinalPoseImage\(null\);\n?/g, '');

  // Remove handleGameOver block
  const handleGameOverRegex = /[ \t]*if \(\!finalPoseImage\) \{[\s\S]*?console\.error\("Screenshot error", err\);\s*\}\s*\}/g;
  content = content.replace(handleGameOverRegex, '');

  // Remove UI block
  const uiBlockRegex = /[ \t]*\{finalPoseImage && \([\s\S]*?\}\)\n?/g;
  content = content.replace(uiBlockRegex, '');

  fs.writeFileSync(file, content);
});
