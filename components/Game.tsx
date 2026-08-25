"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Box, useAnimations, Html, Clone } from "@react-three/drei";
import * as THREE from "three";
import { PoseState } from "./PoseController";

// Constants
const LANE_WIDTH = 2.5;
const GRAVITY = -26;
const JUMP_VELOCITY = 10.5;
const INITIAL_FORWARD_SPEED = 10;
const OBSTACLE_SPAWN_Z = -55;
const DESPAWN_Z = 12;

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
// Web Audio Sound Effects Manager
// ==========================================
class SoundManager {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playCoin() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.1); // E6
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playMagnet() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playSlide() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(130, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playCrash() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

const sounds = new SoundManager();

// ==========================================
// Player Component
// ==========================================
function Player({
  currentLane,
  isJumping,
  isSliding,
    isWalking,
  onPlayerPosUpdate
}: {
  currentLane: number;
  isJumping: boolean;
  isSliding: boolean;
    isWalking: boolean;
  onPlayerPosUpdate: (pos: THREE.Vector3) => void;
}) {
  const group = useRef<THREE.Group>(null);
  
  const model = useGLTF("/models/character.glb") as any;

  const { actions } = useAnimations(model ? model.animations : [], group);

  useEffect(() => {
    if (!actions) return;
    const animName = isWalking ? "Running" : "Idle";
    const actionToPlay = actions[animName] || actions["Walking"] || Object.values(actions)[0];
    
    if (actionToPlay) {
      actionToPlay.reset().fadeIn(0.2).play();
      if (isWalking) {
        actionToPlay.setEffectiveTimeScale(1.5);
      } else {
        actionToPlay.setEffectiveTimeScale(1.0);
      }
      return () => { actionToPlay.fadeOut(0.2); };
    }
  }, [actions, isWalking]);

  const velocityY = useRef(0);
  const posY = useRef(0);
  const targetX = currentLane * LANE_WIDTH;

  // Sound triggers
  const prevJumping = useRef(false);
  const prevSliding = useRef(false);

  useEffect(() => {
    if (isJumping && !prevJumping.current) {
      sounds.playJump();
    }
    prevJumping.current = isJumping;
  }, [isJumping]);

  useEffect(() => {
    if (isSliding && !prevSliding.current) {
      sounds.playSlide();
    }
    prevSliding.current = isSliding;
  }, [isSliding]);

  useFrame((state, delta) => {
    if (!group.current) return;

    // Lateral Movement (Smooth lane changing)
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      targetX,
      12 * delta
    );

    // Jumping Logic
    if (isJumping && posY.current <= 0.05) {
      velocityY.current = JUMP_VELOCITY;
    }

    if (posY.current > 0 || velocityY.current !== 0) {
      velocityY.current += GRAVITY * delta;
      posY.current += velocityY.current * delta;

      if (posY.current <= 0) {
        posY.current = 0;
        velocityY.current = 0;
      }
    }

    group.current.position.y = posY.current;

    // Slide scaling
    if (isSliding && posY.current <= 0.1) {
      group.current.scale.y = THREE.MathUtils.lerp(group.current.scale.y, 0.45, 15 * delta);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.35, 15 * delta);
    } else {
      group.current.scale.y = THREE.MathUtils.lerp(group.current.scale.y, 1.0, 15 * delta);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0.0, 15 * delta);
    }

    // Bobbing motion when walking/running
    if (posY.current === 0 && !actions && isWalking) {
      group.current.position.y = Math.sin(state.clock.elapsedTime * 15) * 0.05;
    }

    onPlayerPosUpdate(group.current.position.clone());
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {model && model.scene ? (
        <primitive object={model.scene} scale={0.4} position={[0, -0.5, 0]} rotation={[0, Math.PI, 0]} />
      ) : (
        <Box args={[1, 2, 1]} position={[0, 1, 0]}>
          <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.3} />
        </Box>
      )}
    </group>
  );
}

interface CoinData {
  id: number;
  lane: number;
  z: number;
  y: number;
}

