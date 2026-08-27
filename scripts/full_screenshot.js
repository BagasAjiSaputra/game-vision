const fs = require('fs');

const files = [
  'app/endless_runner/page.tsx',
  'app/heli_runner/page.tsx',
  'app/basket_shoot/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');

  // Add import
  if (!content.includes('import html2canvas')) {
    content = content.replace(
      'import Link from "next/link";',
      'import Link from "next/link";\nimport html2canvas from "html2canvas";'
    );
  }

  // Update timer logic
  // Endless & Basket
  content = content.replace(
    /const img = \w+PoseControllerRef\.current\?\.captureImage\(\);\n\s*if \(img\) setFinalPoseImage\(img\);/g,
    `html2canvas(document.body).then((canvas) => setFinalPoseImage(canvas.toDataURL('image/jpeg', 0.7)));`
  );
  
  // Actually, let's just do a blanket regex replacement:
  content = content.replace(
    /const img = .*captureImage\(\);\n\s*if \(img\) setFinalPoseImage\(img\);/,
    "html2canvas(document.body).then((canvas) => setFinalPoseImage(canvas.toDataURL('image/jpeg', 0.7)));"
  );
  
  // Replace final text
  content = content.replace(
    'Final Pose Kamu! 📸',
    'Tangkapan Layar Terakhir! 📸'
  );
  
  // Let's remove the PoseControllerRef stuff because it's no longer needed for screenshot, but wait, it doesn't hurt to keep it.
  fs.writeFileSync(file, content);
});
