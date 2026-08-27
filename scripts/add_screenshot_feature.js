const fs = require('fs');

const files = [
  'app/endless_runner/page.tsx',
  'app/heli_runner/page.tsx',
  'app/basket_shoot/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');

  // 1. Add PoseControllerHandle to import
  content = content.replace(
    /import PoseController, { PoseState } from "\.\.\/components\/PoseController";/,
    'import PoseController, { PoseState, PoseControllerHandle } from "../components/PoseController";'
  );

  // 2. Add refs and state
  const stateInsert = `
  const [finalPoseImage, setFinalPoseImage] = useState<string | null>(null);
  const poseControllerRef = useRef<PoseControllerHandle>(null);
`;
  content = content.replace(
    /const \[randomSeed, setRandomSeed\] = useState\(""\);/,
    `const [randomSeed, setRandomSeed] = useState("");${stateInsert}`
  );

  // 3. Update the timer logic
  if (file.includes('endless_runner') || file.includes('heli_runner')) {
    content = content.replace(
      /setTimeLeft\(\(prev\) => \{\n\s*if \(prev <= 1\) \{/,
      `setTimeLeft((prev) => {
          if (prev === 2) {
            const img = poseControllerRef.current?.captureImage();
            if (img) setFinalPoseImage(img);
          }
          if (prev <= 1) {`
    );
  } else if (file.includes('basket_shoot')) {
    content = content.replace(
      /setTimeLeft\(\(prev\) => \{\n\s*if \(prev <= 1\) \{/,
      `setTimeLeft((prev) => {
          if (prev === 2) {
            const img = poseControllerRef.current?.captureImage();
            if (img) setFinalPoseImage(img);
          }
          if (prev <= 1) {`
    );
  }

  // 4. Update the PoseController JSX to attach ref
  content = content.replace(
    /<PoseController onPoseUpdate=\{setPoseState\} \/>/,
    '<PoseController ref={poseControllerRef} onPoseUpdate={setPoseState} />'
  );

  // 5. Reset finalPoseImage on restart
  content = content.replace(
    /setGameOverReason\(""\);/g,
    'setGameOverReason("");\n    setFinalPoseImage(null);'
  );

  // 6. Display final pose in Game Over screen
  const uiInsert = `
              {finalPoseImage && (
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Final Pose Kamu! 📸</span>
                  <img src={finalPoseImage} alt="Final Pose" className="w-48 h-36 object-cover rounded-xl border-4 border-[#d4ff00] shadow-2xl rotate-2 hover:rotate-0 transition-transform" />
                </div>
              )}
`;
  content = content.replace(
    /\{gameOverReason && <p className="text-gray-400 mt-2">\{gameOverReason\}<\/p>\}/,
    `{gameOverReason && <p className="text-gray-400 mt-2">{gameOverReason}</p>}${uiInsert}`
  );

  fs.writeFileSync(file, content);
});
