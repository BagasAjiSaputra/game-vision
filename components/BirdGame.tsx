"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Box, useAnimations, Sky, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { BirdPoseState } from "./BirdPoseController";

// Constants
const LANE_WIDTH = 3;
const FORWARD_SPEED = 18;
const OBSTACLE_SPAWN_Z = -80;
const DESPAWN_Z = 20;

// ==========================================
// Bird Player Component
// ==========================================
function BirdPlayer({
  currentLane,
  isFlying,
  onGameOver
}: {
  currentLane: number;
  isFlying: boolean;
  onGameOver: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  
  let model: any;
  try {
    model = useGLTF("/models/parrot.glb");
  } catch(e) {
    console.warn("Could not load parrot.glb, using fallback", e);
  }

  const { actions } = useAnimations(model ? model.animations : [], group);

  useEffect(() => {
    if (!actions) return;
    const actionToPlay = Object.values(actions)[0]; // Play the first/only animation (usually flying)
    
    if (actionToPlay) {
      if (isFlying) {
        actionToPlay.reset().fadeIn(0.2).play();
        // Speed up animation to make it look like it's flying fast
        actionToPlay.setEffectiveTimeScale(1.5);
      } else {
        // Slow down or stop animation when idle
        actionToPlay.setEffectiveTimeScale(0.2);
      }
    }
  }, [actions, isFlying]);

  const targetX = currentLane * LANE_WIDTH;

  useFrame((state, delta) => {
    if (!group.current) return;

    // Lateral Movement (Smooth lane changing with banking)
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      targetX,
      5 * delta
    );
    
    // Banking effect (tilt when moving left/right)
    const bankingAngle = (group.current.position.x - targetX) * -0.2;
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      bankingAngle,
      10 * delta
    );

    // Slight bobbing when flying
    if (isFlying) {
       group.current.position.y = Math.sin(state.clock.elapsedTime * 8) * 0.2 + 2;
    } else {
       // Gently fall if not flying? Let's just keep it hovering for now, or sink a bit
       group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 1, 2 * delta);
    }
  });

  return (
    <group ref={group} position={[0, 2, 0]}>
      {model && model.scene ? (
        <primitive object={model.scene} scale={0.03} position={[0, -0.5, 0]} rotation={[0, Math.PI, 0]} />
      ) : (
        <Box args={[1, 0.5, 1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="yellow" />
        </Box>
      )}
    </group>
  );
}

// ==========================================
// Flamingo Obstacle Component
// ==========================================
interface ObstacleData {
  id: number;
  lane: number;
  z: number;
}

function FlamingoObstacle({ lane, z, speed, onRemove, onHitPlayer, playerLane, playerY }: {
  lane: number; z: number; speed: number; onRemove: () => void; onHitPlayer: () => void; playerLane: number; playerY: number;
}) {
  const group = useRef<THREE.Group>(null);
  
  let model: any;
  try {
    model = useGLTF("/models/flamingo.glb");
  } catch(e) {}

  const { actions } = useAnimations(model ? model.animations : [], group);

  useEffect(() => {
    if (!actions) return;
    const actionToPlay = Object.values(actions)[0]; 
    if (actionToPlay) {
      actionToPlay.reset().fadeIn(0.2).play();
      actionToPlay.setEffectiveTimeScale(2); // Fly fast towards player
    }
  }, [actions]);

  useFrame((state, delta) => {
    if (!group.current) return;
    // Flamingos fly towards the player faster than the ground moves
    group.current.position.z += (speed + 15) * delta;

    if (group.current.position.z > DESPAWN_Z) {
      onRemove();
    }

    // Collision Detection
    const obZ = group.current.position.z;
    const obX = lane * LANE_WIDTH;
    const pX = playerLane * LANE_WIDTH;
    
    if (
      Math.abs(obZ) < 1.5 && 
      Math.abs(obX - pX) < 1.5
    ) {
      // Collision detected
    }
  });

  return (
    <group ref={group} position={[lane * LANE_WIDTH, 2, z]}>
      {model && model.scene ? (
        <primitive object={model.scene.clone()} scale={0.015} rotation={[0, 0, 0]} />
      ) : (
        <Box args={[1, 1, 1]}>
          <meshStandardMaterial color="pink" />
        </Box>
      )}
    </group>
  );
}

// ==========================================
// Forest Ground Component
// ==========================================
function ForestGround({ speed }: { speed: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
      // Base grass
      context.fillStyle = '#1E5631';
      context.fillRect(0, 0, 512, 512);

      // A few large, soft patches instead of noisy dots to prevent dizziness
      context.fillStyle = '#228B22';
      context.beginPath();
      context.arc(100, 150, 80, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.arc(400, 350, 120, 0, Math.PI * 2);
      context.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 10);
    return tex;
  }, []);

  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (texture) {
      texture.offset.y += (speed / 10) * delta;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -25]}>
      <planeGeometry args={[100, 200]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
}

// ==========================================
// Main Bird Game Component
// ==========================================
export default function BirdGame({ poseState, onGameOver, onScoreUpdate }: {
  poseState: BirdPoseState;
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
}) {
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const score = useRef(0);
  const nextObstacleId = useRef(0);
  
  const lane = poseState.lane;
  const isFlying = poseState.isFlying;
  const currentSpeed = isFlying ? FORWARD_SPEED : 0;
  
  // Game Loop (Spawning & Scoring)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFlying) return;

      // Spawn new obstacle (Flamingo)
      const randomLane = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      setObstacles((prev) => [
        ...prev,
        { id: nextObstacleId.current++, lane: randomLane, z: OBSTACLE_SPAWN_Z }
      ]);
      
      // Update Score
      score.current += 10;
      onScoreUpdate(score.current);
    }, 1200);

    return () => clearInterval(interval);
  }, [onScoreUpdate, isFlying]);

  const removeObstacle = (id: number) => {
    setObstacles((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <Canvas camera={{ position: [0, 5, 8], fov: 60 }}>
      {/* Dynamic Sky & Environment */}
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} />
      <Sparkles count={500} scale={50} size={4} speed={0.4} opacity={0.5} color="#ffffff" position={[0, 5, -20]} />
      <fog attach="fog" args={['#87CEEB', 20, 80]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 30, 5]} intensity={1.2} castShadow />
      
      <Environment preset="forest" />

      <BirdPlayer 
        currentLane={lane} 
        isFlying={isFlying}
        onGameOver={onGameOver}
      />

      {obstacles.map((obs) => (
        <FlamingoObstacle
          key={obs.id}
          lane={obs.lane}
          z={obs.z}
          speed={currentSpeed}
          onRemove={() => removeObstacle(obs.id)}
          onHitPlayer={onGameOver}
          playerLane={lane}
          playerY={2} // Approximated bird height
        />
      ))}

      <ForestGround speed={currentSpeed} />
    </Canvas>
  );
}
