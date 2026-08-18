"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const router = useRouter();

  // Load saved name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
      setIsNameSet(true);
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white overflow-hidden relative font-sans">
      {/* Dark tint backdrop overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-0"></div>

      <div className="z-20 flex flex-col items-center bg-slate-900/90 p-8 rounded-3xl backdrop-blur-xl border border-blue-500/40 shadow-[0_0_50px_rgba(59,130,246,0.2)] max-w-lg w-full mx-4">
        <h1 className="text-4xl font-black mb-1 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 text-center">
          MOTION GAMES
        </h1>
        <p className="text-xs text-blue-400 font-mono tracking-widest uppercase mb-8 text-center">
          Pilih Mode Permainan
        </p>

        {!isNameSet ? (
          <form onSubmit={handleSaveName} className="w-full flex flex-col items-center gap-4">
            <div className="w-full">
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-300 mb-2">
                Masukkan Nama Pemain:
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition-all"
                placeholder="Contoh: Budi"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95"
            >
              LANJUT
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col items-center w-full">
            <div className="mb-6 flex flex-col items-center">
              <p className="text-gray-400 text-sm">Selamat datang,</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-white">{playerName}</span>
                <button 
                  onClick={handleChangeName}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded-md transition-colors border border-gray-600"
                >
                  Ganti
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4 font-medium w-full border-b border-gray-800 pb-2">
              Pilih Game:
            </p>

            <div className="flex flex-col gap-3 w-full">
              {/* Game 1: Endless Runner */}
              <Link 
                href="/endless_runner" 
                className="group relative flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-800/60 hover:to-indigo-800/60 rounded-2xl border border-blue-500/30 hover:border-blue-400/60 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10 flex flex-col">
                  <span className="text-lg font-bold text-white">🏃‍♂️ Endless Runner</span>
                  <span className="text-xs text-blue-300">Lari tanpa batas menghindari rintangan</span>
                </div>
                <div className="relative z-10 text-blue-400 group-hover:translate-x-1 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
              </Link>

              {/* Game 2: Bird Runner */}
              <Link 
                href="/bird_runner" 
                className="group relative flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 hover:from-emerald-800/60 hover:to-teal-800/60 rounded-2xl border border-emerald-500/30 hover:border-emerald-400/60 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10 flex flex-col">
                  <span className="text-lg font-bold text-white">🚀 Bird Runner</span>
                  <span className="text-xs text-emerald-300">Kepakkan sayap untuk terbang</span>
                </div>
                <div className="relative z-10 text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
              </Link>

              {/* Game 3: Basket Shoot */}
              <Link 
                href="/basket_shoot" 
                className="group relative flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-orange-900/40 to-red-900/40 hover:from-orange-800/60 hover:to-red-800/60 rounded-2xl border border-orange-500/30 hover:border-orange-400/60 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-orange-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="relative z-10 flex flex-col">
                  <span className="text-lg font-bold text-white">🏀 Basket Shoot</span>
                  <span className="text-xs text-orange-300">Lompat dan tembak bola ke ring</span>
                </div>
                <div className="relative z-10 text-orange-400 group-hover:translate-x-1 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
