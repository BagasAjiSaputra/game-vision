const fs = require('fs');
const filePath = 'components/PoseController.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
  'import { useRef, useEffect, useState } from "react";',
  'import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";'
);

content = content.replace(
  'export default function PoseController({ onPoseUpdate }: { onPoseUpdate: (state: PoseState) => void }) {',
  `export interface PoseControllerHandle {
  captureImage: () => string | null;
}

const PoseController = forwardRef<PoseControllerHandle, { onPoseUpdate: (state: PoseState) => void }>(({ onPoseUpdate }, ref) => {`
);

content = content.replace(
  '  return (',
  `  useImperativeHandle(ref, () => ({
    captureImage: () => {
      if (canvasRef.current) {
        return canvasRef.current.toDataURL("image/jpeg", 0.8);
      }
      return null;
    }
  }));

  return (`
);

content = content.replace(
  '}\n\n',
  '});\n\nexport default PoseController;\n\n'
);

fs.writeFileSync(filePath, content);
