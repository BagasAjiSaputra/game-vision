const fs = require('fs');

const files = [
  'app/endless_runner/page.tsx',
  'app/heli_runner/page.tsx',
  'app/basket_shoot/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');

  // Replace import
  content = content.replace(
    'import html2canvas from "html2canvas";',
    'import * as htmlToImage from "html-to-image";'
  );

  // Replace capture logic
  content = content.replace(
    "html2canvas(document.body).then((canvas) => setFinalPoseImage(canvas.toDataURL('image/jpeg', 0.7)));",
    "htmlToImage.toJpeg(document.body, { quality: 0.7 }).then((dataUrl) => setFinalPoseImage(dataUrl));"
  );
  
  fs.writeFileSync(file, content);
});
