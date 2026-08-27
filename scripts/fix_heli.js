const fs = require('fs');
let content = fs.readFileSync('app/heli_runner/page.tsx', 'utf-8');
content = content.replace(
  'const poseControllerRef = useRef<PoseControllerHandle>(null);',
  'const heliPoseControllerRef = useRef<HeliPoseControllerHandle>(null);'
);
content = content.replace(
  'const img = poseControllerRef.current?.captureImage();',
  'const img = heliPoseControllerRef.current?.captureImage();'
);
content = content.replace(
  '<HeliPoseController onPoseUpdate={setPoseState} />',
  '<HeliPoseController ref={heliPoseControllerRef} onPoseUpdate={setPoseState} />'
);
content = content.replace(
  'import HeliPoseController, { HeliPoseState } from "@/components/HeliPoseController";',
  'import HeliPoseController, { HeliPoseState, HeliPoseControllerHandle } from "@/components/HeliPoseController";'
);
fs.writeFileSync('app/heli_runner/page.tsx', content);

let bContent = fs.readFileSync('app/basket_shoot/page.tsx', 'utf-8');
bContent = bContent.replace(
  'const poseControllerRef = useRef<PoseControllerHandle>(null);',
  'const basketPoseControllerRef = useRef<BasketPoseControllerHandle>(null);'
);
bContent = bContent.replace(
  'const img = poseControllerRef.current?.captureImage();',
  'const img = basketPoseControllerRef.current?.captureImage();'
);
bContent = bContent.replace(
  '<BasketPoseController onPoseUpdate={setPoseState} />',
  '<BasketPoseController ref={basketPoseControllerRef} onPoseUpdate={setPoseState} />'
);
bContent = bContent.replace(
  'import BasketPoseController, { BasketPoseState } from "@/components/BasketPoseController";',
  'import BasketPoseController, { BasketPoseState, BasketPoseControllerHandle } from "@/components/BasketPoseController";'
);
fs.writeFileSync('app/basket_shoot/page.tsx', bContent);
