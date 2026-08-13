"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Box } from "@react-three/drei";
import * as THREE from "three";
import { PoseAction } from "./PoseController";

// Constants
const LANE_WIDTH = 2.5;
const GRAVITY = -25;
const JUMP_VELOCITY = 10;
const FORWARD_SPEED = 15;
const OBSTACLE_SPAWN_Z = -50;
const DESPAWN_Z = 10;

// ==========================================
// Player Component
// ==========================================
function Player({
  currentLane,
  isJumping,
  onJumpEnd,
  onGameOver
}: {
  currentLane: number;
  isJumping: boolean;
  onJumpEnd: () => void;
  onGameOver: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  
  // Try loading character, fallback to simple mesh if it fails or while loading
  // useGLTF.preload('/models/character.glb');
  let model;
  try {
    model = useGLTF("/models/character.glb");
  } catch(e) {
    console.warn("Could not load character.glb, using fallback", e);
  }

  const velocityY = useRef(0);
  const posY = useRef(0);
  const targetX = currentLane * LANE_WIDTH;

  useFrame((state, delta) => {
    if (!group.current) return;

    // Lateral Movement (Smooth lane changing)
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      targetX,
      10 * delta
    );

    // Jumping Logic
    if (isJumping && posY.current === 0) {
      velocityY.current = JUMP_VELOCITY;
    }

    if (posY.current > 0 || velocityY.current !== 0) {
      velocityY.current += GRAVITY * delta;
      posY.current += velocityY.current * delta;

      if (posY.current <= 0) {
        posY.current = 0;
        velocityY.current = 0;
        if (isJumping) onJumpEnd();
      }
    }

    group.current.position.y = posY.current;
    
    // Slight bobbing when running
    if (posY.current === 0) {
       group.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.05;
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {model && model.scene ? (
        <primitive object={model.scene} scale={0.5} position={[0, -1, 0]} rotation={[0, Math.PI, 0]} />
      ) : (
        <Box args={[1, 2, 1]} position={[0, 1, 0]}>
          <meshStandardMaterial color="hotpink" />
        </Box>
      )}
    </group>
  );
}

// ==========================================
// Obstacles Component
// ==========================================
interface ObstacleData {
  id: number;
  lane: number;
  z: number;
}

function Obstacle({ lane, z, speed, onRemove, onHitPlayer, playerLane, playerY }: {
  lane: number; z: number; speed: number; onRemove: () => void; onHitPlayer: () => void; playerLane: number; playerY: number;
}) {
  const ref = useRef<THREE.Group>(null);
  
  let model;
  try {
     model = useGLTF("/models/obstacle.glb");
  } catch(e) {}

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.z += speed * delta;

    if (ref.current.position.z > DESPAWN_Z) {
      onRemove();
    }

    // Collision Detection
    // Simple AABB (Axis-Aligned Bounding Box) logic
    const obZ = ref.current.position.z;
    const obX = lane * LANE_WIDTH;
    const pX = playerLane * LANE_WIDTH;
    const pY = playerY; // if player is jumping, they might avoid it
    
    if (
      Math.abs(obZ) < 1.0 && // Player is at Z=0
      Math.abs(obX - pX) < 1.0 && // Same lane roughly
      pY < 1.5 // Player is not jumping high enough (assuming obstacle height is 1.5)
    ) {
      // onHitPlayer(); // DISABLED FOR TESTING
    }
  });

  return (
    <group ref={ref} position={[lane * LANE_WIDTH, 0.5, z]}>
      {model && model.scene ? (
         <primitive object={model.scene.clone()} scale={1} />
      ) : (
        <Box args={[1, 1, 1]}>
          <meshStandardMaterial color="red" />
        </Box>
      )}
    </group>
  );
}

// ==========================================
// Environment & Ground Component
// ==========================================
function EndlessGround({ speed }: { speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  
  // Texture logic could be added here, for now a simple moving grid
  useFrame((state, delta) => {
      if (ref.current && ref.current.material) {
         // If using a texture, animate texture offset
         // ref.current.material.map.offset.y -= speed * delta * 0.1;
      }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -25]}>
      <planeGeometry args={[20, 100, 10, 50]} />
      <meshStandardMaterial color="#222" wireframe />
    </mesh>
  );
}

// ==========================================
// Main Game Component
// ==========================================
export default function Game({ action, onGameOver, onScoreUpdate }: {
  action: PoseAction;
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
}) {
  const [lane, setLane] = useState<number>(0); // -1, 0, 1
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const score = useRef(0);
  const nextObstacleId = useRef(0);
  
  // Handle actions from PoseController
  useEffect(() => {
    if (action === "left") {
      setLane((l) => Math.max(l - 1, -1));
    } else if (action === "right") {
      setLane((l) => Math.min(l + 1, 1));
    } else if (action === "jump") {
      setIsJumping(true);
    }
  }, [action]);

  // Game Loop (Spawning & Scoring)
  useEffect(() => {
    const interval = setInterval(() => {
      // Spawn new obstacle
      const randomLane = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      setObstacles((prev) => [
        ...prev,
        { id: nextObstacleId.current++, lane: randomLane, z: OBSTACLE_SPAWN_Z }
      ]);
      
      // Update Score
      score.current += 10;
      onScoreUpdate(score.current);
    }, 1500); // spawn every 1.5s

    return () => clearInterval(interval);
  }, [onScoreUpdate]);

  const removeObstacle = (id: number) => {
    setObstacles((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <Canvas camera={{ position: [0, 4, 6], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 5]} intensity={1} castShadow />
      
      <Environment preset="city" />

      <Player 
        currentLane={lane} 
        isJumping={isJumping} 
        onJumpEnd={() => setIsJumping(false)}
        onGameOver={onGameOver}
      />

      {obstacles.map((obs) => (
        <Obstacle
          key={obs.id}
          lane={obs.lane}
          z={obs.z}
          speed={FORWARD_SPEED}
          onRemove={() => removeObstacle(obs.id)}
          onHitPlayer={onGameOver}
          playerLane={lane}
          playerY={isJumping ? 2 : 0} // Approximate player Y for collision logic
        />
      ))}

      <EndlessGround speed={FORWARD_SPEED} />
      
      {/* Decorative side elements */}
      <Box args={[1, 1, 100]} position={[-4, 0, -25]}>
          <meshStandardMaterial color="#444" />
      </Box>
      <Box args={[1, 1, 100]} position={[4, 0, -25]}>
          <meshStandardMaterial color="#444" />
      </Box>
    </Canvas>
  );
}
