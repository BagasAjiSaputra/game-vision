"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const router = useRouter();

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
          </div>
        </div>
      )}
    </main>
  );
}
