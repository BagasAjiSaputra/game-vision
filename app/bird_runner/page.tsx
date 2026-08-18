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
    <main className="flex min-h-screen flex-col items-center justify-center bg-sky-900 text-white overflow-hidden relative">
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
        <div className="z-20 flex flex-col items-center bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
          <h2 className="text-5xl font-black mb-2 text-white drop-shadow-md">
            {isGameOver ? "CRASHED!" : "BIRD RUNNER"}
          </h2>
          {isGameOver && (
            <p className="text-2xl text-blue-100 mb-6 font-bold drop-shadow">Final Score: {score}</p>
          )}
          <div className="bg-black/30 p-5 rounded-2xl mb-8 border border-white/10 shadow-inner">
            <p className="text-sm text-blue-100 max-w-md text-center leading-relaxed">
              Posisikan tubuh bagian atas (bahu & lengan) terlihat di kamera.<br/><br/>
              <strong>Cara Terbang:</strong><br/>
              Rentangkan Tangan Lurus ➔ Terbang Maju<br/>
              Miringkan Badan & Lengan ke Kiri ➔ Belok Kiri<br/>
              Miringkan Badan & Lengan ke Kanan ➔ Belok Kanan<br/>
              Turunkan Lengan ➔ Berhenti
            </p>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black rounded-full text-xl shadow-[0_0_15px_rgba(0,200,255,0.5)] transform transition hover:scale-105 active:scale-95 tracking-wide"
          >
            {isGameOver ? "FLY AGAIN" : "START FLIGHT"}
          </button>
          <Link href="/" className="mt-6 text-sm text-blue-200 hover:text-white underline underline-offset-4 decoration-blue-400">
            Kembali ke Mode Robot
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
