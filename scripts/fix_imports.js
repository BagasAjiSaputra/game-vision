const fs = require('fs');

const files = [
  'app/endless_runner/page.tsx',
  'app/heli_runner/page.tsx',
  'app/basket_shoot/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(
    /import PoseController, \{ PoseState \} from "@\/components\/PoseController";/,
    'import PoseController, { PoseState, PoseControllerHandle } from "@/components/PoseController";'
  );
  fs.writeFileSync(file, content);
});