// ==========================================
// Coin Item Component
// ==========================================
function CoinItem({
  lane,
  z,
  y,
  speed,
  onRemove,
  onCollect,
  playerPos
}: {
  lane: number;
  z: number;
  y: number;
  speed: number;
  onRemove: () => void;
  onCollect: () => void;
  playerPos: THREE.Vector3;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Movement forward
    ref.current.position.z += speed * delta;

    
    // Spin animation
    ref.current.rotation.y += 4 * delta;

    // Despawn check
    if (ref.current.position.z > DESPAWN_Z) {
      onRemove();
      return;
    }

    // Collision check with player
    const distance = ref.current.position.distanceTo(playerPos);
    if (distance < 1.4) {
      sounds.playCoin();
      onCollect();
    }
  });

  return (
    <group ref={ref} position={[lane * LANE_WIDTH, y, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#ffaa00" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ==========================================
// Obstacles Component
// ==========================================
type ObstacleType = "low" | "high" | "full";

interface ObstacleData {
  id: number;
  type: ObstacleType;
  lane: number;
  z: number;
}


function Obstacle({
  type,
  lane,
  z,
  speed,
  onRemove,
  onHitPlayer,
  playerPos,
  isSliding,
}: {
  type: ObstacleType;
  lane: number;
  z: number;
  speed: number;
  onRemove: () => void;
  onHitPlayer: (type: ObstacleType) => void;
  playerPos: THREE.Vector3;
  isSliding: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const hitTriggered = useRef(false);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.z += speed * delta;

    if (ref.current.position.z > DESPAWN_Z) {
      onRemove();
      return;
    }

    // Collision Detection Logic
    const obZ = ref.current.position.z;
    const obX = lane * LANE_WIDTH;
    const pX = playerPos.x;
    const pY = playerPos.y;

    if (!hitTriggered.current && Math.abs(obZ - playerPos.z) < 0.9 && Math.abs(obX - pX) < 1.0) {
      let isHit = false;

      if (type === "low") {
        // Low obstacle: Jump over it (pY > 1.2 avoids it)
        if (pY < 1.1) isHit = true;
      } else if (type === "high") {
        // High obstacle: Slide under it (isSliding avoids it)
        if (!isSliding && pY < 2.0) isHit = true;
      } else if (type === "full") {
        // Full obstacle: Must change lane
        if (pY < 2.5) isHit = true;
      }

      if (isHit) {
        hitTriggered.current = true;
        sounds.playCrash();
        onHitPlayer(type);
      }
    }
  });

  return (
    <group ref={ref} position={[lane * LANE_WIDTH, 0, z]}>
      

      {type === "high" && (
        /* High Overhead Barricade Signboard */
        <group position={[0, 2.2, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.4, 0.8, 0.3]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} emissive="#991b1b" emissiveIntensity={0.3} />
          </mesh>
          {/* Side support posts */}
          <mesh position={[-1.1, -1.0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2.0, 12]} />
            <meshStandardMaterial color="#374151" metalness={0.8} />
          </mesh>
          <mesh position={[1.1, -1.0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 2.0, 12]} />
            <meshStandardMaterial color="#374151" metalness={0.8} />
          </mesh>
        </group>
      )}


    </group>
  );
}

// ==========================================
// City Scenery Component
// ==========================================
function BuildingMesh({ b, windowTex, brickTex }: { b: any; windowTex: THREE.Texture; brickTex: THREE.Texture }) {
  const map = useMemo(() => {
    const tex = windowTex.clone();
    tex.repeat.set(Math.ceil(b.width / 6), Math.ceil(b.height / 6));
    tex.needsUpdate = true;
    return tex;
  }, [windowTex, b.width, b.height]);

  const bMap = useMemo(() => {
    const tex = brickTex.clone();
    tex.repeat.set(Math.ceil(b.width / 4), Math.ceil(b.height / 4));
    tex.needsUpdate = true;
    return tex;
  }, [brickTex, b.width, b.height]);

  if (b.type === "skyscraper") {
    return (
      <group position={[b.x, 0, 0]}>
        <mesh position={[0, b.height / 2, 0]}>
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color={b.color} metalness={0.9} roughness={0.1} map={map} />
        </mesh>
        <mesh position={[0, b.height + 2, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 4]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </group>
    );
  }

  if (b.type === "house") {
    return (
      <group position={[b.x, 0, 0]}>
        <mesh position={[0, b.height / 2, 0]}>
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color={b.color} roughness={0.9} map={bMap} />
        </mesh>
        <mesh position={[0, b.height + 1.5, 0]} rotation={[0, Math.PI/4, 0]}>
          <cylinderGeometry args={[0, b.width * 0.8, 3, 4]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  if (b.type === "store") {
    return (
      <group position={[b.x, 0, 0]}>
        <mesh position={[0, b.height / 2, 0]}>
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color={b.color} roughness={0.9} />
        </mesh>
        <mesh position={[b.isLeft ? 1 : -1, 2, 0]}>
          <boxGeometry args={[b.width + 0.1, 3, b.depth - 2]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[b.isLeft ? 1 : -1, 4, 0]}>
          <boxGeometry args={[b.width + 0.2, 1, b.depth - 1]} />
          <meshStandardMaterial color="#ef4444" roughness={0.8} />
        </mesh>
      </group>
    );
  }

  // Apartment
  return (
    <group position={[b.x, 0, 0]}>
      <mesh position={[0, b.height / 2, 0]}>
        <boxGeometry args={[b.width, b.height, b.depth]} />
        <meshStandardMaterial color={b.color} roughness={0.8} map={map} />
      </mesh>
      <mesh position={[0, b.height + 0.5, 0]}>
        <boxGeometry args={[b.width + 1.5, 1, b.depth + 1.5]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
    </group>
  );
}

function CityScenery({ speed }: { speed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const windowTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = "#0f172a";
      for (let y = 32; y < 512; y += 80) {
        for (let x = 32; x < 512; x += 80) {
          ctx.fillRect(x, y, 40, 50);
          ctx.fillStyle = "#cbd5e1";
          ctx.fillRect(x + 18, y, 4, 50);
          ctx.fillRect(x, y + 25, 40, 4);
          ctx.fillStyle = "#0f172a";
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  const brickTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "#cccccc";
      for (let y = 0; y < 128; y += 16) {
        ctx.fillRect(0, y, 128, 2);
        const offsetX = (y / 16) % 2 === 0 ? 0 : 16;
        for (let x = 0; x < 128; x += 32) {
          ctx.fillRect(x + offsetX, y, 2, 16);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);

  const initBuildings = useMemo(() => {
    const arr = [];
    let currentLeftZ = 50;
    let currentRightZ = 50;
    const colors = ["#f8fafc", "#e2e8f0", "#cbd5e1", "#fef3c7", "#e0f2fe", "#f1f5f9"];
    const types = ["skyscraper", "apartment", "store", "house"];

    const generateBuilding = (isLeft: boolean, zStart: number) => {
      const type = types[Math.floor(Math.random() * types.length)];
      let height = 20;
      let width = 10 + Math.random() * 10;
      let depth = 15 + Math.random() * 15;
      
      if (type === "skyscraper") {
        height = 50 + Math.random() * 50;
        width = 15 + Math.random() * 10;
        depth = 15 + Math.random() * 10;
      } else if (type === "house") {
        height = 10 + Math.random() * 5;
        width = 10 + Math.random() * 5;
      } else if (type === "store") {
        height = 12 + Math.random() * 8;
      } else {
        height = 20 + Math.random() * 30; // apartment
      }

      return {
        isLeft,
        type,
        width,
        depth,
        height,
        color: colors[Math.floor(Math.random() * colors.length)],
        z: zStart - depth / 2,
        x: isLeft ? (-12 - width / 2) : (12 + width / 2)
      };
    };

    for (let i = 0; i < 40; i++) {
      const leftB = generateBuilding(true, currentLeftZ);
      arr.push(leftB);
      currentLeftZ -= leftB.depth;

      const rightB = generateBuilding(false, currentRightZ);
      arr.push(rightB);
      currentRightZ -= rightB.depth;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    let minLeftZ = 1000;
    let minLeftDepth = 0;
    let minRightZ = 1000;
    let minRightDepth = 0;
    
    groupRef.current.children.forEach((grp: any) => {
       if (grp.userData.isLeft && grp.position.z < minLeftZ) {
         minLeftZ = grp.position.z;
         minLeftDepth = grp.userData.depth;
       }
       if (!grp.userData.isLeft && grp.position.z < minRightZ) {
         minRightZ = grp.position.z;
         minRightDepth = grp.userData.depth;
       }
    });

    groupRef.current.children.forEach((grp: any) => {
      grp.position.z += speed * delta;
      
      if (grp.position.z - grp.userData.depth / 2 > 60) {
        if (grp.userData.isLeft) {
          grp.position.z = minLeftZ - minLeftDepth / 2 - grp.userData.depth / 2;
          minLeftZ = grp.position.z;
          minLeftDepth = grp.userData.depth;
        } else {
          grp.position.z = minRightZ - minRightDepth / 2 - grp.userData.depth / 2;
          minRightZ = grp.position.z;
          minRightDepth = grp.userData.depth;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {initBuildings.map((b, i) => (
        <group key={i} position={[0, 0, b.z]} userData={{ isLeft: b.isLeft, depth: b.depth }}>
           <BuildingMesh b={b} windowTex={windowTex} brickTex={brickTex} />
        </group>
      ))}
    </group>
  );
}

// ==========================================
// Environment & Ground Component
// ==========================================
function EndlessGround({ speed }: { speed: number }) {
  // Runway Asphalt Texture
  const runwayTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (context) {
      // Dark asphalt base
      context.fillStyle = "#1e293b";
      context.fillRect(0, 0, 512, 512);

      // Red & White kerb stripes on left and right edges
      for (let i = 0; i < 512; i += 64) {
        context.fillStyle = (i / 64) % 2 === 0 ? "#ef4444" : "#ffffff";
        context.fillRect(0, i, 16, 64);
        context.fillRect(496, i, 16, 64);
      }

      // Cyan lane dividers (-1 to 0 lane, 0 to 1 lane)
      context.fillStyle = "#38bdf8";
      context.fillRect(165, 0, 6, 512);
      context.fillRect(341, 0, 6, 512);

      // Yellow center dashed lines
      context.fillStyle = "#fbbf24";
      context.fillRect(250, 0, 12, 200);
      context.fillRect(250, 280, 12, 200);

      // Subtle asphalt noise
      context.fillStyle = "rgba(255, 255, 255, 0.03)";
      for (let j = 0; j < 300; j++) {
        context.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 20);
    return tex;
  }, []);

  // Surrounding Natural Grass Texture
  const surroundingTex = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load("/textures/grass.jpg");
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    return tex;
  }, []);

  useFrame((state, delta) => {
    if (runwayTex) runwayTex.offset.y += (speed / 6) * delta;
    if (surroundingTex) surroundingTex.offset.y += (speed / 6) * delta;
  });

  return (
    <group position={[0, -0.5, -25]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Vast Surrounding Grass */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial map={surroundingTex} roughness={1.0} color="#ffffff" />
      </mesh>

      {/* Main 3-Lane Track */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[9.5, 200]} />
        <meshStandardMaterial map={runwayTex} roughness={0.6} />
      </mesh>
    </group>
  );
}

// Camera Follow Controller
function DynamicCamera({ playerPos }: { playerPos: THREE.Vector3 }) {
  const { camera } = useThree();

  useFrame((state, delta) => {
    const targetY = 4.5;
    const targetZ = 6.5;
    const targetX = playerPos.x * 0.4;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 5 * delta);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 4 * delta);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 4 * delta);
    camera.lookAt(playerPos.x * 0.3, 1.5, -8);
  });

  return null;
}

// ==========================================
// Main Game Component
// ==========================================
export default function Game({
  poseState,
  onGameOver,
  onScoreUpdate,
  onCoinsUpdate,
  }: {
  poseState: PoseState;
  onGameOver: (reason: string) => void;
  onScoreUpdate: (score: number) => void;
  onCoinsUpdate: (coins: number) => void;
  }) {
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [coins, setCoins] = useState<CoinData[]>([]);
  
  const [playerPos, setPlayerPos] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  
  const scoreRef = useRef(0);
  const coinsRef = useRef(0);

  const nextObstacleId = useRef(0);
  const nextCoinId = useRef(0);
  const nextPowerupId = useRef(0);

  const lane = poseState.lane;
  const isWalking = poseState.isWalking;
  const isJumping = poseState.isJumping;
  const isSliding = poseState.isSliding;

  
  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_FORWARD_SPEED);

  // Speed acceleration over time
  useEffect(() => {
    if (!isWalking) return;
    const accelInterval = setInterval(() => {
      setCurrentSpeed((prev) => Math.min(24, prev + 0.15));
    }, 1000);
    return () => clearInterval(accelInterval);
  }, [isWalking]);

  
  // Game Loop (Spawning & Scoring)
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (!isWalking) return;

      // Update distance score
      scoreRef.current += 15;
      onScoreUpdate(scoreRef.current);

      // Spawn Obstacles
      if (Math.random() > 0.25) {
        const types: ObstacleType[] = ["high"];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomLane = Math.floor(Math.random() * 3) - 1;

        setObstacles((prev) => [
          ...prev,
          { id: nextObstacleId.current++, type: randomType, lane: randomLane, z: OBSTACLE_SPAWN_Z }
        ]);
      }

      // Spawn Coins
      const coinLane = Math.floor(Math.random() * 3) - 1;
      const coinY = 0.6;
      for (let i = 0; i < 3; i++) {
        setCoins((prev) => [
          ...prev,
          { id: nextCoinId.current++, lane: coinLane, z: OBSTACLE_SPAWN_Z - (i * 3), y: coinY }
        ]);
      }


    }, 1400);

    return () => clearInterval(spawnInterval);
  }, [isWalking, onScoreUpdate]);

  const handleCollectCoin = (id: number) => {
    setCoins((prev) => prev.filter((c) => c.id !== id));
    coinsRef.current += 1;
    onCoinsUpdate(coinsRef.current);
    scoreRef.current += 50;
    onScoreUpdate(scoreRef.current);
  };

  
  const handleHitObstacle = (type: ObstacleType) => {
    // Trigger Game Over on collision
    let reason = "rintangan";
    if (type === "high") reason = "palang / papan rambu";
    if (type === "full") reason = "kendaraan / benda di jalan";
    if (type === "low") reason = "palang bawah";
    
    onGameOver(reason);
  };

  return (
    <Canvas camera={{ position: [0, 4.5, 6.5], fov: 60 }}>
      <color attach="background" args={["#87ceeb"]} />
      <CustomFPS />
      {/* Fog atmosphere for horizon blending */}
      <fog attach="fog" args={["#87ceeb", 20, 90]} />

      <ambientLight intensity={0.8} />
      <directionalLight position={[15, 25, 10]} intensity={1.5} color="#fff8e7" castShadow />
      
      <Environment preset="city" />

      <DynamicCamera playerPos={playerPos} />

      <Player
        currentLane={lane}
        isJumping={isJumping}
        isSliding={isSliding}
                isWalking={isWalking}
        onPlayerPosUpdate={setPlayerPos}
      />

      {/* Obstacles */}
      {obstacles.map((obs) => (
        <Obstacle
          key={obs.id}
          type={obs.type}
          lane={obs.lane}
          z={obs.z}
          speed={isWalking ? currentSpeed : 0}
          onRemove={() => setObstacles((prev) => prev.filter((o) => o.id !== obs.id))}
          onHitPlayer={handleHitObstacle}
          playerPos={playerPos}
          isSliding={isSliding}
        />
      ))}

      {/* Coins */}
      {coins.map((coin) => (
        <CoinItem
          key={coin.id}
          lane={coin.lane}
          z={coin.z}
          y={coin.y}
          speed={isWalking ? currentSpeed : 0}
                    playerPos={playerPos}
          onCollect={() => handleCollectCoin(coin.id)}
          onRemove={() => setCoins((prev) => prev.filter((c) => c.id !== coin.id))}
        />
      ))}



      <CityScenery speed={isWalking ? currentSpeed : 0} />
      <EndlessGround speed={isWalking ? currentSpeed : 0} />
    </Canvas>
  );
}

