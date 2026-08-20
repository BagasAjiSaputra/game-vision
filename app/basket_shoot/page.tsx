"use client";

import { useState, useEffect, useRef } from "react";
import BasketPoseController, { BasketPoseState } from "@/components/BasketPoseController";
import BasketGame from "@/components/BasketGame";
import Link from "next/link";

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function BasketShootPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [poseState, setPoseState] = useState<BasketPoseState | null>(null);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("basketShootLeaderboard");
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
    scoreRef.current = 0;
    setTimeLeft(180);
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
    
    const finalScore = scoreRef.current;
    
    const isTop5 = leaderboard.length < 5 || finalScore > (leaderboard[leaderboard.length - 1]?.score || 0);
    if (isTop5 && finalScore > 0 && playerName.trim()) {
      const newEntry: LeaderboardEntry = {
        name: playerName.substring(0, 20).toUpperCase(),
        score: finalScore,
        date: new Date().toLocaleDateString()
      };
      
      const newLeaderboard = [...leaderboard, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
        
      setLeaderboard(newLeaderboard);
      localStorage.setItem("basketShootLeaderboard", JSON.stringify(newLeaderboard));
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying]);

  return (
    <main className="flex min-h-screen flex-col bg-[#111116] text-[#e2e2e2] overflow-hidden relative font-sans">
      {!isPlaying && (
        <div className="z-20 w-full max-w-4xl mx-auto px-8 py-16 md:px-24 md:py-20 flex flex-col bg-[#111116] absolute inset-0 overflow-y-auto">
          {/* Logo */}
          <div className="mb-16">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#e2e2e2] lowercase">
              basket shoot<span className="text-[#9d72ff]">.</span>
            </h1>
            <div className="w-8 h-[2px] bg-[#9d72ff] mt-2"></div>
          </div>

          {isGameOver && (
            <div className="w-full flex justify-between items-center border-b border-[#222] pb-6 mb-12">
              <div>
                <h3 className="text-[#888] text-sm lowercase mb-1">status</h3>
                <h2 className="text-2xl font-bold text-[#ff4b4b] lowercase">waktu habis</h2>
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
            <p className="text-[#888] text-sm mb-4 lowercase">posisikan diri anda di depan kamera.</p>
            <ul className="text-[#e2e2e2] space-y-4 text-xl md:text-2xl lowercase tracking-tight">
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">01</span> <span className="text-[#888] text-sm w-44">lompat</span> lempar bola</li>
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">02</span> <span className="text-[#888] text-sm w-44">geser kiri/kanan</span> mengarahkan bidikan</li>
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
               <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase text-[#e2e2e2]">mulai game</h2>
               <p className="text-[#888] text-sm mt-2 lowercase">cetak poin dalam 3 menit.</p>
            </div>
            <span className="text-[#9d72ff] text-xl opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 duration-300 pt-2">→</span>
          </button>
          
          <Link href="/" className="mt-8 text-[#888] text-sm hover:text-[#9d72ff] transition-colors lowercase inline-flex items-center gap-2">
            <span>←</span> kembali ke menu
          </Link>
        </div>
      )}

      {isPlaying && (
        <>
          <div className="absolute top-0 left-0 w-full p-4 z-30 flex justify-between items-start pointer-events-none">
            <div className="text-xl font-bold bg-black/40 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-md shadow text-white flex flex-col min-w-[120px]">
              <span className="text-xs text-gray-400 mb-1">SCORE</span>
              <span>{score}</span>
            </div>
            <div className={`text-3xl font-bold px-5 py-3 rounded-xl backdrop-blur-md shadow text-white font-mono border border-white/10 ${timeLeft <= 10 ? 'bg-red-500/80 animate-pulse border-red-500' : 'bg-black/40'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          
          <div className="absolute inset-0 w-full h-full">
            <BasketGame 
              poseState={poseState} 
              onScoreUpdate={(newScore) => {
                setScore(newScore);
                scoreRef.current = newScore;
              }} 
            />
          </div>
          <BasketPoseController onPoseState={setPoseState} />
        </>
      )}
    </main>
  );
}
