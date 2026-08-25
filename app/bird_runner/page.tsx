"use client";

import { useState, useEffect } from "react";
import BirdGame from "@/components/BirdGame";
import BirdPoseController, { BirdPoseState } from "@/components/BirdPoseController";
import Link from "next/link";

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function BirdRunner() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState("");
  const [score, setScore] = useState(0);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [poseState, setPoseState] = useState<BirdPoseState>({ lane: 0, isFlying: false });
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("birdRunnerLeaderboard");
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
    setGameOverReason("");
    setScore(0);
    setHasStartedPlaying(false);
  };

  const handleGameOver = (reason: string = "tabrakan") => {
    setIsPlaying(false);
    setIsGameOver(true);
    setGameOverReason(reason);
    
    // Auto-save if it's a new high score
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
      localStorage.setItem("birdRunnerLeaderboard", JSON.stringify(newLeaderboard));
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const audio = new Audio('/music/heli_run1.mp3');
      audio.loop = true;
      audio.play().catch(e => console.error("Audio playback failed:", e));
      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying && poseState.isFlying && !hasStartedPlaying) {
      setHasStartedPlaying(true);
    }
  }, [isPlaying, poseState.isFlying, hasStartedPlaying]);

  return (
    <main className="flex min-h-screen flex-col bg-[#111116] text-[#e2e2e2] overflow-hidden relative font-sans">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-start pointer-events-none">
        {isPlaying && (
          <div className="text-xl font-bold bg-black/40 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-md shadow text-white flex flex-col min-w-[120px]">
            <span className="text-xs text-gray-400 mb-1">SCORE</span>
            <span>{score}</span>
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
                <h2 className="text-2xl font-bold text-[#ff4b4b] lowercase">{gameOverReason}</h2>
              </div>
              <div className="text-right">
                <h3 className="text-[#888] text-sm lowercase mb-1">skor akhir</h3>
                <h2 className="text-2xl font-bold text-[#e2e2e2] lowercase">{score}</h2>
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
            <p className="text-[#888] text-sm mb-4 lowercase">posisikan bahu dan lengan anda di depan kamera.</p>
            <ul className="text-[#e2e2e2] space-y-4 text-xl md:text-2xl lowercase tracking-tight">
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">01</span> <span className="text-[#888] text-sm w-44">angkat satu kaki</span> terbang maju</li>
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">02</span> <span className="text-[#888] text-sm w-44">miring kiri/kanan</span> belok kiri/kanan</li>
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">03</span> <span className="text-[#888] text-sm w-44">turunkan kaki</span> berhenti / melayang</li>
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
              onGameOver={() => handleGameOver("tabrakan")}
              onScoreUpdate={setScore}
            />
          </div>
          <BirdPoseController onPoseState={setPoseState} />
          
          {/* Debug action indicator */}
          <div className="absolute bottom-4 left-4 z-50 bg-black/50 p-3 rounded-lg text-xs font-mono border border-white/20 backdrop-blur-sm shadow-lg">
            Jalur: <span className="text-cyan-400 font-bold">{poseState.lane === -1 ? 'Kiri' : poseState.lane === 1 ? 'Kanan' : 'Tengah'}</span> | 
            Status: <span className={`font-bold ml-1 ${!poseState.isFlying ? 'text-red-400' : poseState.lane !== 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {!poseState.isFlying ? 'DIAM' : poseState.lane !== 0 ? 'MANUVER' : 'BERJALAN'}
            </span>
          </div>
        </>
      )}
    </main>
  );
}
