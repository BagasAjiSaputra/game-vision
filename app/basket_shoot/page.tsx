"use client";

import { useState } from "react";
import BasketPoseController, { BasketPoseState } from "@/components/BasketPoseController";
import BasketGame from "@/components/BasketGame";

export default function BasketShootPage() {
  const [poseState, setPoseState] = useState<BasketPoseState | null>(null);

  return (
    <main className="w-screen h-screen overflow-hidden bg-black relative">
      <BasketGame poseState={poseState} />
      <BasketPoseController onPoseState={setPoseState} />
      
      {/* Tombol kembali ke menu utama */}
      <a 
        href="/" 
        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-medium border border-white/30 transition-all"
      >
        Kembali ke Menu
      </a>
    </main>
  );
}
