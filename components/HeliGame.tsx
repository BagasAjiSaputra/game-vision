"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Box, useAnimations, Sky, Sparkles, Html, Cloud, Clouds, CameraShake } from "@react-three/drei";
import * as THREE from "three";
import { HeliPoseState } from "./HeliPoseController";

// Constants
const LANE_WIDTH = 3;
const FORWARD_SPEED = 10;
const OBSTACLE_SPAWN_Z = -80;
const DESPAWN_Z = 20;

// ==========================================
// Custom FPS Counter Component
// ==========================================
function CustomFPS() {
  const fpsRef = useRef<HTMLDivElement>(null);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    if (now - lastTime.current >= 1000) {
      if (fpsRef.current) {
        fpsRef.current.innerText = `FPS: ${Math.round((frameCount.current * 1000) / (now - lastTime.current))}`;
      }
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  return (
    <Html fullscreen style={{ pointerEvents: 'none', zIndex: 100 }}>
      <div 
        ref={fpsRef} 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '30px', 
          fontSize: '32px', 
          fontWeight: '900', 
          color: '#00ffcc', 
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          fontFamily: 'monospace'
        }}
      >
        FPS: 60
      </div>
    </Html>
  );
}

// ==========================================
// Heli Player Component
// ==========================================
function HeliPlayer({
  currentLane,
  isFlying,
  onGameOver
}: {
  currentLane: number;
  isFlying: boolean;
  onGameOver: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  
  const model = useGLTF("/models/helicopter.glb") as any;

  const { actions } = useAnimations(model ? model.animations : [], group);

  useEffect(() => {
    if (!actions) return;
    const actionToPlay = Object.values(actions)[0];
    
    if (actionToPlay) {
      actionToPlay.reset().fadeIn(0.2).play();
      if (isFlying) {
        actionToPlay.setEffectiveTimeScale(2.0);
      } else {
        actionToPlay.setEffectiveTimeScale(0.5);
      }
    }
  }, [actions, isFlying]);

  const mainRotor = useMemo(() => {
    if (model && model.scene) {
      let found: any = null;
      model.scene.traverse((child: any) => {
        if (child.name === "main_rotor__0") found = child;
      });
      return found;
    }
    return null;
  }, [model]);

  const rearRotor = useMemo(() => {
    if (model && model.scene) {
      let found: any = null;
      model.scene.traverse((child: any) => {
        if (child.name === "rear_rotor_1") found = child;
      });
      return found;
    }
    return null;
  }, [model]);

  const targetX = currentLane * LANE_WIDTH;

  useFrame((state, delta) => {
    if (!group.current) return;

    // Animate rotors
    const rotorSpeed = isFlying ? 25 : 8;
    if (mainRotor) mainRotor.rotation.z += rotorSpeed * delta; // Try Z or Y depending on model orientation
    if (rearRotor) rearRotor.rotation.x += rotorSpeed * delta;

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

    // Pitch forward noticeably when flying to simulate helicopter moving forward
    const targetPitch = isFlying ? -0.4 : 0;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      targetPitch,
      6 * delta
    );

    // Slight bobbing when flying, hover when stopped
    if (isFlying) {
       group.current.position.y = Math.sin(state.clock.elapsedTime * 8) * 0.2 - 1;
    } else {
       // Hover in place while countdown runs
       group.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1 - 1;
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]}>
      {model && model.scene ? (
        <primitive object={model.scene} scale={0.5} position={[0, -0.5, 0]} rotation={[0, Math.PI, 0]} />
      ) : (
        <Box args={[1, 0.5, 1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="blue" />
        </Box>
      )}
    </group>
  );
}

// ==========================================
// Fighter Jet Obstacle Component
// ==========================================
interface ObstacleData {
  id: number;
  lane: number;
  z: number;
}

function FighterJetObstacle({ lane, z, speed, onRemove, onHitPlayer, onPass, playerLane, playerY }: {
  lane: number; z: number; speed: number; onRemove: () => void; onHitPlayer: () => void; onPass: () => void; playerLane: number; playerY: number;
}) {
  const group = useRef<THREE.Group>(null);
  const hitRegisteredRef = useRef(false);
  const passedRef = useRef(false);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (!group.current.userData.initialized) {
      group.current.position.set(lane * LANE_WIDTH, -1, z);
      group.current.userData.initialized = true;
    }
    
    // Fighter jets only fly towards the player if the player is moving
    if (speed > 0) {
      group.current.position.z += (speed + 14) * delta;
    }

    const obZ = group.current.position.z;

    if (obZ > DESPAWN_Z) {
      onRemove();
    }

    // Collision Detection
    const obX = lane * LANE_WIDTH;
    const pX = playerLane * LANE_WIDTH;
    
    // Adjusted hit box for jet (it is wide due to wings)
    if (
      !hitRegisteredRef.current &&
      Math.abs(obZ) < 2.0 && 
      Math.abs(obX - pX) < 1.8
    ) {
      hitRegisteredRef.current = true;
      onHitPlayer();
    }

    // Pass Detection
    if (obZ > 2.0 && !hitRegisteredRef.current && !passedRef.current) {
      passedRef.current = true;
      onPass();
    }
  });

  const model = useGLTF("/models/heli_2.glb") as any;
  const clonedScene = useMemo(() => {
    return model && model.scene ? model.scene.clone() : null;
  }, [model]);

  return (
    <group ref={group} userData={{ initialized: false }}>
      {clonedScene ? (
        <primitive object={clonedScene} scale={0.5} rotation={[0, 0, 0]} />
      ) : (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
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
// Main Heli Game Component
// ==========================================
export default function HeliGame({ poseState, onGameOver, onScoreUpdate }: {
  poseState: HeliPoseState;
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
}) {
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [shake, setShake] = useState(false);
  const score = useRef(0);
  const nextObstacleId = useRef(0);
  
  const lane = poseState.lane;
  const isFlying = poseState.isFlying;
  const currentSpeed = isFlying ? FORWARD_SPEED : 0;
  
  // Start game when user first flies
  useEffect(() => {
    if (isFlying && !hasStarted) {
      setHasStarted(true);
    }
  }, [isFlying, hasStarted]);

  // Game Loop (Spawning & Scoring)
  useEffect(() => {
    if (!hasStarted) return;

    const interval = setInterval(() => {
      if (!isFlying) return;

      // Spawn new obstacle (Flamingo)
      const randomLane = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      setObstacles((prev) => [
        ...prev,
        { id: nextObstacleId.current++, lane: randomLane, z: OBSTACLE_SPAWN_Z }
      ]);
    }, 1200);

    return () => clearInterval(interval);
  }, [isFlying]);

  const removeObstacle = (id: number) => {
    setObstacles((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <Canvas camera={{ position: [0, 5, 8], fov: 60 }}>
      <CustomFPS />
      {shake && (
        <CameraShake
          maxYaw={0.1} // Max amount camera can yaw in either direction
          maxPitch={0.1} // Max amount camera can pitch in either direction
          maxRoll={0.1} // Max amount camera can roll in either direction
          yawFrequency={15} // Frequency of the the yaw rotation
          pitchFrequency={15} // Frequency of the pitch rotation
          rollFrequency={15} // Frequency of the roll rotation
        />
      )}
      
      {/* Dynamic Environment */}
      <color attach="background" args={['#2c3e50']} />
      <fog attach="fog" args={['#2c3e50', 20, 80]} />
      <Sparkles count={500} scale={50} size={4} speed={0.4} opacity={0.3} color="#ffffff" position={[0, 5, -20]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 30, 5]} intensity={1.0} castShadow />
      
      <Environment preset="forest" />

      <HeliPlayer 
        currentLane={lane} 
        isFlying={isFlying}
        onGameOver={onGameOver}
      />

      {obstacles.map((obs) => (
        <FighterJetObstacle
          key={obs.id}
          lane={obs.lane}
          z={obs.z}
          speed={currentSpeed}
          onRemove={() => removeObstacle(obs.id)}
          onHitPlayer={() => {
            setShake(true);
            setTimeout(() => setShake(false), 500);
          }}
          onPass={() => {
            score.current += 10;
            onScoreUpdate(score.current);
          }}
          playerLane={lane}
          playerY={2} // Approximated helicopter height
        />
      ))}

      {/* Cloud Background */}
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud segments={40} bounds={[10, 2, 2]} volume={10} color="white" position={[0, -5, -40]} />
        <Cloud segments={40} bounds={[10, 2, 2]} volume={10} color="white" position={[-15, 0, -60]} />
        <Cloud segments={40} bounds={[10, 2, 2]} volume={10} color="white" position={[15, 5, -50]} />
        <Cloud segments={40} bounds={[10, 2, 2]} volume={10} color="white" position={[0, -10, 0]} />
      </Clouds>
      
      {/* <ForestGround speed={currentSpeed} /> Disabled to fly in the clouds */}
    </Canvas>
  );
}
