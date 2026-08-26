"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, RefreshCw, ArrowRight, Trophy } from "lucide-react";

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
    <main className="flex min-h-screen flex-col bg-[#0a0d0c] text-white font-sans px-6 py-12 md:px-12 md:py-16 w-full">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-[#1c1e1c] flex items-center justify-center overflow-hidden shrink-0">
             {/* <Activity className="w-6 h-6 text-[#d4ff00]" /> */}
          </div>
          <div>
            <p className="text-[#a0a0a0] text-xs">Selamat Pagi!</p>
            <h1 className="text-lg font-bold">{isNameSet ? playerName : "Pemain"}</h1>
          </div>
        </div>
        
        {isNameSet && (
          <button 
            onClick={handleChangeName}
            className="w-10 h-10 rounded-full bg-[#1c1e1c] flex items-center justify-center text-[#a0a0a0] border border-white/5 hover:border-[#d4ff00]/50 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {!isNameSet ? (
        <div className="flex flex-col flex-1 justify-center max-w-xl mx-auto w-full">
           <h2 className="text-3xl font-bold mb-6 tracking-tight">Siapa yang<br/>bermain hari ini?</h2>
           <form onSubmit={handleSaveName} className="flex gap-2">
             <input
               type="text"
               value={playerName}
               onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
               className="flex-1 bg-[#1c1e1c] border border-white/5 rounded-full px-6 py-4 text-white font-bold focus:outline-none focus:border-[#d4ff00] transition-colors placeholder:text-[#555] uppercase"
               placeholder="MASUKKAN NAMA"
               required
               autoFocus
               maxLength={15}
             />
             <button type="submit" className="w-14 h-14 rounded-full bg-[#d4ff00] text-black flex items-center justify-center font-bold hover:scale-105 transition-transform shrink-0">
               <ArrowRight className="w-6 h-6" />
             </button>
           </form>
        </div>
      ) : (
        <div className="flex flex-col h-full w-full pb-20">
          
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold">Pilih permainan<br/><span className="text-[#d4ff00]">Favoritmu</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Endless Runner */}
            <Link href="/endless_runner" className="group rounded-3xl bg-[#1c1e1c] text-white p-6 border-2 border-[#2a2d2a] flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-1 hover:bg-[#d4ff00] hover:text-black hover:border-[#d4ff00] shadow-[0_8px_0_0_#2a2d2a] hover:shadow-[0_10px_0_0_#9bb800] active:translate-y-[8px] active:shadow-none min-h-[220px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 group-hover:bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none transition-colors"></div>
              <div>
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Endless<br/>Runner</h3>
                   <span className="bg-white/5 group-hover:bg-black text-[#a0a0a0] group-hover:text-[#d4ff00] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider transition-colors">Populer</span>
                 </div>
                 <p className="text-[#a0a0a0] group-hover:text-black/60 text-sm font-medium mt-1 transition-colors">Berlari dan hindari rintangan</p>
              </div>
              <div className="flex items-center gap-3 mt-auto">
                 <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-black flex items-center justify-center text-white transition-colors"><ArrowRight className="w-5 h-5" /></div>
                 <span className="font-bold text-sm uppercase text-[#a0a0a0] group-hover:text-black transition-colors">Mainkan</span>
              </div>
            </Link>

            {/* Bird Runner */}
            <Link href="/bird_runner" className="group rounded-3xl bg-[#1c1e1c] text-white p-6 border-2 border-[#2a2d2a] flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-1 hover:bg-[#d4ff00] hover:text-black hover:border-[#d4ff00] shadow-[0_8px_0_0_#2a2d2a] hover:shadow-[0_10px_0_0_#9bb800] active:translate-y-[8px] active:shadow-none min-h-[220px]">
              <div>
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Bird<br/>Runner</h3>
                 </div>
                 <p className="text-[#a0a0a0] group-hover:text-black/60 text-sm font-medium mt-1 transition-colors">Kepakkan sayapmu untuk terbang</p>
              </div>
              <div className="flex items-center gap-3 mt-auto">
                 <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-black flex items-center justify-center text-white transition-colors"><ArrowRight className="w-5 h-5" /></div>
                 <span className="font-bold text-sm uppercase text-[#a0a0a0] group-hover:text-black transition-colors">Mainkan</span>
              </div>
            </Link>

            {/* Basket Shoot */}
            <Link href="/basket_shoot" className="group rounded-3xl bg-[#1c1e1c] text-white p-6 border-2 border-[#2a2d2a] flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-1 hover:bg-[#d4ff00] hover:text-black hover:border-[#d4ff00] shadow-[0_8px_0_0_#2a2d2a] hover:shadow-[0_10px_0_0_#9bb800] active:translate-y-[8px] active:shadow-none min-h-[220px]">
              <div>
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-2xl font-black uppercase tracking-tight">Basket<br/>Shoot</h3>
                 </div>
                 <p className="text-[#a0a0a0] group-hover:text-black/60 text-sm font-medium mt-1 transition-colors">Lompat dan tembak bola</p>
              </div>
              <div className="flex items-center gap-3 mt-auto">
                 <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-black flex items-center justify-center text-white transition-colors"><ArrowRight className="w-5 h-5" /></div>
                 <span className="font-bold text-sm uppercase text-[#a0a0a0] group-hover:text-black transition-colors">Mainkan</span>
              </div>
            </Link>

          </div>

          <div className="mt-12">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-lg font-bold">Rekor Tertinggi</h3>
              <Link href="/score_log" className="text-[#a0a0a0] text-xs cursor-pointer hover:text-white">Lihat Papan Peringkat</Link>
            </div>
            
            <Link 
               href="/score_log"
               className="block rounded-3xl bg-[#1c1e1c] text-white border-2 border-[#2a2d2a] p-5 flex items-center justify-between cursor-pointer hover:-translate-y-1 hover:border-[#d4ff00] hover:shadow-[0_8px_0_0_#9bb800] hover:bg-[#d4ff00] hover:text-black group transition-all shadow-[0_6px_0_0_#2a2d2a] active:translate-y-[6px] active:shadow-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 group-hover:bg-black/10 flex items-center justify-center text-yellow-500 group-hover:text-black transition-colors"><Trophy className="w-6 h-6" /></div>
                <div>
                  <p className="font-bold">Papan Peringkat Global</p>
                  <p className="text-[#a0a0a0] group-hover:text-black/70 text-xs mt-1 transition-colors">Lihat rekor terbaik di semua mode</p>
                </div>
              </div>
              <div className="text-[#a0a0a0] group-hover:text-black transition-colors"><ArrowRight className="w-5 h-5" /></div>
            </Link>
          </div>

        </div>
      )}

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
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-black/10' : 'bg-white/5'}`}>
                             #{idx + 1}
                           </div>
                           <span className="font-bold">{entry.name}</span>
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
                            <span className="text-xs text-[#a0a0a0]">#{idx+1}</span>
                            <span className="font-medium text-sm">{entry.name}</span>
                          </div>
                          <span className="font-bold text-sm">{entry.score}</span>
                       </div>
                     )) : (
                       <p className="text-[#a0a0a0] text-xs">Belum ada data.</p>
                     )}
                   </div>
                </div>

                {/* Bird Runner */}
                <div>
                   <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Bird Runner</h3>
                   <div className="space-y-2">
                     {birdLeaderboard.length > 0 ? birdLeaderboard.map((entry, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-black/30 border border-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#a0a0a0]">#{idx+1}</span>
                            <span className="font-medium text-sm">{entry.name}</span>
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
                            <span className="text-xs text-[#a0a0a0]">#{idx+1}</span>
                            <span className="font-medium text-sm">{entry.name}</span>
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
