const fs = require('fs');
let code = fs.readFileSync('components/Game.tsx', 'utf-8');

// 1. Remove Magnet from Player
code = code.replace(/isMagnetActive,\n/g, '');
code = code.replace(/isMagnetActive: boolean;\n/g, '');
code = code.replace(/\{\/\* Magnet Active Aura \*\/\}[\s\S]*?\}\)/, '');

// 2. Remove Magnet from CoinItem
code = code.replace(/isMagnetActive,\n/g, '');
code = code.replace(/isMagnetActive: boolean;\n/g, '');
code = code.replace(/\/\/ Magnet Pulling Effect[\s\S]*?\}\n/, '');

// 3. Remove PowerupItem component and PowerupData interface
code = code.replace(/\/\/ Powerup Item \(Magnet\)[\s\S]*?\/\/ ==========================================\n\/\/ Obstacles Component/, '// ==========================================\n// Obstacles Component');

// 4. Modify ObstacleData and add CarMesh
const carMeshCode = `interface ObstacleData {
  id: number;
  type: ObstacleType;
  lane: number;
  z: number;
  modelIdx?: number;
}

function CarMesh({ modelIdx }: { modelIdx: number }) {
  const m1 = useGLTF("/models/endless_runner/broken_car.glb") as any;
  const m2 = useGLTF("/models/endless_runner/bus.glb") as any;
  const m3 = useGLTF("/models/endless_runner/trash.glb") as any;
  
  const models = [m1, m2, m3];
  const selected = models[modelIdx % models.length];

  if (!selected || !selected.scene) return null;

  return (
    <Clone object={selected.scene} scale={0.7} rotation={[0, Math.PI, 0]} />
  );
}
useGLTF.preload("/models/endless_runner/broken_car.glb");
useGLTF.preload("/models/endless_runner/bus.glb");
useGLTF.preload("/models/endless_runner/trash.glb");`;
code = code.replace(/interface ObstacleData \{[\s\S]*?\}/, carMeshCode);

// 5. Update Obstacle props
code = code.replace(/isSliding,\n  isJetpackActive\n\}: \{/g, 'isSliding,\n  modelIdx = 0\n}: {');
code = code.replace(/isSliding: boolean;\n\}\) \{/g, 'isSliding: boolean;\n  modelIdx?: number;\n}) {');

// 6. Update Obstacle render - remove low (yellow box), high (red sign), and replace full (turret) with CarMesh
// Wait, the user said "hapus aset warna kuning kotak halangan". That's the low obstacle.
// I will just remove the rendering of "low" and "high" or keep "high"? They just said remove yellow box and turret. I'll keep high (red sign) just in case, but replace full (turret) with CarMesh.
code = code.replace(/\{type === "low" && \([\s\S]*?\)\}/, ''); // Remove low
code = code.replace(/\{type === "full" && \([\s\S]*?\)\}/, `{type === "full" && (
        <group position={[0, -0.6, 0]}>
          <CarMesh modelIdx={modelIdx} />
        </group>
      )}`); // Replace full with CarMesh

// 7. Update Game component - remove Magnet state, logic, and Powerups
code = code.replace(/onPowerupUpdate: \(magnetTime: number\) => void;\n/g, '');
code = code.replace(/const \[powerups, setPowerups\] = useState<PowerupData\[\]>\(\[\]\);\n/g, '');
code = code.replace(/const \[magnetTimer, setMagnetTimer\] = useState<number>\(0\);\n/g, '');
code = code.replace(/const isMagnetActive = magnetTimer > 0;\n/g, '');

// Remove magnet timer useEffect
code = code.replace(/\/\/ Powerup timers countdown[\s\S]*?\}, \[magnetTimer, onPowerupUpdate\]\);\n/g, '');

// Remove powerup spawning
code = code.replace(/\/\/ Spawn Powerups randomly[\s\S]*?\}\n/g, '');

// Update obstacle spawning to include modelIdx and remove "low" type from random selection
code = code.replace(/const types: ObstacleType\[\] = \["low", "high", "full"\];/, 'const types: ObstacleType[] = ["high", "full", "full"];');
code = code.replace(/z: OBSTACLE_SPAWN_Z \}/, 'z: OBSTACLE_SPAWN_Z, modelIdx: Math.floor(Math.random() * 3) }');

// Remove powerup collection handler
code = code.replace(/const handleCollectPowerup = [\s\S]*?\};\n/g, '');

// Remove powerup rendering
code = code.replace(/\{\/\* Powerups \*\/\}[\s\S]*?\}\)\}/, '');

// Update Obstacle and CoinItem rendering to remove isMagnetActive and add modelIdx
code = code.replace(/isMagnetActive=\{isMagnetActive\}\n/g, '');
code = code.replace(/z=\{obs.z\}\n/g, 'z={obs.z}\n          modelIdx={obs.modelIdx}\n');

fs.writeFileSync('components/Game.tsx', code);
console.log('Fixed Game.tsx');
