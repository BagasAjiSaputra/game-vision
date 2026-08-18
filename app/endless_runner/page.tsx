"use client";

import { useState, useEffect } from "react";
import Game from "@/components/Game";
import PoseController, { PoseState } from "@/components/PoseController";
import Link from "next/link";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const [magnetTimeLeft, setMagnetTimeLeft] = useState(0);
  const [jetpackTimeLeft, setJetpackTimeLeft] = useState(0);

  const [poseState, setPoseState] = useState<PoseState>({
    lane: 0,
    isWalking: false,
    isJumping: false,
    isSliding: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem("endless_runner_highscore");
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setCoins(0);
    setMagnetTimeLeft(0);
    setJetpackTimeLeft(0);
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    setHighScore((prev) => {
      const nextHigh = Math.max(prev, score);
      localStorage.setItem("endless_runner_highscore", nextHigh.toString());
      return nextHigh;
    });
  };

  const handlePowerupUpdate = (magnetTime: number, jetpackTime: number) => {
    setMagnetTimeLeft(magnetTime);
    setJetpackTimeLeft(jetpackTime);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white overflow-hidden relative font-sans bg-[url('/assets/bg_start.png')] bg-cover bg-center">
      {/* Dark tint backdrop overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-0"></div>

      {/* Dynamic HUD Overlay */}
      {isPlaying && (
        <div className="absolute top-0 left-0 w-full p-4 z-30 flex flex-col gap-2 pointer-events-none">
          <div className="flex justify-between items-center w-full">
            {/* Score & Coins */}
            <div className="flex gap-4 items-center">
              <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-blue-500/30 flex items-center gap-2 shadow-lg">
                <span className="text-xs text-gray-400 font-mono">SCORE</span>
                <span className="text-xl font-bold font-mono text-blue-400">{score}</span>
              </div>
              <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/30 flex items-center gap-2 shadow-lg">
                <span className="text-xs text-amber-400 font-mono">KOIN</span>
                <span className="text-xl font-bold font-mono text-amber-400">{coins}</span>
              </div>
            </div>

            {/* High Score */}
            <div className="bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-purple-500/30 font-mono text-xs text-purple-300">
              HIGH SCORE: <span className="font-bold text-white text-sm">{Math.max(highScore, score)}</span>
            </div>
          </div>

          {/* Active Powerup Countdown Bars */}
          <div className="flex flex-col gap-1 w-48 mt-1">
            {magnetTimeLeft > 0 && (
              <div className="bg-rose-950/80 border border-rose-500/50 rounded-lg p-1.5 backdrop-blur-sm shadow-md">
                <div className="flex justify-between text-[11px] font-mono text-rose-300 mb-1">
                  <span>MAGNET</span>
                  <span>{magnetTimeLeft}s</span>
                </div>
                <div className="w-full bg-rose-900/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(magnetTimeLeft / 9) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {jetpackTimeLeft > 0 && (
              <div className="bg-sky-950/80 border border-sky-500/50 rounded-lg p-1.5 backdrop-blur-sm shadow-md">
                <div className="flex justify-between text-[11px] font-mono text-sky-300 mb-1">
                  <span>JETPACK</span>
                  <span>{jetpackTimeLeft}s</span>
                </div>
                <div className="w-full bg-sky-900/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-sky-400 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(jetpackTimeLeft / 8) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Menu / Game Over Screen */}
      {!isPlaying && (
        <div className="z-20 flex flex-col items-center bg-slate-900/90 p-8 rounded-3xl backdrop-blur-xl border border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.2)] max-w-lg w-full mx-4">
          <h1 className="text-4xl font-black mb-1 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            MOTION RUNNER
          </h1>
          <p className="text-xs text-blue-400 font-mono tracking-widest uppercase mb-6">
            Endless Runner Template • MediaPipe AI Control
          </p>

          {isGameOver && (
            <div className="w-full bg-gray-900/80 border border-gray-800 rounded-2xl p-4 mb-6 text-center space-y-2">
              <h2 className="text-2xl font-bold text-red-500">GAME OVER</h2>
              <div className="flex justify-around items-center pt-2">
                <div>
                  <div className="text-xs text-gray-400">SKOR</div>
                  <div className="text-2xl font-black font-mono text-blue-400">{score}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">KOIN</div>
                  <div className="text-2xl font-black font-mono text-amber-400">{coins}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">BEST</div>
                  <div className="text-2xl font-black font-mono text-purple-400">{highScore}</div>
                </div>
              </div>
            </div>
          )}

          <div className="w-full bg-gray-900/60 border border-gray-800 rounded-2xl p-4 mb-6 text-xs text-gray-300 space-y-2">
            <p className="font-bold text-blue-300 mb-2 border-b border-gray-800 pb-1">
              KONTROL GERAKAN (MEDIAPIPE AI):
            </p>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div><strong>Miring Kiri/Kanan:</strong> Pindah Jalur</div>
              <div><strong>Jalan di Tempat:</strong> Berjalan Maju</div>
              <div><strong>Lompat / Tangan Atas:</strong> Melompati Rintangan Rendah</div>
              <div><strong>Jongkok / Squat:</strong> Meluncur di Bawah Rintangan Tinggi</div>
              <div><strong>Item Magnet:</strong> Menarik Semua Koin</div>
              <div><strong>Item Jetpack:</strong> Terbang Bebas di Udara</div>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black rounded-2xl text-xl shadow-xl transform transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isGameOver ? "MAIN LAGI" : "MULAI GAME"}
          </button>
          
          <div className="flex flex-col gap-2 mt-4 w-full">
            <Link href="/bird_runner" className="text-center w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-blue-300 hover:text-white rounded-xl font-medium transition-colors border border-white/10 text-sm">
              🚀 Coba Mode Bird Runner
            </Link>
            <Link href="/basket_shoot" className="text-center w-full px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-white rounded-xl font-medium transition-colors border border-orange-500/30 text-sm">
              🏀 Coba Mode Basket Shoot
            </Link>
          </div>
        </div>
      )}

      {/* Game Canvas & MediaPipe Camera Feed */}
      {isPlaying && (
        <>
          <div className="absolute inset-0 w-full h-full">
            <Game
              poseState={poseState}
              onGameOver={handleGameOver}
              onScoreUpdate={setScore}
              onCoinsUpdate={setCoins}
              onPowerupUpdate={handlePowerupUpdate}
            />
          </div>
          <PoseController onPoseState={setPoseState} />
        </>
      )}
    </main>
  );
}

