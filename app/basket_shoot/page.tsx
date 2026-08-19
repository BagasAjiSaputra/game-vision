"use client";

import { useState } from "react";
import BasketPoseController, { BasketPoseState } from "@/components/BasketPoseController";
import BasketGame from "@/components/BasketGame";
import Link from "next/link";

export default function BasketShootPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [poseState, setPoseState] = useState<BasketPoseState | null>(null);

  const startGame = () => {
    setIsPlaying(true);
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#111116] text-[#e2e2e2] overflow-hidden relative font-sans">
      {!isPlaying && (
        <div className="z-20 w-full max-w-4xl mx-auto px-8 py-16 md:px-24 md:py-20 flex flex-col bg-[#111116] absolute inset-0 overflow-y-auto">
          {/* Logo */}
          <div className="mb-16">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#e2e2e2] lowercase">
              basket shoot<span className="text-[#9d72ff]">.</span>
            </h1>
            <div className="w-8 h-[2px] bg-[#9d72ff] mt-2"></div>
          </div>

          <div className="w-full flex flex-col mb-12">
            <h3 className="text-[#888] text-sm lowercase mb-6 border-b border-[#222] pb-2">kendali (mediapipe ai)</h3>
            <p className="text-[#888] text-sm mb-4 lowercase">posisikan diri anda di depan kamera.</p>
            <ul className="text-[#e2e2e2] space-y-4 text-xl md:text-2xl lowercase tracking-tight">
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">01</span> <span className="text-[#888] text-sm w-44">lompat</span> lempar bola</li>
              <li className="flex items-center gap-4"><span className="text-[#9d72ff] text-sm">02</span> <span className="text-[#888] text-sm w-44">geser kiri/kanan</span> mengarahkan bidikan</li>
            </ul>
          </div>

          <button
            onClick={startGame}
            className="group flex items-start gap-6 py-8 border-t border-b border-[#222] hover:border-[#444] transition-colors cursor-pointer w-full text-left mt-auto"
          >
            <span className="text-[#9d72ff] font-mono text-xs font-medium w-6 pt-3">00</span>
            <div className="flex-1 flex flex-col">
               <h2 className="text-4xl md:text-6xl font-bold tracking-tight lowercase text-[#e2e2e2]">mulai game</h2>
               <p className="text-[#888] text-sm mt-2 lowercase">cetak poinmu.</p>
            </div>
            <span className="text-[#9d72ff] text-xl opacity-50 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 duration-300 pt-2">→</span>
          </button>
          
          <Link href="/" className="mt-8 text-[#888] text-sm hover:text-[#9d72ff] transition-colors lowercase inline-flex items-center gap-2">
            <span>←</span> kembali ke menu
          </Link>
        </div>
      )}

      {isPlaying && (
        <div className="absolute inset-0 w-full h-full bg-black">
          <BasketGame poseState={poseState} />
          <BasketPoseController onPoseState={setPoseState} />
        </div>
      )}
    </main>
  );
}
