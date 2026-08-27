"use client";

import { useEffect, useRef, useState } from "react";
import { BasketPoseState } from "./BasketPoseController";

interface BasketGameProps {
  poseState: BasketPoseState | null;
  onScoreUpdate: (score: number) => void;
  onMiss?: () => void;
}

export default function BasketGame({ poseState, onScoreUpdate, onMiss }: BasketGameProps) {
  const [score, setScore] = useState(0);
  const localScoreRef = useRef(0);
  const [gameState, setGameState] = useState<"playing" | "scored" | "missed">("playing");
  
  const requestRef = useRef<number>(0);
  const hoopRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLImageElement>(null);
  const leftHandRef = useRef<HTMLDivElement>(null);
  const rightHandRef = useRef<HTMLDivElement>(null);

  // Game state refs for animation loop
  const hoopX = useRef(50); // percentage
  const hoopDirection = useRef(1); // 1 for right, -1 for left
  const hoopSpeed = useRef(0.2); // speed of hoop

  const isBallThrown = useRef(false);
  const throwProgress = useRef(0);
  const throwStartX = useRef(50);
  const throwStartY = useRef(85);
  const throwTargetX = useRef(50);
  const throwTargetY = useRef(20); // hoop level

  const hasFiredThisJump = useRef(false);

  // Crosshair smooth movement
  const currentAimX = useRef(50);

  const update = () => {
    // 1. Update Hoop position
    hoopX.current += hoopDirection.current * hoopSpeed.current;
    if (hoopX.current > 85) {
      hoopX.current = 85;
      hoopDirection.current = -1;
    } else if (hoopX.current < 15) {
      hoopX.current = 15;
      hoopDirection.current = 1;
    }

    if (hoopRef.current) {
      hoopRef.current.style.left = `${hoopX.current}%`;
    }

    // 2. Smooth Aim
    if (poseState) {
      const targetAimX = poseState.aimX * 100;
      currentAimX.current += (targetAimX - currentAimX.current) * 0.1; // easing
    }

    // 3. Trigger Shoot
    if (poseState && poseState.isJumping && poseState.isShooting && !isBallThrown.current && !hasFiredThisJump.current) {
      isBallThrown.current = true;
      hasFiredThisJump.current = true;
      throwProgress.current = 0;
      throwTargetX.current = currentAimX.current;
      setGameState("playing");
    }

    // Reset fire lock when not jumping/shooting
    if (poseState && !poseState.isJumping && !poseState.isShooting) {
      hasFiredThisJump.current = false;
    }

    // 4. Update Ball position
    if (isBallThrown.current && ballRef.current) {
      throwProgress.current += 0.025; // throwing speed

      if (throwProgress.current <= 1) {
        // Simple linear interpolation with a slight arc (parabola for Y)
        const t = throwProgress.current;
        const currentX = throwStartX.current + (throwTargetX.current - throwStartX.current) * t;
        
        // Arc: starts at 0, peaks at 0.5, ends at 0. We add this to Y to simulate arc.
        const arc = Math.sin(t * Math.PI) * 15; 
        const currentY = throwStartY.current + (throwTargetY.current - throwStartY.current) * t - arc;
        
        const scale = 1 - (0.5 * t); // ball gets smaller as it goes further

        ballRef.current.style.left = `${currentX}%`;
        ballRef.current.style.top = `${currentY}%`;
        ballRef.current.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${t * 360}deg)`;
      } else if (throwProgress.current > 1 && throwProgress.current < 1.05) {
        // Reached target! Evaluate score
        const distanceToHoop = Math.abs(throwTargetX.current - hoopX.current);
        if (distanceToHoop < 8) { // Tolerance percentage
          setGameState("scored");
          localScoreRef.current += 1;
          setScore(localScoreRef.current);
          onScoreUpdate(localScoreRef.current);
          // Increase speed slightly
          hoopSpeed.current = Math.min(0.8, hoopSpeed.current + 0.05);
        } else {
          setGameState("missed");
          if (onMiss) onMiss();
        }
        throwProgress.current = 2.1; // Move to end state
      } else if (throwProgress.current > 2) {
         // Reset ball after a delay
         setTimeout(() => {
           isBallThrown.current = false;
           setGameState("playing"); // Clear the "SWISH" or "MISSED" text
           if (ballRef.current) {
             ballRef.current.style.left = `50%`;
             ballRef.current.style.top = `85%`;
             ballRef.current.style.transform = `translate(-50%, -50%) scale(1)`;
           }
         }, 1000);
         throwProgress.current = 1.1; // prevent re-evaluation
      }
    } else if (ballRef.current && !isBallThrown.current) {
      // Idle ball follows aim slightly or stays at bottom
       ballRef.current.style.left = `${50 + (currentAimX.current - 50) * 0.2}%`;
       ballRef.current.style.top = `85%`;
       ballRef.current.style.transform = `translate(-50%, -50%) scale(1)`;
    }

    // 5. Update Hands POV Animation
    if (leftHandRef.current && rightHandRef.current) {
      if (!isBallThrown.current) {
        // Idle
        leftHandRef.current.style.opacity = '1';
        rightHandRef.current.style.opacity = '1';
        
        // Track aim slightly
        const aimOffset = (currentAimX.current - 50) * 0.2;
        leftHandRef.current.style.left = `${45 + aimOffset}%`;
        leftHandRef.current.style.top = `90%`;
        leftHandRef.current.style.transform = `translate(-50%, -50%) rotate(-15deg) scale(1)`;

        rightHandRef.current.style.left = `${55 + aimOffset}%`;
        rightHandRef.current.style.top = `90%`;
        rightHandRef.current.style.transform = `translate(-50%, -50%) rotate(15deg) scale(1)`;
      } else {
        // Throwing animation
        const t = throwProgress.current; // 0 to 1
        
        if (t < 0.25) {
          // Move up with the ball
          const handY = 90 - (t * 120); // move up fast
          const handScale = 1 - (t * 1.5);
          
          leftHandRef.current.style.top = `${handY}%`;
          leftHandRef.current.style.transform = `translate(-50%, -50%) rotate(-15deg) scale(${handScale})`;
          
          rightHandRef.current.style.top = `${handY}%`;
          rightHandRef.current.style.transform = `translate(-50%, -50%) rotate(15deg) scale(${handScale})`;
          
          // Fade out quickly
          const opacity = Math.max(0, 1 - (t / 0.25));
          leftHandRef.current.style.opacity = opacity.toString();
          rightHandRef.current.style.opacity = opacity.toString();
        } else {
          // Fully faded
          leftHandRef.current.style.opacity = '0';
          rightHandRef.current.style.opacity = '0';
        }
      }
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [poseState]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* Background Image/Texture */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/assets/basket/court_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom'
        }}
      />
      
      {/* Dark overlay to make UI pop */}
      <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />

      {/* Court floor styling */}
      <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-[#c5793a] to-transparent opacity-80" />

      {/* Score */}
      <div className="absolute top-6 left-6 z-10 bg-black/60 px-6 py-3 rounded-2xl border-2 border-orange-500 backdrop-blur-md">
        <p className="text-orange-400 font-bold text-sm tracking-widest uppercase">Score</p>
        <p className="text-5xl font-black text-white">{score}</p>
      </div>

      {/* Game State Overlay */}
      {gameState === "scored" && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <p className="text-6xl font-black text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]">GOAL!</p>
        </div>
      )}
      {gameState === "missed" && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-20 animate-pulse">
          <p className="text-6xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">GAGAL!</p>
        </div>
      )}

      {/* Hoop (Using CSS to draw a simple hoop) */}
      <div 
        ref={hoopRef}
        className="absolute top-[20%] -translate-x-1/2 -translate-y-1/2 w-40 h-32 z-0"
      >
        {/* Backboard */}
        <div className="absolute inset-0 bg-white/90 border-4 border-gray-300 rounded-lg shadow-xl flex items-end justify-center pb-4">
          <div className="w-16 h-12 border-4 border-red-500" />
        </div>
        {/* Rim */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 border-4 border-orange-600 rounded-[50%] z-20" />
        {/* Net */}
        <div className="absolute top-[80%] left-1/2 -translate-x-1/2 w-16 h-16 border-x-2 border-b-2 border-dashed border-gray-300 rounded-b-xl z-10" />
      </div>

      {/* Crosshair (Aiming) */}
      <div 
        className="absolute top-[20%] w-12 h-12 border-2 border-dashed border-cyan-400 rounded-full z-10 transition-transform duration-100 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ left: `${currentAimX.current}%` }}
      >
        <div className="w-1 h-1 bg-cyan-400 rounded-full" />
      </div>

      {/* Basketball */}
      <img
        ref={ballRef}
        src="/assets/basket/ball.png"
        alt="Basketball"
        className="absolute w-28 h-28 object-contain z-40 drop-shadow-2xl"
        style={{
          left: '50%',
          top: '85%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* POV Hands */}
      <div 
        ref={leftHandRef}
        className="absolute z-40 text-[100px] select-none pointer-events-none drop-shadow-2xl transition-opacity duration-75"
        style={{ left: '45%', top: '90%', transform: 'translate(-50%, -50%) rotate(-15deg)' }}
      >
        ✋🏽
      </div>
      <div 
        ref={rightHandRef}
        className="absolute z-40 text-[100px] select-none pointer-events-none drop-shadow-2xl transition-opacity duration-75"
        style={{ left: '55%', top: '90%', transform: 'translate(-50%, -50%) rotate(15deg) scaleX(-1)' }}
      >
        ✋🏽
      </div>

    </div>
  );
}
