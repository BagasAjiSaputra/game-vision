"use client";

import { useState, useEffect, useRef } from "react";
import HeliGame from "@/components/HeliGame";
import HeliPoseController, { HeliPoseState } from "@/components/HeliPoseController";
import Link from "next/link";
import { Activity, Volume2, VolumeX, AlertTriangle, Hand, ArrowLeft , Sun, Moon} from "lucide-react";
import { saveGameScore, getTopScoresByGame } from "@/app/actions";

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function HeliRunner() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('isLightMode');
    if (saved) setIsLightMode(saved === 'true');
    const savedTime = localStorage.getItem('gameDuration');
    if (savedTime) setTimeLeft(parseInt(savedTime));
  }, []);


  const [isGameOver, setIsGameOver] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isGameActive, setIsGameActive] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const [poseState, setPoseState] = useState<HeliPoseState>({ lane: 0, isFlying: false });
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState<string>("");
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [randomSeed, setRandomSeed] = useState("");
  

  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setRandomSeed(Math.random().toString(36).substring(7));
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

  const fetchLeaderboard = async () => {
    try {
      const response = await getTopScoresByGame('heli_runner');
      if (response.success && response.data) {
        setLeaderboard(response.data);
      }
    } catch (e) {
      console.error("Failed to load leaderboard", e);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const startGame = () => {
    if (!playerName.trim() || !playerAge.trim()) return;
    setIsPlaying(true);
    setIsGameOver(false);
    setIsFrozen(false);
    setIsGameActive(false);
    setGameOverReason("");
    setScore(0);
    const savedTime = localStorage.getItem('gameDuration');
    setTimeLeft(savedTime ? parseInt(savedTime) : 300);
    setHasStartedPlaying(false);
  };

  const handleGameOver = async (reason?: string) => {
    setIsGameActive(false);



    setIsPlaying(false);
    setIsGameOver(true);
    if (reason) setGameOverReason(reason);
    if (score >= 0 && playerName.trim()) {
      try {
        const response = await saveGameScore(
          playerName.substring(0, 20).toUpperCase(),
          'heli_runner',
          score,
          parseInt(playerAge)
        );
        
        if (!response.success) {
          console.error("Supabase Insert Error:", response.error);
          alert("Gagal menyimpan skor ke database: " + response.error);
        } else {
          console.log("Skor berhasil disimpan ke Supabase via Server Action!");
          await fetchLeaderboard();
        }
      } catch (err) {
        console.error("Failed to call saveGameScore action", err);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isPlaying && !isGameActive && !isGameOver && !isFrozen) {
        e.preventDefault();
        setIsGameActive(true);
      }
      if (e.code === "Enter" && isFrozen) {
        e.preventDefault();
        setIsFrozen(false);
        handleGameOver("Waktu Habis");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isGameActive, isGameOver, isFrozen]);

  useEffect(() => {
    if (isPlaying && poseState.isFlying && !hasStartedPlaying) {
      setHasStartedPlaying(true);
    }
  }, [isPlaying, poseState.isFlying, hasStartedPlaying]);

  useEffect(() => {
    if (isPlaying && isGameActive && !isGameOver) {
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, isGameActive, isGameOver, hasStartedPlaying]);

  useEffect(() => {
    if (isPlaying && isGameActive && !isGameOver && !isFrozen) {
      if (timeLeft <= 0) {
        setIsFrozen(true);
      }
    }
  }, [timeLeft, isPlaying, isGameActive, isGameOver, isFrozen]);

  return (
    <main className={`flex min-h-screen flex-col font-sans transition-colors duration-300 ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0d0c] text-white'}  overflow-hidden relative font-sans`}>
      
      {/* Dynamic HUD Overlay (In-Game) */}
      {isPlaying && (
        <div className="absolute top-0 left-0 w-full p-4 z-30 flex flex-col gap-2 pointer-events-none">
          <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
            
            <div className="flex gap-4 items-center">
              <div className="bg-[#1c1e1c]/90 backdrop-blur-md px-6 py-4 md:px-8 md:py-5 rounded-3xl border border-white/10 flex flex-col items-center gap-1 shadow-2xl">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6] animate-pulse"></div>
                  <span className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest">Score</span>
                </div>
                <span className="text-4xl md:text-5xl font-black text-white">{score}</span>
              </div>
              <div className="bg-[#1c1e1c]/90 backdrop-blur-md px-6 py-4 md:px-8 md:py-5 rounded-3xl border border-white/10 flex flex-col items-center gap-1 shadow-2xl">
                <span className="text-sm md:text-base font-bold text-gray-400 uppercase tracking-widest">Waktu</span>
                <span className="text-4xl md:text-5xl font-black text-white">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
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
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-[#1c1e1c] flex items-center justify-center overflow-hidden shrink-0">
                {randomSeed && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`} alt="Profile" className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className={`text-sm ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Selamat datang di,</p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Heli Runner</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isLightMode ? 'bg-white text-slate-700 shadow-md hover:bg-slate-100 border-transparent' : 'bg-[#1c1e1c] text-[#a0a0a0] hover:text-white border border-white/5'}`}
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
               </button>
               <button 
                  onClick={() => { const next = !isLightMode; setIsLightMode(next); localStorage.setItem('isLightMode', String(next)); }} 
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isLightMode ? 'bg-white text-slate-700 shadow-md hover:bg-slate-100 border-transparent' : 'bg-[#1c1e1c] text-[#a0a0a0] hover:text-white border border-white/5'}`}
                >
                  {isLightMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
               </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
            
            {/* Left Column: Player & Controls */}
            <div className="flex-[1.2] flex flex-col gap-10">
              
              {/* Choose Your Name */}
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">Atur profil<br/>Pemainmu</h2>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    maxLength={15}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    placeholder="NAMA PEMAIN"
                    className={`flex-1 rounded-full px-8 py-5 font-bold focus:outline-none transition-colors text-xl ${isLightMode ? 'bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 shadow-sm shadow-sm' : 'bg-[#1c1e1c] border border-white/5 text-white placeholder:text-[#555] focus:border-[#3b82f6]'}`}
                  />
                  <input 
                    type="number" 
                    value={playerAge}
                    onChange={(e) => setPlayerAge(e.target.value)}
                    placeholder="UMUR"
                    className={`flex-1 rounded-full px-6 py-5 font-bold focus:outline-none transition-colors text-xl ${isLightMode ? 'bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 shadow-sm' : 'bg-[#1c1e1c] border border-white/5 text-white placeholder:text-[#555] focus:border-[#3b82f6]'}`}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="mt-2">
                <h3 className="text-2xl font-bold mb-6">Kontrol MediaPipe</h3>
                <div className="grid grid-cols-1 gap-5">
                  <div className={`rounded-3xl p-6 border-2 transition-all hover:-translate-y-1 ${isLightMode ? 'bg-white border-slate-200 shadow-[0_6px_0_0_#e2e8f0] hover:shadow-[0_8px_0_0_#3b82f6] hover:border-blue-500 text-slate-800' : 'bg-[#1c1e1c] border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:shadow-[0_8px_0_0_#3b82f6] hover:border-[#3b82f6]'} flex flex-col gap-4`}>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-[#2a2c2a] flex items-center justify-center text-white shrink-0"><Activity className="w-9 h-9" /></div>
                      <div>
                        <p className="font-bold text-3xl">Maju Kedepan</p>
                        <p className={`text-xl mt-2 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Naikkan 1 kaki untuk maju kedepan</p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-white/10 my-2"></div>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-[#2a2c2a] flex items-center justify-center text-white shrink-0"><Hand className="w-9 h-9" /></div>
                      <div>
                        <p className="font-bold text-3xl">Pindah Jalur</p>
                        <p className={`text-xl mt-2 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Miringkan ke kanan / kiri untuk berpindah jalur</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Leaderboard */}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-6 mt-12 md:mt-0">
                <h3 className="text-2xl font-bold">Penerbang Terbaik</h3>
                <span className={`cursor-pointer transition-colors font-medium ${isLightMode ? 'text-blue-600 hover:text-blue-800' : 'text-[#a0a0a0] hover:text-white'}`}>Lihat Semua</span>
              </div>
              
              <div className="flex flex-col gap-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, idx) => (
                    <div 
                      key={idx} 
                      className={`rounded-3xl p-6 md:p-8 flex items-center justify-between transition-all hover:-translate-y-1 border-2 ${idx === 0 ? 'bg-[#3b82f6] text-white border-[#2563eb] shadow-[0_6px_0_0_#2563eb] hover:shadow-[0_8px_0_0_#2563eb]' : (isLightMode ? `bg-white text-slate-800 border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-[0_8px_0_0_#e2e8f0]` : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:shadow-[0_8px_0_0_#3b82f6] hover:border-[#3b82f6]')}`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${idx === 0 ? 'bg-black/10' : (isLightMode ? 'bg-slate-100 text-slate-500' : 'bg-white/5')}`}>
                          #{idx + 1}
                        </div>
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`} alt="Avatar" className="w-14 h-14 rounded-full bg-black/40 shrink-0" />
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
                  <div className={`rounded-3xl p-12 text-center border ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1e1c] border-white/5'}`}>
                    <p className={`text-lg ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Belum ada rekor.</p>
                  </div>
                )}
              </div>
            </div>
            
          </div>

          <div className="pb-36"></div> {/* Bottom padding for fixed button */}
          
          {/* Fixed Bottom Action Bar */}
          <div className={`fixed bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t ${isLightMode ? 'from-slate-50 via-slate-50' : 'from-[#0a0d0c] via-[#0a0d0c]'} to-transparent z-40 pointer-events-none`}>
            <div className="w-full px-6 md:px-12 mx-auto flex items-center justify-between gap-6 pointer-events-auto">
               <Link href="/" className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-2xl ${isLightMode ? 'bg-white text-slate-700 hover:bg-slate-100 border-transparent' : 'bg-[#1c1e1c] border border-white/5 hover:bg-[#2a2c2a] text-white'}`}>
                 <ArrowLeft className="w-8 h-8" />
               </Link>
               
               <button
                  onClick={startGame}
                  disabled={!playerName.trim()}
                  className={`flex-1 h-20 rounded-full flex items-center justify-center gap-4 text-2xl font-black tracking-widest transition-all ${!playerName.trim() ? isLightMode ? 'bg-white text-slate-400 cursor-not-allowed border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] text-[#555] cursor-not-allowed border-2 border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a]' : (isLightMode ? 'bg-blue-500 text-white hover:bg-blue-600 border-2 border-blue-600 shadow-[0_8px_0_0_#1d4ed8] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#1d4ed8] active:translate-y-[8px] active:shadow-none' : 'bg-[#3b82f6] text-white hover:bg-[#2563eb] border-2 border-[#2563eb] shadow-[0_8px_0_0_#2563eb] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#2563eb] active:translate-y-[8px] active:shadow-none')}`}
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
          {!isGameActive && !isGameOver && !isFrozen && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <div className="text-center animate-bounce">
                <h1 className="text-7xl font-black text-white mb-6 tracking-widest drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">MULAI</h1>
                <p className="text-2xl text-white font-bold bg-black/60 px-8 py-3 rounded-full border-2 border-[#3b82f6]">Tekan SPASI untuk memulai game</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 w-full h-full">
            <HeliGame
              poseState={(isGameActive && !isFrozen) ? poseState : { ...poseState, isFlying: false }}
              onGameOver={handleGameOver}
              onScoreUpdate={setScore}
            />
          </div>
          <HeliPoseController onPoseState={setPoseState} />
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
