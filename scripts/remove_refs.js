const fs = require('fs');

const files = [
  'app/endless_runner/page.tsx',
  'app/heli_runner/page.tsx',
  'app/basket_shoot/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/const poseControllerRef = useRef<any>\(null\);\n/g, '');
  content = content.replace(/const poseControllerRef = useRef<PoseControllerHandle>\(null\);\n/g, '');
  content = content.replace(/const heliPoseControllerRef = useRef<HeliPoseControllerHandle>\(null\);\n/g, '');
  content = content.replace(/const basketPoseControllerRef = useRef<BasketPoseControllerHandle>\(null\);\n/g, '');
  fs.writeFileSync(file, content);
});
