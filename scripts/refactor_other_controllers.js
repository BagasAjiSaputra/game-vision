const fs = require('fs');

function refactorController(file, handleName, componentName, propsName, stateName) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(
    'import { useEffect, useRef, useState } from "react";',
    'import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";'
  );
  content = content.replace(
    `export default function ${componentName}({ onPoseState }: ${propsName}) {`,
    `export interface ${handleName} {\n  captureImage: () => string | null;\n}\n\nconst ${componentName} = forwardRef<${handleName}, ${propsName}>(({ onPoseState }, ref) => {`
  );
  content = content.replace(
    '  const [isFullscreen, setIsFullscreen] = useState(false);',
    `  useImperativeHandle(ref, () => ({\n    captureImage: () => {\n      if (canvasRef.current) {\n        return canvasRef.current.toDataURL("image/jpeg", 0.8);\n      }\n      return null;\n    }\n  }));\n\n  const [isFullscreen, setIsFullscreen] = useState(false);`
  );
  content = content.replace(
    '}\n',
    '});\n\nexport default ' + componentName + ';\n'
  );
  fs.writeFileSync(file, content);
}

refactorController('components/HeliPoseController.tsx', 'HeliPoseControllerHandle', 'HeliPoseController', 'HeliPoseControllerProps', 'HeliPoseState');
refactorController('components/BasketPoseController.tsx', 'BasketPoseControllerHandle', 'BasketPoseController', 'BasketPoseControllerProps', 'BasketPoseState');
