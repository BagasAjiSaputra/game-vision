const fs = require('fs');

const pageContent = `"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Game from "@/components/Game";
import PoseController, { PoseState } from "@/components/PoseController";

interface LeaderboardEntry {
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
  const [gameOverReason, setGameOverReason] = useState("");
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const [poseState, setPoseState] = useState<PoseState>({
    lane: 0,
    isWalking: false,
    isJumping: false,
    isSliding: false,
  });

  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedVol = localStorage.getItem("gameVolume");
    if (savedVol) {
      setVolume(parseFloat(savedVol));
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const audio = new Audio('/music/endless_run1.mp3');
      audio.loop = true;
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(e => console.error("Audio playback failed:", e));
      bgmRef.current = audio;
      
      return () => {
        audio.pause();
        audio.currentTime = 0;
        bgmRef.current = null;
      };
    }
  }, [isPlaying]);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem("gameVolume", volume.toString());
  }, [volume, isMuted]);

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
    setGameOverReason("");
  };

  const handleGameOver = (reason?: string) => {
    setIsPlaying(false);
    setIsGameOver(true);
    if (reason) setGameOverReason(reason);
    
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

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0d0c] text-white overflow-hidden relative font-sans">
      
      {/* Dynamic HUD Overlay (In-Game) */}
      {isPlaying && (
        <div className="absolute top-0 left-0 w-full p-4 z-30 flex flex-col gap-2 pointer-events-none">
          <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
            
            <div className="flex gap-2 items-center">
              <div className="bg-[#1c1e1c]/90 backdrop-blur-md px-4 py-3 rounded-full border border-white/5 flex items-center gap-3 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#d4ff00] animate-pulse"></div>
                <span className="text-xs text-gray-400">Score</span>
                <span className="text-lg font-bold text-white">{score}</span>
              </div>
              <div className="bg-[#1c1e1c]/90 backdrop-blur-md px-4 py-3 rounded-full border border-white/5 flex items-center gap-3 shadow-lg">
                <span className="text-xs text-gray-400">Koin</span>
                <span className="text-lg font-bold text-white">{coins}</span>
              </div>
            </div>

            <div className="bg-[#1c1e1c]/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 text-xs text-gray-400 shadow-lg flex items-center gap-4 pointer-events-auto h-[52px]">
              <div className="hidden sm:block">
                BEST: <span className="font-bold text-white text-sm">{Math.max(leaderboard[0]?.score || 0, score)}</span>
              </div>
              <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-sm"
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Main Menu / Pre-play / Game Over */}
      {!isPlaying && (
        <div className="z-20 w-full max-w-md mx-auto px-6 py-12 flex flex-col h-full overflow-y-auto hide-scrollbar">
          
          {/* Header Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-[#1c1e1c] flex items-center justify-center overflow-hidden">
                <span className="text-xl">🏃</span>
              </div>
              <div>
                <p className="text-[#a0a0a0] text-xs">Welcome to,</p>
                <h1 className="text-lg font-bold">Endless Runner</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className="w-10 h-10 rounded-full bg-[#1c1e1c] flex items-center justify-center text-sm border border-white/5 hover:border-[#d4ff00]/50 transition-colors"
                >
                  {isMuted ? "🔇" : "🔊"}
               </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Choose Your Name */}
            <div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">Set your<br/>Player profile</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={15}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  placeholder="Enter Name"
                  className="flex-1 bg-[#1c1e1c] border border-white/5 rounded-full px-6 py-4 text-white font-medium focus:outline-none focus:border-[#d4ff00] transition-colors placeholder:text-[#555]"
                />
              </div>
            </div>

            {/* Game Over Banner */}
            {isGameOver && (
              <div className="bg-[#1c1e1c] rounded-3xl p-5 border border-red-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-red-400 font-bold text-lg">Match Ended</span>
                  <span className="text-[#a0a0a0] text-xs bg-black/40 px-3 py-1 rounded-full">Score: {score}</span>
                </div>
                <div className="bg-[#0a0d0c] rounded-2xl p-4 border border-white/5 flex gap-4 items-center">
                  <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-xl text-red-500">
                    !
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Failed</p>
                    <p className="text-[#a0a0a0] text-xs mt-1">Due to: {gameOverReason || 'Obstacle'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Events / Leaderboard */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold">Top Runners</h3>
                <span className="text-[#a0a0a0] text-xs">View All</span>
              </div>
              
              <div className="flex flex-col gap-3">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, idx) => (
                    <div 
                      key={idx} 
                      className={\`rounded-3xl p-5 flex items-center justify-between \${idx === 0 ? 'bg-[#d4ff00] text-black shadow-[0_4px_20px_rgba(212,255,0,0.15)]' : 'bg-[#1c1e1c] text-white border border-white/5'}\`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm \${idx === 0 ? 'bg-black/10' : 'bg-white/5'}\`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold">{entry.name}</p>
                          <p className={\`text-xs mt-1 \${idx === 0 ? 'text-black/60' : 'text-[#a0a0a0]'}\`}>{entry.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={\`text-xs mb-1 \${idx === 0 ? 'text-black/60' : 'text-[#a0a0a0]'}\`}>Score</p>
                        <p className="font-bold text-lg">{entry.score}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#1c1e1c] rounded-3xl p-6 text-center border border-white/5">
                    <p className="text-[#a0a0a0] text-sm">No records yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div>
              <h3 className="text-lg font-bold mb-4">MediaPipe Controls</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1c1e1c] rounded-2xl p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#2a2c2a] flex items-center justify-center text-sm mb-3">⬆️</div>
                  <p className="font-bold text-sm">Jump</p>
                  <p className="text-[#a0a0a0] text-[10px] mt-1">Jump up physically</p>
                </div>
                <div className="bg-[#1c1e1c] rounded-2xl p-4 border border-white/5">
                  <div className="w-8 h-8 rounded-full bg-[#2a2c2a] flex items-center justify-center text-sm mb-3">⬇️</div>
                  <p className="font-bold text-sm">Slide</p>
                  <p className="text-[#a0a0a0] text-[10px] mt-1">Squat down physically</p>
                </div>
                <div className="bg-[#1c1e1c] rounded-2xl p-4 border border-white/5 col-span-2 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#2a2c2a] flex items-center justify-center text-sm shrink-0">↔️</div>
                  <div>
                    <p className="font-bold text-sm">Move Lanes</p>
                    <p className="text-[#a0a0a0] text-[10px] mt-1">Step left or right in front of camera</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pb-24"></div> {/* Bottom padding for fixed button */}
          </div>
          
          {/* Fixed Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#0a0d0c] via-[#0a0d0c] to-transparent z-40">
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
               <Link href="/" className="w-14 h-14 rounded-full bg-[#1c1e1c] border border-white/5 flex items-center justify-center hover:bg-[#2a2c2a] transition-colors shrink-0">
                 <span className="text-white">←</span>
               </Link>
               
               <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className={\`flex-1 h-14 rounded-full flex items-center justify-center gap-2 font-bold transition-all \${!playerName.trim() ? 'bg-[#1c1e1c] text-[#555] cursor-not-allowed' : 'bg-[#d4ff00] text-black hover:bg-[#b0d600] active:scale-95'}\`}
                >
                  <span className="w-2 h-2 rounded-full bg-black"></span>
                  {isGameOver ? "Play Again" : "Start Game"}
                </button>
            </div>
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
              volume={isMuted ? 0 : volume}
            />
          </div>
          <PoseController onPoseState={setPoseState} />
        </>
      )}
      
      <style dangerouslySetInnerHTML={{__html: \`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      \`}} />
    </main>
  );
}
`;

fs.writeFileSync('app/endless_runner/page.tsx', pageContent);
console.log('Successfully updated page.tsx to Lime Green theme');
