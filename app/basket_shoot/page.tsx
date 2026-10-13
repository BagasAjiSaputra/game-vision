"use client";

import { useState, useEffect, useRef } from "react";
import BasketPoseController, { BasketPoseState } from "@/components/BasketPoseController";
import BasketGame from "@/components/BasketGame";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Volume2, VolumeX, Clock, ArrowDown, ArrowUp, Hand, ArrowLeft, ArrowLeftRight , Sun, Moon, CheckCircle, AlertTriangle, Loader2, ShieldCheck, Lock, LogIn, UserCheck } from "lucide-react";
import { saveGameScore, getTopScoresByGame, uploadScreenshotAndUpdateScore } from "@/app/actions";
import { getStoredTeacher, useTeacherAuth } from "@/lib/teacherAuth";
import TeacherAuthModal from "@/components/TeacherAuthModal";
import { captureGameScreenshot } from "@/lib/screenshotCapture";

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function BasketShootPage() {
  const router = useRouter();
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
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  // Durasi game yang dipilih di Home (detik), dipakai untuk menghitung durasi main
  const gameDurationRef = useRef(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isGameActive, setIsGameActive] = useState(false);
  const [poseState, setPoseState] = useState<BasketPoseState | null>(null);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState<string>("");
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [gameOverReason, setGameOverReason] = useState("");
  const [randomSeed, setRandomSeed] = useState("");
  const [playerSnapshot, setPlayerSnapshot] = useState<string>("");
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  

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
      const audio = new Audio('/music/basket_shoot1.mp3');
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

  const { teacher } = useTeacherAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [saveStatusMsg, setSaveStatusMsg] = useState<{ type: 'success' | 'warn'; text: string } | null>(null);

  const fetchLeaderboard = async () => {
    if (!teacher?.id) {
      setLeaderboard([]);
      return;
    }
    try {
      const response = await getTopScoresByGame('basket_shoot', 5, teacher.id);
      if (response.success && response.data) {
        setLeaderboard(response.data);
      } else {
        setLeaderboard([]);
      }
    } catch (e) {
      console.error("Failed to load leaderboard", e);
      setLeaderboard([]);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [teacher]);

  const startGame = () => {
    if (!playerName.trim() || !playerAge.trim()) return;
    setIsPlaying(true);
    setIsGameOver(false);
    setIsFrozen(false);
    setIsGameActive(false);
    setGameOverReason("");
    setScore(0);
    scoreRef.current = 0;
    setSaveStatusMsg(null);
    const savedTime = localStorage.getItem('gameDuration');
    const initialDuration = parseInt(savedTime || "") || 300;
    gameDurationRef.current = initialDuration;
    setTimeLeft(initialDuration);
  };

  const handleGameOver = async (reason?: string) => {
    // Freeze agar overlay "MULAI / Tekan SPASI" tidak muncul dan menutupi screenshot
    setIsFrozen(true);
    setIsGameActive(false);

    // 1. Capture screenshot (canvas game + skor/waktu + inset kamera MediaPipe) SEBELUM menutup game
    let screenshotBlob: Blob | null = null;
    try {
      screenshotBlob = await captureGameScreenshot();
    } catch (err) {
      console.error("Screenshot capture failed:", err);
    }

    const effectiveName = (playerName && playerName.trim() ? playerName.trim() : "PEMAIN TAMU").substring(0, 20).toUpperCase();

    // 2. Simpan skor ke database (HANYA JIKA GURU SUDAH LOGIN)
    let scoreId: string | null = null;
    const currentTeacher = getStoredTeacher();
    if (currentTeacher?.id) {
      try {
        const playedDuration = Math.max(0, Math.min(gameDurationRef.current, gameDurationRef.current - timeLeft));
        const result = await saveGameScore(
          effectiveName,
          'basket_shoot',
          scoreRef.current || score,
          parseInt(playerAge) || undefined,
          currentTeacher.id,
          currentTeacher.school_name,
          undefined,
          playedDuration
        );
        if (result.success && result.data && result.data[0]) {
          scoreId = result.data[0].id;
        }
        await fetchLeaderboard();
        setSaveStatusMsg({
          type: 'success',
          text: `Skor ${effectiveName} (${scoreRef.current || score}) berhasil dicatat ke evaluasi Guru ${currentTeacher.name}!`
        });
      } catch (err) {
        console.error("Failed to save score:", err);
      }
    } else {
      console.log("Game over in guest mode. Score not saved.");
      setSaveStatusMsg({
        type: 'warn',
        text: "Mode Tamu: Skor tidak disimpan karena Anda belum login sebagai Guru."
      });
    }

    // 3. Kembali ke pre-game menu
    setIsPlaying(false);
    setIsGameOver(false);
    setIsFrozen(false);

    // 4. Upload screenshot secara async jika guru login dan scoreId valid
    if (screenshotBlob && scoreId) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          await uploadScreenshotAndUpdateScore(scoreId!, base64, 'basket_shoot', effectiveName);
          console.log('[Screenshot] Upload berhasil untuk skor:', scoreId);
        } catch (err) {
          console.error('[Screenshot] Upload gagal:', err);
        }
      };
      reader.readAsDataURL(screenshotBlob);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isPlaying && !isGameActive && !isGameOver) {
        e.preventDefault();
        setIsGameActive(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isGameActive, isGameOver]);

  useEffect(() => {
    if (isPlaying && isGameActive && !isGameOver) {
      if (timeLeft <= 0) {
        handleGameOver("Waktu Habis");
        return;
      }
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, isGameActive, isGameOver, timeLeft]);

  return (
    <main className={`flex min-h-screen flex-col font-sans transition-colors duration-300 ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0d0c] text-white'}  overflow-hidden relative font-sans`}>
      
      {/* Dynamic HUD Overlay (In-Game) */}
      {isPlaying && (
        <div className="absolute top-0 left-0 w-full p-4 z-30 flex flex-col gap-2 pointer-events-none">
          <div className="flex justify-end items-center w-full max-w-7xl mx-auto">
            {/* Score & Waktu digambar langsung di canvas BasketGame agar ikut terekam screenshot */}
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
              <button
                onClick={() => handleGameOver("Selesai")}
                className="px-3 py-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-md"
              >
                KEMBALI
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Basket Shoot</h1>
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

          {/* Notification / Save Status Banner */}
          {saveStatusMsg && (
            <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 mb-6 transition-all ${
              saveStatusMsg.type === 'success'
                ? isLightMode ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : isLightMode ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              {saveStatusMsg.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <p className="text-xs font-bold">{saveStatusMsg.text}</p>
            </div>
          )}

          {/* Teacher Auth Status / Guest Warning Banner */}
          {teacher ? (
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 mb-8 transition-all ${
              isLightMode ? 'bg-orange-50 border-orange-200 text-orange-950 shadow-sm' : 'bg-orange-950/30 border-orange-500/30 text-white'
            }`}>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
                    <span>Sesi Guru Aktif: {teacher.name}</span>
                    <span className="text-[10px] opacity-70">({teacher.school_name || 'SLB TUNAS KASIH'})</span>
                  </p>
                  <p className={`text-[11px] font-medium mt-0.5 ${isLightMode ? 'text-orange-800' : 'text-gray-300'}`}>
                    Skor bermain akan otomatis tersimpan ke log evaluasi privat murid Anda.
                  </p>
                </div>
              </div>
              <Link
                href="/score_log"
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-colors ${
                  isLightMode ? 'bg-white border-orange-200 text-orange-700 hover:bg-orange-50 shadow-sm' : 'bg-[#1c1e1c] border-orange-500/30 text-orange-300 hover:bg-white/5'
                }`}
              >
                Log Skor Murid
              </Link>
            </div>
          ) : (
            <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 transition-all ${
              isLightMode ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-sm' : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-start sm:items-center gap-2.5">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="text-xs font-bold">Mode Tamu (Belum Login Guru)</p>
                  <p className="text-[11px] font-medium opacity-80 mt-0.5">
                    Data permainan tidak akan disimpan. Login sebagai guru untuk mencatat skor evaluasi murid Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border shrink-0 transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                  isLightMode 
                    ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700 shadow-sm' 
                    : 'bg-[#d4ff00] text-black border-[#9bb800] hover:bg-[#b8de00]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Login Guru
              </button>
            </div>
          )}

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
                    placeholder="ENTER NAME"
                    className={`flex-1 rounded-full px-8 py-5 font-bold focus:outline-none transition-colors text-xl ${isLightMode ? 'bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 shadow-sm' : 'bg-[#1c1e1c] border border-white/5 text-white placeholder:text-[#555] focus:border-[#f97316]'}`}
                  />
                  <input 
                    type="number" 
                    value={playerAge}
                    onChange={(e) => setPlayerAge(e.target.value)}
                    placeholder="UMUR"
                    className={`flex-1 rounded-full px-6 py-5 font-bold focus:outline-none transition-colors text-xl ${isLightMode ? 'bg-white border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 shadow-sm' : 'bg-[#1c1e1c] border border-white/5 text-white placeholder:text-[#555] focus:border-[#f97316]'}`}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="mt-2">
                <h3 className="text-2xl font-bold mb-6">Kontrol MediaPipe</h3>
                <div className="grid grid-cols-1 gap-5">
                  <div className={`rounded-3xl p-6 border-2 transition-all hover:-translate-y-1 ${isLightMode ? 'bg-white border-slate-200 shadow-[0_6px_0_0_#e2e8f0] hover:shadow-[0_8px_0_0_#f97316] hover:border-orange-500 text-slate-800' : 'bg-[#1c1e1c] border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:shadow-[0_8px_0_0_#f97316] hover:border-[#f97316]'} flex flex-col gap-4`}>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-[#2a2c2a] flex items-center justify-center text-white shrink-0"><Activity className="w-9 h-9" /></div>
                      <div>
                        <p className="font-bold text-3xl">Persiapan</p>
                        <p className={`text-xl mt-2 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Persiapan tangan di dada</p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-white/10 my-2"></div>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-[#2a2c2a] flex items-center justify-center text-white shrink-0"><ArrowLeftRight className="w-9 h-9" /></div>
                      <div>
                        <p className="font-bold text-3xl">Arahkan</p>
                        <p className={`text-xl mt-2 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Arahkan dengan bergerak ke kanan / kiri</p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-white/10 my-2"></div>
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-[#2a2c2a] flex items-center justify-center text-white shrink-0"><Hand className="w-9 h-9" /></div>
                      <div>
                        <p className="font-bold text-3xl">Menembak</p>
                        <p className={`text-xl mt-2 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Lempar untuk menembak bola</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Leaderboard */}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-end mb-6 mt-12 md:mt-0">
                <h3 className="text-2xl font-bold">
                  {teacher ? "Penembak Terbaik (Murid Saya)" : "Peringkat Murid"}
                </h3>
                {teacher ? (
                  <Link href="/score_log" className={`cursor-pointer transition-colors font-medium ${isLightMode ? 'text-orange-600 hover:text-orange-800' : 'text-[#a0a0a0] hover:text-white'}`}>
                    Log Lengkap &rarr;
                  </Link>
                ) : (
                  <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className={`cursor-pointer transition-colors font-bold text-xs ${isLightMode ? 'text-indigo-600 hover:underline' : 'text-[#d4ff00] hover:underline'}`}
                  >
                    Login Guru
                  </button>
                )}
              </div>
              
              <div className="flex flex-col gap-4">
                {teacher ? (
                  leaderboard.length > 0 ? (
                    leaderboard.map((entry, idx) => (
                      <div 
                        key={idx} 
                        className={`rounded-3xl p-6 md:p-8 flex items-center justify-between transition-all hover:-translate-y-1 border-2 ${idx === 0 ? 'bg-[#f97316] text-black border-[#ea580c] shadow-[0_6px_0_0_#ea580c] hover:shadow-[0_8px_0_0_#ea580c]' : (isLightMode ? `bg-white text-slate-800 border-slate-200 shadow-sm hover:border-orange-500 hover:shadow-[0_8px_0_0_#e2e8f0]` : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a] hover:shadow-[0_8px_0_0_#f97316] hover:border-[#f97316]')}`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${idx === 0 ? 'bg-black/10' : (isLightMode ? 'bg-slate-100 text-slate-500' : 'bg-white/5')}`}>
                            #{idx + 1}
                          </div>
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`} alt="Avatar" className="w-14 h-14 rounded-full bg-black/40 shrink-0" />
                          <div>
                            <p className="font-bold text-xl md:text-2xl">{entry.name}</p>
                            <p className={`font-medium mt-1 ${idx === 0 ? 'text-black/60' : (isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]')}`}>{entry.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm mb-1 font-medium ${idx === 0 ? 'text-black/60' : (isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]')}`}>Skor</p>
                          <p className="font-black text-3xl md:text-4xl">{entry.score}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`rounded-3xl p-12 text-center border ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1e1c] border-white/5'}`}>
                      <p className={`text-base font-bold ${isLightMode ? 'text-slate-700' : 'text-white'}`}>Belum ada rekor murid Anda.</p>
                      <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Mainkan game untuk mencatat rekor pertama!</p>
                    </div>
                  )
                ) : (
                  <div className={`rounded-3xl p-8 text-center border-2 flex flex-col items-center justify-center ${
                    isLightMode ? 'bg-white border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] border-[#2a2d2a] shadow-[0_6px_0_0_#0a0d0c]'
                  }`}>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border-2 ${
                      isLightMode ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-[#f97316]/10 border-[#f97316]/30 text-[#f97316]'
                    }`}>
                      <Lock className="w-7 h-7" />
                    </div>
                    <p className="font-black text-lg mb-1">Peringkat Khusus Guru</p>
                    <p className={`text-xs mb-5 max-w-xs ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>
                      Peringkat sekarang diprivasi untuk masing-masing guru. Login untuk melihat prestasi murid Anda.
                    </p>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-2 active:scale-95 flex items-center gap-2 ${
                        isLightMode ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-700' : 'bg-[#f97316] text-black border-[#ea580c]'
                      }`}
                    >
                      <LogIn className="w-4 h-4" /> Login Guru
                    </button>
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
                  className={`flex-1 h-20 rounded-full flex items-center justify-center gap-4 text-2xl font-black tracking-widest transition-all ${!playerName.trim() ? isLightMode ? 'bg-white text-slate-400 cursor-not-allowed border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] text-[#555] cursor-not-allowed border-2 border-[#2a2d2a] shadow-[0_6px_0_0_#2a2d2a]' : (isLightMode ? 'bg-orange-500 text-white hover:bg-orange-600 border-2 border-orange-600 shadow-[0_8px_0_0_#c2410c] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#c2410c] active:translate-y-[8px] active:shadow-none' : 'bg-[#f97316] text-black hover:bg-[#ea580c] border-2 border-[#ea580c] shadow-[0_8px_0_0_#ea580c] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#ea580c] active:translate-y-[8px] active:shadow-none')}`}
                >
                  <span className="w-3 h-3 rounded-full bg-black"></span>
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
                <h1 className="text-7xl font-black text-white mb-6 tracking-widest drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]">MULAI</h1>
                <p className="text-2xl text-white font-bold bg-black/60 px-8 py-3 rounded-full border-2 border-[#f97316]">Tekan SPASI untuk memulai game</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 w-full h-full">
            <BasketGame
              timeLeft={timeLeft}
              poseState={!poseState ? null : ((isGameActive && !isFrozen) ? poseState : { ...poseState, isShooting: false, isJumping: false } as BasketPoseState)}
              onScoreUpdate={(score) => {
                setScore(score);
                scoreRef.current = score;
              }}
            />
          </div>
          <BasketPoseController onPoseState={setPoseState} onSnapshot={setPlayerSnapshot} />
        </>
      )}
      
      <TeacherAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {}}
        isLightMode={isLightMode}
      />
    </main>
  );
}
