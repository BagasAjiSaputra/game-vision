"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, RefreshCw, ArrowRight, Trophy, Sun, Moon } from "lucide-react";
import { getLeaderboards } from "@/app/actions";

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function Home() {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(true);
  const [gameDuration, setGameDuration] = useState(300);
  
  const [heliLeaderboard, setHeliLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [endlessLeaderboard, setEndlessLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [basketLeaderboard, setBasketLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [overallLeaderboard, setOverallLeaderboard] = useState<{name: string, average: number}[]>([]);
  
  const [randomSeed, setRandomSeed] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem('isLightMode');
    if (saved) setIsLightMode(saved === 'true');
    const savedTime = localStorage.getItem('gameDuration');
    if (savedTime) setGameDuration(parseInt(savedTime));
  }, []);

  useEffect(() => {
    setRandomSeed(Math.random().toString(36).substring(7));

    // Load leaderboards from Supabase
    const fetchLeaderboards = async () => {
      try {
        const response = await getLeaderboards();
        if (response.success && response.data) {
          const heli = response.data.heli || [];
          const endless = response.data.endless || [];
          const basket = response.data.basket || [];
          
          setHeliLeaderboard(heli);
          setEndlessLeaderboard(endless);
          setBasketLeaderboard(basket);
          
          // Calculate overall average
          const playerScores: Record<string, {heli: number, endless: number, basket: number}> = {};
          
          [...heli, ...endless, ...basket].forEach(entry => {
            if (!playerScores[entry.name]) {
              playerScores[entry.name] = { heli: 0, endless: 0, basket: 0 };
            }
          });
          
          heli.forEach(entry => playerScores[entry.name].heli = Math.max(playerScores[entry.name].heli, entry.score));
          endless.forEach(entry => playerScores[entry.name].endless = Math.max(playerScores[entry.name].endless, entry.score));
          basket.forEach(entry => playerScores[entry.name].basket = Math.max(playerScores[entry.name].basket, entry.score));
          
          const overall = Object.entries(playerScores).map(([name, scores]) => {
            return {
              name,
              average: Math.round((scores.heli + scores.endless + scores.basket) / 3)
            };
          }).sort((a, b) => b.average - a.average).slice(0, 5);
          
          setOverallLeaderboard(overall);
        }
      } catch (e) {
        console.error("Failed to load leaderboards", e);
      }
    };
    
    fetchLeaderboards();
  }, []);

  return (
    <main className={`flex min-h-screen flex-col font-sans px-6 py-12 md:px-12 md:py-16 w-full transition-colors duration-300 ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0d0c] text-white'}`}>
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-[#1c1e1c] flex items-center justify-center overflow-hidden shrink-0">
             {randomSeed && <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`} alt="Profile" className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Selamat Pagi!</p>
            <h1 className="text-lg font-bold">Pemain</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Game Duration Selector */}
          <div className={`flex items-center p-1 rounded-full border ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1e1c] border-white/5'}`}>
            {[60, 180, 300].map((time) => (
              <button
                key={time}
                onClick={() => { setGameDuration(time); localStorage.setItem('gameDuration', String(time)); }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${gameDuration === time ? (isLightMode ? 'bg-emerald-500 text-white shadow-md' : 'bg-[#d4ff00] text-black') : (isLightMode ? 'text-slate-500 hover:bg-slate-100' : 'text-[#a0a0a0] hover:text-white')}`}
              >
                {time / 60}m
              </button>
            ))}
          </div>

          <button 
            onClick={() => { const next = !isLightMode; setIsLightMode(next); localStorage.setItem('isLightMode', String(next)); }} 
            className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all ${isLightMode ? 'bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-100' : 'bg-[#1c1e1c] text-[#a0a0a0] hover:text-white border border-white/5'}`}
          >
            {isLightMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full w-full pb-20">
          
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold">Pilih permainan<br/><span className={isLightMode ? "text-indigo-600" : "text-[#d4ff00]"}>Favoritmu</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Endless Runner */}
            <Link href="/endless_runner" className={`group rounded-3xl p-6 border-2 flex flex-col justify-between relative overflow-hidden transition-all min-h-[220px] ${isLightMode ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-600 text-white shadow-[0_8px_0_0_#047857] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#064e3b] active:translate-y-[8px] active:shadow-none' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] hover:-translate-y-1 hover:bg-[#d4ff00] hover:text-black hover:border-[#d4ff00] shadow-[0_8px_0_0_#2a2d2a] hover:shadow-[0_10px_0_0_#9bb800] active:translate-y-[8px] active:shadow-none'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 group-hover:bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-colors"></div>
              <div>
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Endless<br/>Runner</h3>
                   <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-colors ${isLightMode ? 'bg-white/20 text-white' : 'bg-white/5 group-hover:bg-black text-[#a0a0a0] group-hover:text-[#d4ff00]'}`}>Populer</span>
                 </div>
                 <p className={`text-sm font-medium mt-1 transition-colors ${isLightMode ? 'text-emerald-100' : 'text-[#a0a0a0] group-hover:text-black/60'}`}>Berlari dan hindari rintangan</p>
              </div>
              <div className="flex items-center gap-3 mt-auto">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLightMode ? 'bg-white/20 text-white' : 'bg-white/10 group-hover:bg-black text-white'}`}><ArrowRight className="w-5 h-5" /></div>
                 <span className={`font-bold text-sm uppercase transition-colors ${isLightMode ? 'text-white' : 'text-[#a0a0a0] group-hover:text-black'}`}>Mainkan</span>
              </div>
            </Link>

            {/* Heli Runner */}
            <Link href="/heli_runner" className={`group rounded-3xl p-6 border-2 flex flex-col justify-between relative overflow-hidden transition-all min-h-[220px] ${isLightMode ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-600 text-white shadow-[0_8px_0_0_#1d4ed8] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#1e3a8a] active:translate-y-[8px] active:shadow-none' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] hover:-translate-y-1 hover:bg-[#d4ff00] hover:text-black hover:border-[#d4ff00] shadow-[0_8px_0_0_#2a2d2a] hover:shadow-[0_10px_0_0_#9bb800] active:translate-y-[8px] active:shadow-none'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 group-hover:bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-colors"></div>
              <div>
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Heli<br/>Runner</h3>
                 </div>
                 <p className={`text-sm font-medium mt-1 transition-colors ${isLightMode ? 'text-blue-100' : 'text-[#a0a0a0] group-hover:text-black/60'}`}>Kepakkan sayapmu untuk terbang</p>
              </div>
              <div className="flex items-center gap-3 mt-auto">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLightMode ? 'bg-white/20 text-white' : 'bg-white/10 group-hover:bg-black text-white'}`}><ArrowRight className="w-5 h-5" /></div>
                 <span className={`font-bold text-sm uppercase transition-colors ${isLightMode ? 'text-white' : 'text-[#a0a0a0] group-hover:text-black'}`}>Mainkan</span>
              </div>
            </Link>

            {/* Basket Shoot */}
            <Link href="/basket_shoot" className={`group rounded-3xl p-6 border-2 flex flex-col justify-between relative overflow-hidden transition-all min-h-[220px] ${isLightMode ? 'bg-gradient-to-br from-orange-400 to-orange-600 border-orange-600 text-white shadow-[0_8px_0_0_#c2410c] hover:-translate-y-1 hover:shadow-[0_10px_0_0_#9a3412] active:translate-y-[8px] active:shadow-none' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] hover:-translate-y-1 hover:bg-[#d4ff00] hover:text-black hover:border-[#d4ff00] shadow-[0_8px_0_0_#2a2d2a] hover:shadow-[0_10px_0_0_#9bb800] active:translate-y-[8px] active:shadow-none'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 group-hover:bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-colors"></div>
              <div>
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Basket<br/>Shoot</h3>
                 </div>
                 <p className={`text-sm font-medium mt-1 transition-colors ${isLightMode ? 'text-orange-100' : 'text-[#a0a0a0] group-hover:text-black/60'}`}>Lompat dan tembak bola</p>
              </div>
              <div className="flex items-center gap-3 mt-auto">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLightMode ? 'bg-white/20 text-white' : 'bg-white/10 group-hover:bg-black text-white'}`}><ArrowRight className="w-5 h-5" /></div>
                 <span className={`font-bold text-sm uppercase transition-colors ${isLightMode ? 'text-white' : 'text-[#a0a0a0] group-hover:text-black'}`}>Mainkan</span>
              </div>
            </Link>

          </div>

          <div className="mt-12">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold">Rekor Tertinggi</h3>
              <Link href="/score_log" className={`text-xs cursor-pointer ${isLightMode ? 'text-indigo-600 hover:text-indigo-800 font-bold' : 'text-[#a0a0a0] hover:text-white'}`}>Lihat Papan Peringkat</Link>
            </div>
            
            <Link 
               href="/score_log"
               className={`block rounded-3xl border-2 p-5 flex items-center justify-between cursor-pointer group transition-all active:translate-y-[6px] active:shadow-none ${isLightMode ? 'bg-white text-slate-800 border-slate-200 hover:border-yellow-400 hover:shadow-[0_8px_0_0_#facc15] shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] hover:-translate-y-1 hover:border-[#d4ff00] hover:shadow-[0_8px_0_0_#9bb800] hover:bg-[#d4ff00] hover:text-black shadow-[0_6px_0_0_#2a2d2a]'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isLightMode ? 'bg-yellow-100 text-yellow-600 group-hover:bg-yellow-400 group-hover:text-white' : 'bg-yellow-500/10 group-hover:bg-black/10 text-yellow-500 group-hover:text-black'}`}><Trophy className="w-6 h-6" /></div>
                <div>
                  <p className="font-bold">Papan Peringkat Global</p>
                  <p className={`text-xs mt-1 transition-colors ${isLightMode ? 'text-slate-500 group-hover:text-slate-700' : 'text-[#a0a0a0] group-hover:text-black/70'}`}>Lihat rekor terbaik di semua mode</p>
                </div>
              </div>
              <div className={`transition-colors ${isLightMode ? 'text-slate-400 group-hover:text-yellow-500' : 'text-[#a0a0a0] group-hover:text-black'}`}><ArrowRight className="w-5 h-5" /></div>
            </Link>
          </div>

        </div>

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c1e1c] border border-white/5 rounded-3xl w-full max-w-4xl p-6 relative flex flex-col h-[85vh]">
            <button 
              onClick={() => setIsLeaderboardOpen(false)} 
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#a0a0a0] hover:text-white transition-colors"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-white">Papan Peringkat Global</h2>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 hide-scrollbar">
              
              {/* Overall MVP Leaderboard */}
              <div>
                <h3 className="text-lg font-bold text-[#d4ff00] mb-4 flex items-center gap-2">
                  🏆 Juara (Rata-rata Skor)
                </h3>
                {overallLeaderboard.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {overallLeaderboard.map((entry, idx) => (
                      <div key={idx} className={`rounded-2xl p-4 flex items-center justify-between ${idx === 0 ? 'bg-[#d4ff00] text-black' : 'bg-black/30 border border-white/5 text-white'}`}>
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${idx === 0 ? 'bg-black/10' : 'bg-white/5'}`}>
                             #{idx + 1}
                           </div>
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`} alt="Avatar" className="w-8 h-8 rounded-full bg-black/40 shrink-0" />
                           <span className="font-bold truncate">{entry.name}</span>
                         </div>
                         <span className="font-black text-lg">{entry.average}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#a0a0a0] text-sm bg-black/30 p-4 rounded-2xl border border-dashed border-white/10">Belum ada rekor.</p>
                )}
              </div>

              {/* Individual Leaderboards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Endless Runner */}
                <div>
                   <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Endless Runner</h3>
                   <div className="space-y-2">
                     {endlessLeaderboard.length > 0 ? endlessLeaderboard.map((entry, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-black/30 border border-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#a0a0a0] w-4 shrink-0">#{idx+1}</span>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`} alt="Avatar" className="w-6 h-6 rounded-full bg-black/40 shrink-0" />
                            <span className="font-medium text-sm truncate">{entry.name}</span>
                          </div>
                          <span className="font-bold text-sm">{entry.score}</span>
                       </div>
                     )) : (
                       <p className="text-[#a0a0a0] text-xs">Belum ada data.</p>
                     )}
                   </div>
                </div>

                {/* Heli Runner */}
                <div>
                   <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Heli Runner</h3>
                   <div className="space-y-2">
                     {heliLeaderboard.length > 0 ? heliLeaderboard.map((entry, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-black/30 border border-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#a0a0a0] w-4 shrink-0">#{idx+1}</span>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`} alt="Avatar" className="w-6 h-6 rounded-full bg-black/40 shrink-0" />
                            <span className="font-medium text-sm truncate">{entry.name}</span>
                          </div>
                          <span className="font-bold text-sm">{entry.score}</span>
                       </div>
                     )) : (
                       <p className="text-[#a0a0a0] text-xs">No data.</p>
                     )}
                   </div>
                </div>

                {/* Basket Shoot */}
                <div>
                   <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Basket Shoot</h3>
                   <div className="space-y-2">
                     {basketLeaderboard.length > 0 ? basketLeaderboard.map((entry, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-black/30 border border-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#a0a0a0] w-4 shrink-0">#{idx+1}</span>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.name}`} alt="Avatar" className="w-6 h-6 rounded-full bg-black/40 shrink-0" />
                            <span className="font-medium text-sm truncate">{entry.name}</span>
                          </div>
                          <span className="font-bold text-sm">{entry.score}</span>
                       </div>
                     )) : (
                       <p className="text-[#a0a0a0] text-xs">No data.</p>
                     )}
                   </div>
                </div>

              </div>
              
            </div>
          </div>
        </div>
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
