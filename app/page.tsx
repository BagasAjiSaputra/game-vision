"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  
  const [birdLeaderboard, setBirdLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [endlessLeaderboard, setEndlessLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [basketLeaderboard, setBasketLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<{name: string, average: number}[]>([]);
  
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      setIsNameSet(true);
    }
    
    // Load leaderboards
    try {
      const birdRaw = localStorage.getItem("birdRunnerLeaderboard");
      const endlessRaw = localStorage.getItem("endlessRunnerLeaderboard");
      const basketRaw = localStorage.getItem("basketShootLeaderboard");
      
      const bird: LeaderboardEntry[] = birdRaw ? JSON.parse(birdRaw) : [];
      const endless: LeaderboardEntry[] = endlessRaw ? JSON.parse(endlessRaw) : [];
      const basket: LeaderboardEntry[] = basketRaw ? JSON.parse(basketRaw) : [];

      setBirdLeaderboard(bird);
      setEndlessLeaderboard(endless);
      setBasketLeaderboard(basket);
      
      // Calculate overall average
      const playerScores: Record<string, {bird: number, endless: number, basket: number}> = {};
      
      [...bird, ...endless, ...basket].forEach(entry => {
        if (!playerScores[entry.name]) {
          playerScores[entry.name] = { bird: 0, endless: 0, basket: 0 };
        }
      });
      
      bird.forEach(entry => playerScores[entry.name].bird = Math.max(playerScores[entry.name].bird, entry.score));
      endless.forEach(entry => playerScores[entry.name].endless = Math.max(playerScores[entry.name].endless, entry.score));
      basket.forEach(entry => playerScores[entry.name].basket = Math.max(playerScores[entry.name].basket, entry.score));
      
      const overall = Object.entries(playerScores).map(([name, scores]) => {
        return {
          name,
          average: Math.round((scores.bird + scores.endless + scores.basket) / 3)
        };
      }).sort((a, b) => b.average - a.average).slice(0, 5);
      
      setOverallLeaderboard(overall);

    } catch (e) {
      console.error("Failed to load leaderboards", e);
    }
  }, []);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      localStorage.setItem("playerName", playerName.trim());
      setIsNameSet(true);
    }
  };

  const handleChangeName = () => {
    setIsNameSet(false);
    localStorage.removeItem("playerName");
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#111116] text-[#e2e2e2] font-sans px-8 py-16 md:px-24 md:py-20 lg:px-48">
      {/* Header Logo */}
      <div className="mb-20">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          motion<span className="text-[#9d72ff]">.</span>
        </h1>
        <div className="w-8 h-[2px] bg-[#9d72ff] mt-2"></div>
      </div>

      {!isNameSet ? (
        <form onSubmit={handleSaveName} className="w-full flex flex-col gap-6 max-w-4xl mx-auto md:mx-0">
          <div className="border-b border-[#222] pb-6 flex items-center gap-6">
            <span className="text-[#9d72ff] font-mono text-xs font-medium w-6 pt-2">00</span>
            <div className="flex-1">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full bg-transparent text-4xl md:text-6xl font-bold tracking-tight focus:outline-none placeholder-[#333] lowercase"
                placeholder="masukkan nama"
                required
                autoFocus
              />
              <p className="text-[#888] text-sm mt-3 lowercase">siapa yang bermain hari ini?</p>
            </div>
            <button type="submit" className="text-[#9d72ff] text-2xl hover:translate-x-2 transition-transform">→</button>
          </div>
        </form>
      ) : (
        <div className="w-full flex flex-col w-full max-w-4xl mx-auto md:mx-0">
          <div className="mb-8 flex items-center justify-between border-b border-[#222] pb-4">
            <p className="text-[#888] text-sm lowercase">
              selamat datang kembali, <span className="text-[#e2e2e2]">{playerName}</span>.
            </p>
            <button 
              onClick={handleChangeName}
              className="text-xs text-[#888] hover:text-[#9d72ff] transition-colors lowercase"
            >
              ganti pemain
            </button>
          </div>

          <div className="flex flex-col">
            {/* Link 1 */}
            <Link href="/endless_runner" className="group flex items-start gap-6 py-8 border-b border-[#222] hover:border-[#444] transition-colors cursor-pointer">
              <span className="text-[#9d72ff] font-mono text-xs font-medium w-6 pt-3">01</span>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-4">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase">endless runner</h2>
                  <span className="bg-[#bba6ff] text-[#111116] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider hidden md:inline-block">populer</span>
                </div>
                <p className="text-[#888] text-sm mt-2 lowercase">lari tanpa batas, dikendalikan oleh kamera.</p>
              </div>
              <span className="text-[#9d72ff] text-xl opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 duration-300 pt-2">→</span>
            </Link>

            {/* Link 2 */}
            <Link href="/bird_runner" className="group flex items-start gap-6 py-8 border-b border-[#222] hover:border-[#444] transition-colors cursor-pointer">
              <span className="text-[#9d72ff] font-mono text-xs font-medium w-6 pt-3">02</span>
              <div className="flex-1 flex flex-col">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase">bird runner</h2>
                <p className="text-[#888] text-sm mt-2 lowercase">kepakkan sayapmu untuk terbang.</p>
              </div>
              <span className="text-[#9d72ff] text-xl opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 duration-300 pt-2">→</span>
            </Link>

            {/* Link 3 */}
            <Link href="/basket_shoot" className="group flex items-start gap-6 py-8 border-b border-[#222] hover:border-[#444] transition-colors cursor-pointer">
              <span className="text-[#9d72ff] font-mono text-xs font-medium w-6 pt-3">03</span>
              <div className="flex-1 flex flex-col">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase">basket shoot</h2>
                <p className="text-[#888] text-sm mt-2 lowercase">lompat dan tembak bolanya.</p>
              </div>
              <span className="text-[#9d72ff] text-xl opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 duration-300 pt-2">→</span>
            </Link>

            {/* Leaderboard Button */}
            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="group flex items-start gap-6 py-8 border-b border-[#222] hover:border-[#444] transition-colors cursor-pointer w-full text-left"
            >
              <span className="text-[#9d72ff] font-mono text-xs font-medium w-6 pt-3">**</span>
              <div className="flex-1 flex flex-col">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase text-[#ffd700]">leaderboard</h2>
                <p className="text-[#888] text-sm mt-2 lowercase">lihat rekor terbaik semua mode.</p>
              </div>
              <span className="text-[#9d72ff] text-xl opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 duration-300 pt-2">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111116] border border-[#333] rounded-2xl w-full max-w-6xl p-6 md:p-12 relative my-8 shadow-2xl">
            <button 
              onClick={() => setIsLeaderboardOpen(false)} 
              className="absolute top-6 right-6 text-[#888] hover:text-white text-3xl font-bold transition-colors"
            >
              &times;
            </button>
            <h2 className="text-3xl md:text-5xl font-bold mb-12 text-[#e2e2e2] lowercase">
              leaderboard global<span className="text-[#9d72ff]">.</span>
            </h2>
            
            {/* Overall MVP Leaderboard */}
            <div className="w-full mb-12">
              <div className="bg-gradient-to-r from-[#2a1a4a] to-[#1a1a24] p-8 rounded-2xl border border-[#9d72ff]/30 shadow-[0_0_30px_rgba(157,114,255,0.15)]">
                <h3 className="text-2xl font-bold text-[#ffd700] mb-6 lowercase flex items-center gap-4">
                  <span>🏆</span> champion of champions <span className="text-[#888] text-sm font-normal">(rata-rata skor 3 mode)</span>
                </h3>
                {overallLeaderboard.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overallLeaderboard.map((entry, idx) => (
                      <div key={idx} className={`flex justify-between items-center bg-[#111116]/80 p-4 rounded-xl border ${idx === 0 ? 'border-[#ffd700]/50 shadow-[0_0_15px_rgba(255,215,0,0.2)] scale-105 relative z-10' : 'border-[#333]'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`font-mono font-bold text-lg ${idx === 0 ? 'text-[#ffd700]' : idx === 1 ? 'text-[#c0c0c0]' : idx === 2 ? 'text-[#cd7f32]' : 'text-[#555]'}`}>#{idx + 1}</span>
                          <span className="font-bold text-xl uppercase tracking-widest truncate max-w-[150px] text-white">{entry.name}</span>
                        </div>
                        <span className="font-bold text-[#9d72ff] text-2xl">{entry.average}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#555] text-sm lowercase py-4">belum ada data pemain untuk dihitung rata-ratanya.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Endless Runner */}
              <div className="flex flex-col bg-[#1a1a24] p-6 rounded-xl border border-[#222]">
                <h3 className="text-xl font-bold text-[#e2e2e2] mb-6 lowercase border-b border-[#333] pb-2">endless runner</h3>
                {endlessLeaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {endlessLeaderboard.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#111116] p-3 rounded-lg border border-[#222]">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold text-sm ${idx === 0 ? 'text-[#ffd700]' : idx === 1 ? 'text-[#c0c0c0]' : idx === 2 ? 'text-[#cd7f32]' : 'text-[#555]'}`}>#{idx + 1}</span>
                          <span className="font-bold text-md uppercase tracking-widest truncate max-w-[120px]">{entry.name}</span>
                        </div>
                        <span className="font-bold text-[#9d72ff] text-lg">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#555] text-sm lowercase text-center py-8">belum ada rekor.</p>
                )}
              </div>

              {/* Bird Runner */}
              <div className="flex flex-col bg-[#1a1a24] p-6 rounded-xl border border-[#222]">
                <h3 className="text-xl font-bold text-[#e2e2e2] mb-6 lowercase border-b border-[#333] pb-2">bird runner</h3>
                {birdLeaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {birdLeaderboard.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#111116] p-3 rounded-lg border border-[#222]">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold text-sm ${idx === 0 ? 'text-[#ffd700]' : idx === 1 ? 'text-[#c0c0c0]' : idx === 2 ? 'text-[#cd7f32]' : 'text-[#555]'}`}>#{idx + 1}</span>
                          <span className="font-bold text-md uppercase tracking-widest truncate max-w-[120px]">{entry.name}</span>
                        </div>
                        <span className="font-bold text-[#9d72ff] text-lg">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#555] text-sm lowercase text-center py-8">belum ada rekor.</p>
                )}
              </div>

              {/* Basket Shoot */}
              <div className="flex flex-col bg-[#1a1a24] p-6 rounded-xl border border-[#222]">
                <h3 className="text-xl font-bold text-[#e2e2e2] mb-6 lowercase border-b border-[#333] pb-2">basket shoot</h3>
                {basketLeaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {basketLeaderboard.map((entry, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#111116] p-3 rounded-lg border border-[#222]">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold text-sm ${idx === 0 ? 'text-[#ffd700]' : idx === 1 ? 'text-[#c0c0c0]' : idx === 2 ? 'text-[#cd7f32]' : 'text-[#555]'}`}>#{idx + 1}</span>
                          <span className="font-bold text-md uppercase tracking-widest truncate max-w-[120px]">{entry.name}</span>
                        </div>
                        <span className="font-bold text-[#9d72ff] text-lg">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#555] text-sm lowercase text-center py-8">belum ada rekor.</p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}
