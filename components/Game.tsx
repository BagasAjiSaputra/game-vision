"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Box, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { PoseState } from "./PoseController";

// Constants
const LANE_WIDTH = 2.5;
const GRAVITY = -26;
const JUMP_VELOCITY = 10.5;
const INITIAL_FORWARD_SPEED = 16;
const OBSTACLE_SPAWN_Z = -55;
const DESPAWN_Z = 12;
const JETPACK_HEIGHT = 6.5;

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

  playJetpack() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
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
  isJetpackActive,
  isMagnetActive,
  isWalking,
  onPlayerPosUpdate
}: {
  currentLane: number;
  isJumping: boolean;
  isSliding: boolean;
  isJetpackActive: boolean;
  isMagnetActive: boolean;
  isWalking: boolean;
  onPlayerPosUpdate: (pos: THREE.Vector3) => void;
}) {
  const group = useRef<THREE.Group>(null);
  
  let model: any = null;
  try {
    model = useGLTF("/models/soldier.glb");
  } catch (e) {
    // fallback mesh used
  }

  const { actions } = useAnimations(model ? model.animations : [], group);

  useEffect(() => {
    if (!actions) return;
    const animName = isWalking ? "Walk" : "Idle";
    const actionToPlay = actions[animName] || actions["Run"] || Object.values(actions)[0];
    
    if (actionToPlay) {
      actionToPlay.reset().fadeIn(0.2).play();
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
    if (isJumping && !prevJumping.current && !isJetpackActive) {
      sounds.playJump();
    }
    prevJumping.current = isJumping;
  }, [isJumping, isJetpackActive]);

  useEffect(() => {
    if (isSliding && !prevSliding.current && !isJetpackActive) {
      sounds.playSlide();
    }
    prevSliding.current = isSliding;
  }, [isSliding, isJetpackActive]);

  useFrame((state, delta) => {
    if (!group.current) return;

    // Lateral Movement (Smooth lane changing)
    group.current.position.x = THREE.MathUtils.lerp(
      group.current.position.x,
      targetX,
      12 * delta
    );

    // Jetpack Flying Logic
    if (isJetpackActive) {
      posY.current = THREE.MathUtils.lerp(posY.current, JETPACK_HEIGHT, 5 * delta);
      velocityY.current = 0;
    } else {
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
    }

    group.current.position.y = posY.current;

    // Slide scaling
    if (isSliding && !isJetpackActive && posY.current <= 0.1) {
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
        <primitive object={model.scene} scale={1.2} position={[0, -0.5, 0]} rotation={[0, 0, 0]} />
      ) : (
        <Box args={[1, 2, 1]} position={[0, 1, 0]}>
          <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.3} />
        </Box>
      )}

      {/* Jetpack Visual Effect */}
      {isJetpackActive && (
        <group position={[0, 1.2, -0.3]}>
          <mesh position={[-0.3, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.12, 0.6, 12]} />
            <meshStandardMaterial color="#333333" metalness={0.9} />
          </mesh>
          <mesh position={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.12, 0.6, 12]} />
            <meshStandardMaterial color="#333333" metalness={0.9} />
          </mesh>
          {/* Flame Jets */}
          <mesh position={[-0.3, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.15, 0.5, 12]} />
            <meshBasicMaterial color="#ffaa00" />
          </mesh>
          <mesh position={[0.3, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.15, 0.5, 12]} />
            <meshBasicMaterial color="#ffaa00" />
          </mesh>
          <pointLight color="#ffaa00" intensity={3} distance={5} />
        </group>
      )}

      {/* Magnet Active Aura */}
      {isMagnetActive && (
        <mesh position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.08, 16, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// ==========================================
// Coins & Collectibles Components
// ==========================================
interface CoinData {
  id: number;
  lane: number;
  z: number;
  y: number;
}

function CoinItem({
  lane,
  z,
  y,
  speed,
  isMagnetActive,
  playerPos,
  onCollect,
  onRemove
}: {
  lane: number;
  z: number;
  y: number;
  speed: number;
  isMagnetActive: boolean;
  playerPos: THREE.Vector3;
  onCollect: () => void;
  onRemove: () => void;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;

    // Movement forward
    ref.current.position.z += speed * delta;

    // Magnet Pulling Effect
    if (isMagnetActive && ref.current.position.z > -25) {
      const targetPos = new THREE.Vector3(playerPos.x, playerPos.y + 0.8, playerPos.z);
      ref.current.position.lerp(targetPos, 14 * delta);
    }

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

// Powerup Item (Magnet / Jetpack)
interface PowerupData {
  id: number;
  type: "magnet" | "jetpack";
  lane: number;
  z: number;
}

function PowerupItem({
  type,
  lane,
  z,
  speed,
  playerPos,
  onCollect,
  onRemove
}: {
  type: "magnet" | "jetpack";
  lane: number;
  z: number;
  speed: number;
  playerPos: THREE.Vector3;
  onCollect: () => void;
  onRemove: () => void;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;

    ref.current.position.z += speed * delta;
    ref.current.rotation.y += 3 * delta;

    if (ref.current.position.z > DESPAWN_Z) {
      onRemove();
      return;
    }

    const distance = ref.current.position.distanceTo(playerPos);
    if (distance < 1.5) {
      if (type === "magnet") sounds.playMagnet();
      else sounds.playJetpack();
      onCollect();
    }
  });

  return (
    <group ref={ref} position={[lane * LANE_WIDTH, 0.8, z]}>
      {type === "magnet" ? (
        <mesh>
          <torusGeometry args={[0.4, 0.15, 16, 16, Math.PI]} />
          <meshStandardMaterial color="#f43f5e" metalness={0.8} roughness={0.2} emissive="#f43f5e" emissiveIntensity={0.5} />
        </mesh>
      ) : (
        <mesh>
          <boxGeometry args={[0.5, 0.7, 0.4]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} emissive="#38bdf8" emissiveIntensity={0.5} />
        </mesh>
      )}
      <pointLight color={type === "magnet" ? "#f43f5e" : "#38bdf8"} intensity={2} distance={3} />
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
  isJetpackActive
}: {
  type: ObstacleType;
  lane: number;
  z: number;
  speed: number;
  onRemove: () => void;
  onHitPlayer: () => void;
  playerPos: THREE.Vector3;
  isSliding: boolean;
  isJetpackActive: boolean;
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

    // If Jetpack is active, player flies high above all ground obstacles
    if (isJetpackActive) return;

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
        onHitPlayer();
      }
    }
  });

  return (
    <group ref={ref} position={[lane * LANE_WIDTH, 0, z]}>
      {type === "low" && (
        /* Low Wooden Hurdle Barrier */
        <group position={[0, 0.4, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2.2, 0.7, 0.3]} />
            <meshStandardMaterial color="#d97706" roughness={0.7} />
          </mesh>
          <mesh position={[-0.9, -0.2, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
          <mesh position={[0.9, -0.2, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        </group>
      )}

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

      {type === "full" && (
        /* Full Turret / Cargo Crate */
        <group position={[0, 0.9, 0]}>
          <mesh>
            <boxGeometry args={[2.0, 1.8, 1.8]} />
            <meshStandardMaterial color="#4b5563" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 1.0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.8, 16]} />
            <meshStandardMaterial color="#1f2937" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.5, 1.45]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      )}
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

  // Surrounding Ground Tarmac
  const surroundingTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#0f172a";
      context.fillRect(0, 0, 256, 256);
      context.strokeStyle = "#1e293b";
      context.lineWidth = 2;
      context.strokeRect(0, 0, 256, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(40, 40);
    return tex;
  }, []);

  useFrame((state, delta) => {
    if (runwayTex) runwayTex.offset.y += (speed / 6) * delta;
    if (surroundingTex) surroundingTex.offset.y += (speed / 6) * delta;
  });

  return (
    <group position={[0, -0.5, -25]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Vast Surrounding Tarmac */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial map={surroundingTex} roughness={0.9} />
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
function DynamicCamera({ isJetpackActive, playerPos }: { isJetpackActive: boolean; playerPos: THREE.Vector3 }) {
  const { camera } = useThree();

  useFrame((state, delta) => {
    const targetY = isJetpackActive ? 10 : 4.5;
    const targetZ = isJetpackActive ? 9.5 : 6.5;
    const targetX = playerPos.x * 0.4;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 5 * delta);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 4 * delta);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 4 * delta);
    camera.lookAt(playerPos.x * 0.3, isJetpackActive ? 5 : 1.5, -8);
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
  onPowerupUpdate
}: {
  poseState: PoseState;
  onGameOver: () => void;
  onScoreUpdate: (score: number) => void;
  onCoinsUpdate: (coins: number) => void;
  onPowerupUpdate: (magnetTime: number, jetpackTime: number) => void;
}) {
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [powerups, setPowerups] = useState<PowerupData[]>([]);

  const [playerPos, setPlayerPos] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const [magnetTimer, setMagnetTimer] = useState<number>(0);
  const [jetpackTimer, setJetpackTimer] = useState<number>(0);

  const scoreRef = useRef(0);
  const coinsRef = useRef(0);

  const nextObstacleId = useRef(0);
  const nextCoinId = useRef(0);
  const nextPowerupId = useRef(0);

  const lane = poseState.lane;
  const isWalking = poseState.isWalking;
  const isJumping = poseState.isJumping;
  const isSliding = poseState.isSliding;

  const isJetpackActive = jetpackTimer > 0;
  const isMagnetActive = magnetTimer > 0;

  const [currentSpeed, setCurrentSpeed] = useState(INITIAL_FORWARD_SPEED);

  // Speed acceleration over time
  useEffect(() => {
    if (!isWalking) return;
    const accelInterval = setInterval(() => {
      setCurrentSpeed((prev) => Math.min(32, prev + 0.3));
    }, 1000);
    return () => clearInterval(accelInterval);
  }, [isWalking]);

  // Powerup timers countdown
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setMagnetTimer((prev) => Math.max(0, prev - 1));
      setJetpackTimer((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    onPowerupUpdate(magnetTimer, jetpackTimer);
  }, [magnetTimer, jetpackTimer, onPowerupUpdate]);

  // Game Loop (Spawning & Scoring)
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (!isWalking) return;

      // Update distance score
      scoreRef.current += 15;
      onScoreUpdate(scoreRef.current);

      // Spawn Obstacles (Only if not jetpacking)
      if (!isJetpackActive && Math.random() > 0.25) {
        const types: ObstacleType[] = ["low", "high", "full"];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomLane = Math.floor(Math.random() * 3) - 1;

        setObstacles((prev) => [
          ...prev,
          { id: nextObstacleId.current++, type: randomType, lane: randomLane, z: OBSTACLE_SPAWN_Z }
        ]);
      }

      // Spawn Coins
      const coinLane = Math.floor(Math.random() * 3) - 1;
      const coinY = isJetpackActive ? JETPACK_HEIGHT : 0.6;
      for (let i = 0; i < 3; i++) {
        setCoins((prev) => [
          ...prev,
          { id: nextCoinId.current++, lane: coinLane, z: OBSTACLE_SPAWN_Z - (i * 3), y: coinY }
        ]);
      }

      // Spawn Powerups randomly
      if (Math.random() > 0.75) {
        const pType: "magnet" | "jetpack" = Math.random() > 0.5 ? "magnet" : "jetpack";
        const pLane = Math.floor(Math.random() * 3) - 1;
        setPowerups((prev) => [
          ...prev,
          { id: nextPowerupId.current++, type: pType, lane: pLane, z: OBSTACLE_SPAWN_Z - 5 }
        ]);
      }

    }, 1400);

    return () => clearInterval(spawnInterval);
  }, [isWalking, isJetpackActive, onScoreUpdate]);

  const handleCollectCoin = (id: number) => {
    setCoins((prev) => prev.filter((c) => c.id !== id));
    coinsRef.current += 1;
    onCoinsUpdate(coinsRef.current);
    scoreRef.current += 50;
    onScoreUpdate(scoreRef.current);
  };

  const handleCollectPowerup = (id: number, type: "magnet" | "jetpack") => {
    setPowerups((prev) => prev.filter((p) => p.id !== id));
    if (type === "magnet") {
      setMagnetTimer(9);
    } else {
      setJetpackTimer(8);
    }
  };

  const handleHitObstacle = () => {
    // Subtract score penalty on collision instead of triggering Game Over
    scoreRef.current = Math.max(0, scoreRef.current - 100);
    onScoreUpdate(scoreRef.current);
  };

  return (
    <Canvas camera={{ position: [0, 4.5, 6.5], fov: 60 }}>
      {/* Fog atmosphere for horizon blending */}
      <fog attach="fog" args={["#0f172a", 20, 75]} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[15, 25, 10]} intensity={1.3} castShadow />
      
      <Environment preset="night" />

      <DynamicCamera isJetpackActive={isJetpackActive} playerPos={playerPos} />

      <Player
        currentLane={lane}
        isJumping={isJumping}
        isSliding={isSliding}
        isJetpackActive={isJetpackActive}
        isMagnetActive={isMagnetActive}
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
          isJetpackActive={isJetpackActive}
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
          isMagnetActive={isMagnetActive}
          playerPos={playerPos}
          onCollect={() => handleCollectCoin(coin.id)}
          onRemove={() => setCoins((prev) => prev.filter((c) => c.id !== coin.id))}
        />
      ))}

      {/* Powerups */}
      {powerups.map((p) => (
        <PowerupItem
          key={p.id}
          type={p.type}
          lane={p.lane}
          z={p.z}
          speed={isWalking ? currentSpeed : 0}
          playerPos={playerPos}
          onCollect={() => handleCollectPowerup(p.id, p.type)}
          onRemove={() => setPowerups((prev) => prev.filter((item) => item.id !== p.id))}
        />
      ))}

      <EndlessGround speed={isWalking ? currentSpeed : 0} />
    </Canvas>
  );
}

