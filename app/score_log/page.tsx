"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Search, Activity, Calendar } from "lucide-react";
import { getGameScores } from "@/app/actions";

interface ScoreLog {
  id: string;
  player_name: string;
  game_type: string;
  score: number;
  created_at: string;
}

export default function ScoreLogPage() {
  const [logs, setLogs] = useState<ScoreLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGame, setFilterGame] = useState<string>("all");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getGameScores();
        
      if (!response.success) throw new Error(response.error);
      setLogs(response.data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchGame = filterGame === "all" || log.game_type === filterGame;
    const matchName = log.player_name.toLowerCase().includes(searchName.toLowerCase());
    return matchGame && matchName;
  });

  const getGameName = (type: string) => {
    switch(type) {
      case 'endless_runner': return 'Endless Runner';
      case 'heli_runner': return 'Heli Runner';
      case 'basket_shoot': return 'Basket Shoot';
      default: return type;
    }
  };

  const getGameColor = (type: string) => {
    switch(type) {
      case 'endless_runner': return 'text-[#d4ff00] bg-[#d4ff00]/10 border-[#d4ff00]/30';
      case 'heli_runner': return 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';
      case 'basket_shoot': return 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/30';
      default: return 'text-white bg-white/10 border-white/30';
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0d0c] text-white overflow-hidden relative font-sans">
      <div className="z-20 w-full mx-auto px-6 py-12 md:px-12 md:py-16 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-14 h-14 rounded-full bg-[#1c1e1c] flex items-center justify-center text-[#a0a0a0] border border-white/5 hover:border-white/50 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <p className="text-[#a0a0a0] text-sm">Dashboard Data</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Log Skor Global</h1>
            </div>
          </div>
          
          <button onClick={fetchLogs} className="px-6 py-3 rounded-full bg-[#1c1e1c] border-2 border-[#2a2d2a] flex items-center gap-2 hover:bg-[#2a2d2a] transition-all shadow-[0_4px_0_0_#2a2d2a] active:translate-y-[4px] active:shadow-none font-bold text-sm">
            <Activity className="w-4 h-4" /> REFRESH DATA
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#1c1e1c] p-6 rounded-3xl border border-white/5 mb-8 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Cari nama pemain..." 
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-[#0a0d0c] border border-white/10 rounded-full py-4 pl-12 pr-6 text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {['all', 'endless_runner', 'heli_runner', 'basket_shoot'].map(filter => (
              <button 
                key={filter}
                onClick={() => setFilterGame(filter)}
                className={`px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-colors border ${filterGame === filter ? 'bg-white text-black border-white' : 'bg-[#0a0d0c] text-[#a0a0a0] border-white/10 hover:border-white/30'}`}
              >
                {filter === 'all' ? 'Semua Game' : getGameName(filter)}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table / List */}
        <div className="flex-1 bg-[#1c1e1c] rounded-3xl border border-white/5 overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 gap-4 p-6 border-b border-white/5 text-[#a0a0a0] font-bold text-xs uppercase tracking-wider hidden md:grid">
            <div className="col-span-4">Pemain</div>
            <div className="col-span-3">Permainan</div>
            <div className="col-span-3">Tanggal</div>
            <div className="col-span-2 text-right">Skor</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-0">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="flex flex-col gap-3 md:gap-0">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-[#0a0d0c] md:bg-transparent rounded-2xl md:rounded-none md:border-b border-white/5 hover:bg-white/5 transition-colors items-center">
                    
                    <div className="md:col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.player_name}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-bold text-lg">{log.player_name}</span>
                    </div>
                    
                    <div className="md:col-span-3 flex items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGameColor(log.game_type)}`}>
                        {getGameName(log.game_type)}
                      </span>
                    </div>
                    
                    <div className="md:col-span-3 flex items-center gap-2 text-[#a0a0a0] text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    
                    <div className="md:col-span-2 flex md:justify-end items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500 md:hidden" />
                      <span className="font-black text-2xl md:text-xl text-white">{log.score}</span>
                    </div>
                    
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-[#a0a0a0]">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Tidak ada data ditemukan</p>
              </div>
            )}
          </div>
        </div>

      </div>
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
