"use client";

import { useState, useEffect, useRef } from "react";
import BirdGame from "@/components/BirdGame";
import BirdPoseController, { BirdPoseState } from "@/components/BirdPoseController";
import Link from "next/link";
import { Activity, Volume2, VolumeX, AlertTriangle, Hand, ArrowLeft } from "lucide-react";
import { saveGameScore } from "@/app/actions";

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
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const savedVol = localStorage.getItem("gameVolume");
    if (savedVol) {
      setVolume(parseFloat(savedVol));
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const audio = new Audio('/music/heli_run1.mp3');
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

  const handleGameOver = async (reason?: string) => {
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
      localStorage.setItem("birdRunnerLeaderboard", JSON.stringify(newLeaderboard));
    }

    if (score > 0 && playerName.trim()) {
      try {
        const response = await saveGameScore(
          playerName.substring(0, 20).toUpperCase(),
          'bird_runner',
          score
        );
        
        if (!response.success) {
          console.error("Supabase Insert Error:", response.error);
          alert("Gagal menyimpan skor ke database: " + response.error);
        } else {
          console.log("Skor berhasil disimpan ke Supabase via Server Action!");
        }
      } catch (err) {
        console.error("Failed to call saveGameScore action", err);
      }
    }
  };

  useEffect(() => {
    if (isPlaying && poseState.isFlying && !hasStartedPlaying) {
      setHasStartedPlaying(true);
    }
  }, [isPlaying, poseState.isFlying, hasStartedPlaying]);

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0d0c] text-white overflow-hidden relative font-sans">
      
      {/* Dynamic HUD Overlay (In-Game) */}
      {isPlaying && (
        <div className="absolute top-0 left-0 w-full p-4 z-30 flex flex-col gap-2 pointer-events-none">
          <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
            
            <div className="flex gap-2 items-center">
              <div className="bg-[#1c1e1c]/90 backdrop-blur-md px-4 py-3 rounded-full border border-white/5 flex items-center gap-3 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse"></div>
                <span className="text-xs text-gray-400">Score</span>
                <span className="text-lg font-bold text-white">{score}</span>
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
        <div className="z-20 w-full mx-auto px-6 py-12 md:px-12 md:py-16 flex flex-col h-full overflow-y-auto hide-scrollbar">
          
          {/* Header Bar */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-[#1c1e1c] flex items-center justify-center overflow-hidden">
                <Activity className="w-7 h-7 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-[#a0a0a0] text-sm">Selamat datang di,</p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bird Runner</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className="w-12 h-12 rounded-full bg-[#1c1e1c] flex items-center justify-center text-[#a0a0a0] border border-white/5 hover:border-[#3b82f6]/50 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
               </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
            
            {/* Left Column: Player & Controls */}
            <div className="flex-[1.2] flex flex-col gap-10">
              
              {/* Game Over Banner */}
              {isGameOver && (
                <div className="bg-[#1c1e1c] rounded-3xl p-8 border border-red-500/30 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-red-400 font-bold text-2xl tracking-tight">Permainan Berakhir</span>
                    <span className="text-[#a0a0a0] font-medium bg-black/40 px-4 py-2 rounded-full">Skor: {score}</span>
                  </div>
                  <div className="bg-[#0a0d0c] rounded-2xl p-6 border border-white/5 flex gap-6 items-center">
                    <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 shrink-0">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Gagal</p>
                      <p className="text-[#a0a0a0] mt-1">Penyebab: {gameOverReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Choose Your Name */}
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">Atur profil<br/>Pemainmu</h2>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    maxLength={15}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    placeholder="ENTER NAME"
                    className="flex-1 bg-[#1c1e1c] border border-white/5 rounded-full px-8 py-5 text-white font-bold focus:outline-none focus:border-[#3b82f6] transition-colors placeholder:text-[#555] text-xl"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="mt-2">
                <h3 className="text-2xl font-bold mb-6">Kontrol MediaPipe</h3>
                <div className="grid grid-cols-1 gap-5">
                  <div className="bg-[#1c1e1c] rounded-3xl p-6 border-2 border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:-translate-y-1 hover:shadow-[0_8px_0_0_#3b82f6] hover:border-[#3b82f6] transition-all flex items-center gap-6">
                    <div className="w-14 h-14 rounded-full bg-[#2a2c2a] flex items-center justify-center text-white shrink-0"><Hand className="w-7 h-7" /></div>
                    <div>
                      <p className="font-bold text-xl">Kepakkan Sayap</p>
                      <p className="text-[#a0a0a0] text-sm mt-2">Kepakkan kedua lenganmu secara nyata untuk terbang</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Leaderboard */}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-6 mt-12 md:mt-0">
                <h3 className="text-2xl font-bold">Penerbang Terbaik</h3>
                <span className="text-[#a0a0a0] hover:text-white cursor-pointer transition-colors font-medium">Lihat Semua</span>
              </div>
              
              <div className="flex flex-col gap-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, idx) => (
                    <div 
                      key={idx} 
                      className={`rounded-3xl p-6 md:p-8 flex items-center justify-between transition-all hover:-translate-y-1 border-2 ${idx === 0 ? 'bg-[#3b82f6] text-white border-[#2563eb] shadow-[0_6px_0_0_#2563eb] hover:shadow-[0_8px_0_0_#2563eb]' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:shadow-[0_8px_0_0_#3b82f6] hover:border-[#3b82f6]'}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl ${idx === 0 ? 'bg-white/20' : 'bg-white/5'}`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-xl md:text-2xl">{entry.name}</p>
                          <p className={`font-medium mt-1 ${idx === 0 ? 'text-white/60' : 'text-[#a0a0a0]'}`}>{entry.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm mb-1 font-medium ${idx === 0 ? 'text-white/60' : 'text-[#a0a0a0]'}`}>Skor</p>
                        <p className="font-black text-3xl md:text-4xl">{entry.score}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#1c1e1c] rounded-3xl p-12 text-center border border-white/5">
                    <p className="text-[#a0a0a0] text-lg">Belum ada rekor.</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>

          <div className="pb-36"></div> {/* Bottom padding for fixed button */}
          
          {/* Fixed Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t from-[#0a0d0c] via-[#0a0d0c] to-transparent z-40 pointer-events-none">
            <div className="w-full px-6 md:px-12 mx-auto flex items-center justify-between gap-6 pointer-events-auto">
               <Link href="/" className="w-20 h-20 rounded-full bg-[#1c1e1c] border border-white/5 flex items-center justify-center hover:bg-[#2a2c2a] transition-colors shrink-0 shadow-2xl text-white">
                 <ArrowLeft className="w-8 h-8" />
               </Link>
               
               <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className={`flex-1 h-20 rounded-full flex items-center justify-center gap-4 text-2xl font-black tracking-widest transition-all ${!playerName.trim() ? 'bg-[#1c1e1c] text-[#555] cursor-not-allowed border-2 border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a]' : 'bg-[#3b82f6] text-white hover:bg-[#2563eb] border-2 border-[#2563eb] shadow-[0_8px_0_0_#2563eb] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#2563eb] active:translate-y-[8px] active:shadow-none'}`}
                >
                  <span className="w-3 h-3 rounded-full bg-white"></span>
                  {isGameOver ? "MAIN LAGI" : "MULAI BERMAIN"}
                </button>
            </div>
          </div>
          
        </div>
      )}

      {/* Game Canvas & MediaPipe Camera Feed */}
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
        </>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </main>
  );
}
