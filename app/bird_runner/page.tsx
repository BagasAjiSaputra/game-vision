"use client";

import { useState } from "react";
import BirdGame from "@/components/BirdGame";
import BirdPoseController, { BirdPoseState } from "@/components/BirdPoseController";
import Link from "next/link";

export default function BirdRunner() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [poseState, setPoseState] = useState<BirdPoseState>({ lane: 0, isFlying: false });

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#111116] text-[#e2e2e2] overflow-hidden relative font-sans">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-center pointer-events-none">
        {isPlaying && (
          <div className="text-xl font-bold bg-white/20 px-4 py-2 rounded-lg backdrop-blur-md shadow text-white">
            SCORE: {score}
          </div>
        )}
      </div>

      {/* Main Menu / Game Over Screen */}
      {!isPlaying && (
        <div className="z-20 w-full max-w-4xl mx-auto px-8 py-16 md:px-24 md:py-20 flex flex-col bg-[#111116] absolute inset-0 overflow-y-auto">
          {/* Logo */}
          <div className="mb-16">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#e2e2e2] lowercase">
              bird runner<span className="text-[#9d72ff]">.</span>
            </h1>
            <div className="w-8 h-[2px] bg-[#9d72ff] mt-2"></div>
          </div>

          {isGameOver && (
            <div className="w-full flex justify-between items-center border-b border-[#222] pb-6 mb-12">
              <div>
                <h3 className="text-[#888] text-sm lowercase mb-1">status</h3>
                <h2 className="text-2xl font-bold text-[#ff4b4b] lowercase">jatuh</h2>
              </div>
              <div className="text-right">
                <h3 className="text-[#888] text-sm lowercase mb-1">skor akhir</h3>
                <h2 className="text-2xl font-bold text-[#e2e2e2] lowercase">{score}</h2>
              </div>
            </div>
          )}

          <div className="w-full flex flex-col mb-12">
            <h3 className="text-[#888] text-sm lowercase mb-6 border-b border-[#222] pb-2">kendali (mediapipe ai)</h3>
            <p className="text-[#888] text-sm mb-4 lowercase">posisikan bahu dan lengan anda di depan kamera.</p>
            <ul className="text-[#e2e2e2] space-y-4 text-xl md:text-2xl lowercase tracking-tight">
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">01</span> <span className="text-[#888] text-sm w-44">rentangkan tangan</span> terbang maju</li>
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">02</span> <span className="text-[#888] text-sm w-44">miring kiri/kanan</span> belok kiri/kanan</li>
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">03</span> <span className="text-[#888] text-sm w-44">turunkan tangan</span> berhenti / melayang</li>
            </ul>
          </div>

          <button
            onClick={startGame}
            className="group flex items-start gap-6 py-8 border-t border-b border-[#222] hover:border-[#444] transition-colors cursor-pointer w-full text-left mt-auto"
          >
            <span className="text-[#9d72ff] font-mono text-xs font-medium w-6 pt-3">00</span>
            <div className="flex-1 flex flex-col">
               <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase text-[#e2e2e2]">{isGameOver ? "terbang lagi" : "mulai terbang"}</h2>
               <p className="text-[#888] text-sm mt-2 lowercase">kepakkan sayapmu.</p>
            </div>
            <span className="text-[#9d72ff] text-xl opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 duration-300 pt-2">→</span>
          </button>
          
          <Link href="/" className="mt-8 text-[#888] text-sm hover:text-[#9d72ff] transition-colors lowercase inline-flex items-center gap-2">
            <span>←</span> kembali ke menu
          </Link>
        </div>
      )}

      {/* Game and Camera Feed */}
      {isPlaying && (
        <>
          <div className="absolute inset-0 w-full h-full">
            <BirdGame
              poseState={poseState}
              onGameOver={handleGameOver}
              onScoreUpdate={setScore}
            />
          </div>
          <BirdPoseController onPoseState={setPoseState} />
          
          {/* Debug action indicator */}
          <div className="absolute bottom-4 left-4 z-50 bg-black/50 p-3 rounded-lg text-xs font-mono border border-white/20 backdrop-blur-sm shadow-lg">
            Jalur: <span className="text-cyan-400 font-bold">{poseState.lane === -1 ? 'Kiri' : poseState.lane === 1 ? 'Kanan' : 'Tengah'}</span> | 
            Status: <span className={`font-bold ml-1 ${poseState.isFlying ? 'text-green-400' : 'text-red-400'}`}>
              {poseState.isFlying ? 'TERBANG' : 'MELAYANG'}
            </span>
          </div>
        </>
      )}
    </main>
  );
}
