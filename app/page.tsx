"use client";

import { useState } from "react";
import Game from "@/components/Game";
import PoseController, { PoseAction } from "@/components/PoseController";

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [action, setAction] = useState<PoseAction>("none");

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
  };

  const handleGameOver = () => {
    setIsPlaying(false);
    setIsGameOver(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white overflow-hidden relative">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-center pointer-events-none">
        <h1 className="text-2xl font-bold italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          MOTION RUNNER
        </h1>
        {isPlaying && (
          <div className="text-xl font-mono bg-black/50 px-4 py-2 rounded-lg">
            SCORE: {score}
          </div>
        )}
      </div>

      {/* Main Menu / Game Over Screen */}
      {!isPlaying && (
        <div className="z-20 flex flex-col items-center bg-black/80 p-8 rounded-2xl backdrop-blur-sm border border-gray-700 shadow-2xl">
          <h2 className="text-4xl font-black mb-2 text-white">
            {isGameOver ? "GAME OVER" : "READY?"}
          </h2>
          {isGameOver && (
            <p className="text-xl text-gray-300 mb-6">Final Score: {score}</p>
          )}
          <p className="text-sm text-gray-400 max-w-md text-center mb-8">
            Posisikan seluruh tubuh (atau minimal bagian pinggul dan lutut) terlihat di kamera. <br/><br/>
            🧍‍♂️ <strong>Cara Bermain:</strong><br/>
            Angkat <strong>Lutut Kiri</strong> ➔ Pindah Kiri<br/>
            Angkat <strong>Lutut Kanan</strong> ➔ Pindah Kanan<br/>
            Angkat <strong>Kedua Tangan</strong> (Lompat) ➔ Melompat
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-full text-lg shadow-lg transform transition hover:scale-105 active:scale-95"
          >
            {isGameOver ? "PLAY AGAIN" : "START GAME"}
          </button>
        </div>
      )}

      {/* Game and Camera Feed */}
      {isPlaying && (
        <>
          <div className="absolute inset-0 w-full h-full">
            <Game
              action={action}
              onGameOver={handleGameOver}
              onScoreUpdate={setScore}
            />
          </div>
          <PoseController onAction={setAction} />
          
          {/* Debug action indicator */}
          <div className="absolute bottom-4 left-4 z-50 bg-black/70 p-3 rounded-lg text-xs font-mono border border-gray-700">
            Current Action: <span className="text-green-400 font-bold uppercase">{action}</span>
          </div>
        </>
      )}
    </main>
  );
}
