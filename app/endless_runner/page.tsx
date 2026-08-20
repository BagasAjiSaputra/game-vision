"use client";

import { useState, useEffect } from "react";
import Game from "@/components/Game";
import PoseController, { PoseState } from "@/components/PoseController";
import Link from "next/link";

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function EndlessRunner() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");

  const [magnetTimeLeft, setMagnetTimeLeft] = useState(0);
  const [jetpackTimeLeft, setJetpackTimeLeft] = useState(0);

  const [poseState, setPoseState] = useState<PoseState>({
    lane: 0,
    isWalking: false,
    isJumping: false,
    isSliding: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem("endlessRunnerLeaderboard");
    if (saved) {
      try {
        setLeaderboard(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load leaderboard");
      }
    }
  }, []);

  const startGame = () => {
    if (!playerName.trim()) return;
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
    
    // Auto-save if it's a new high score
    const totalScore = score + (coins * 10); // Or just score? I will just use score since coins are separate or maybe add them. Let's just use score.
    const isTop5 = leaderboard.length < 5 || score > (leaderboard[leaderboard.length - 1]?.score || 0);
    if (isTop5 && score > 0 && playerName.trim()) {
      const newEntry: LeaderboardEntry = {
        name: playerName.substring(0, 20).toUpperCase(),
        score,
        date: new Date().toLocaleDateString()
      };
      
      const newLeaderboard = [...leaderboard, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
        
      setLeaderboard(newLeaderboard);
      localStorage.setItem("endlessRunnerLeaderboard", JSON.stringify(newLeaderboard));
    }
  };

  const handlePowerupUpdate = (magnetTime: number, jetpackTime: number) => {
    setMagnetTimeLeft(magnetTime);
    setJetpackTimeLeft(jetpackTime);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#111116] text-[#e2e2e2] overflow-hidden relative font-sans">
      {/* Dark tint backdrop overlay is no longer needed with the solid dark background, but keeping it empty for structural integrity if used by HUD */}

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
              HIGH SCORE: <span className="font-bold text-white text-sm">{Math.max(leaderboard[0]?.score || 0, score)}</span>
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
        <div className="z-20 w-full max-w-4xl mx-auto px-8 py-16 md:px-24 md:py-20 flex flex-col bg-[#111116] absolute inset-0 overflow-y-auto">
          {/* Logo */}
          <div className="mb-16">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#e2e2e2] lowercase">
              endless runner<span className="text-[#9d72ff]">.</span>
            </h1>
            <div className="w-8 h-[2px] bg-[#9d72ff] mt-2"></div>
          </div>

          {isGameOver && (
            <div className="w-full flex justify-between items-center border-b border-[#222] pb-6 mb-12">
              <div>
                <h3 className="text-[#888] text-sm lowercase mb-1">status</h3>
                <h2 className="text-2xl font-bold text-[#ff4b4b] lowercase">gagal</h2>
              </div>
              <div className="text-right">
                <h3 className="text-[#888] text-sm lowercase mb-1">skor / koin</h3>
                <h2 className="text-2xl font-bold text-[#e2e2e2] lowercase">{score} / {coins}</h2>
              </div>
            </div>
          )}

          <div className="w-full mb-12">
            <h3 className="text-[#888] text-sm lowercase mb-6 border-b border-[#222] pb-2">leaderboard</h3>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#1a1a24] p-4 rounded-lg border border-[#222]">
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-bold ${idx === 0 ? 'text-[#ffd700]' : idx === 1 ? 'text-[#c0c0c0]' : idx === 2 ? 'text-[#cd7f32]' : 'text-[#555]'}`}>#{idx + 1}</span>
                      <span className="font-bold text-xl uppercase tracking-widest">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#9d72ff] text-xl block">{entry.score}</span>
                      <span className="text-[#555] text-xs">{entry.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 bg-[#1a1a24] rounded-lg border border-[#222] text-[#555] border-dashed">
                <p className="text-sm lowercase">belum ada rekor tercetak.</p>
                <p className="text-xs mt-1">jadilah yang pertama!</p>
              </div>
            )}
          </div>

          <div className="w-full flex flex-col mb-12">
            <h3 className="text-[#888] text-sm lowercase mb-6 border-b border-[#222] pb-2">kendali (mediapipe ai)</h3>
            <p className="text-[#888] text-sm mb-4 lowercase">posisikan seluruh badan anda di depan kamera.</p>
            <ul className="text-[#e2e2e2] space-y-4 text-xl md:text-2xl lowercase tracking-tight">
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">01</span> <span className="text-[#888] text-sm w-44">lompat</span> melompati rintangan</li>
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">02</span> <span className="text-[#888] text-sm w-44">jongkok</span> meluncur ke bawah</li>
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">03</span> <span className="text-[#888] text-sm w-44">geser kiri/kanan</span> berpindah jalur</li>
            </ul>
          </div>

          <div className="w-full flex flex-col mb-8">
            <h3 className="text-[#888] text-sm lowercase mb-4 border-b border-[#222] pb-2">nama pemain (maksimal 20 huruf)</h3>
            <input 
              type="text" 
              maxLength={20} 
              required
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              placeholder="YOUR NAME" 
              className="bg-black/50 border border-[#333] text-white text-xl font-bold w-full max-w-sm rounded-lg p-3 uppercase focus:outline-none focus:border-[#9d72ff] transition-colors"
            />
          </div>

          <button
            onClick={startGame}
            disabled={!playerName.trim()}
            className={`group flex items-start gap-6 py-8 border-t border-b border-[#222] transition-colors w-full text-left mt-auto ${!playerName.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#444] cursor-pointer'}`}
          >
            <span className="text-[#9d72ff] font-mono text-xs font-medium w-6 pt-3">00</span>
            <div className="flex-1 flex flex-col">
               <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase text-[#e2e2e2]">{isGameOver ? "main lagi" : "mulai game"}</h2>
               <p className="text-[#888] text-sm mt-2 lowercase">siap kapanpun.</p>
            </div>
            <span className="text-[#9d72ff] text-xl opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 duration-300 pt-2">→</span>
          </button>
          
          <Link href="/" className="mt-8 text-[#888] text-sm hover:text-[#9d72ff] transition-colors lowercase inline-flex items-center gap-2">
            <span>←</span> kembali ke menu
          </Link>
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

