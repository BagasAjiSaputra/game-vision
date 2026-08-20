"use client";

import { useEffect, useRef, useState } from "react";

export type PoseState = {
  lane: number;
  isWalking: boolean;
  isJumping: boolean;
  isSliding: boolean;
};

interface PoseControllerProps {
  onPoseState: (state: PoseState) => void;
}

export default function PoseController({ onPoseState }: PoseControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Ref states
  const prevLandmarksRef = useRef<any>(null);
  const lastWalkTimeRef = useRef<number>(0);
  const lastEmittedStateRef = useRef<string>("");
  const baselineYRef = useRef<number | null>(null);

  // Fallback keyboard states
  const kbStateRef = useRef<{ lane: number; isJumping: boolean; isSliding: boolean }>({
    lane: 0,
    isJumping: false,
    isSliding: false,
  });

  // Handle Keyboard Fallback Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let changed = false;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        kbStateRef.current.lane = Math.max(-1, kbStateRef.current.lane - 1);
        changed = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        kbStateRef.current.lane = Math.min(1, kbStateRef.current.lane + 1);
        changed = true;
      } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        kbStateRef.current.isJumping = true;
        changed = true;
        setTimeout(() => {
          kbStateRef.current.isJumping = false;
        }, 600);
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        kbStateRef.current.isSliding = true;
        changed = true;
        setTimeout(() => {
          kbStateRef.current.isSliding = false;
        }, 600);
      }

      if (changed) {
        onPoseState({
          lane: kbStateRef.current.lane,
          isWalking: true,
          isJumping: kbStateRef.current.isJumping,
          isSliding: kbStateRef.current.isSliding,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPoseState]);
  
  useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    
    if (!videoElement || !canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");
    if (!canvasCtx) return;

    let pose: any = null;
    let isActive = true;
    let animationFrameId: number;

    const initMediaPipe = async () => {
      if (!(window as any).Pose) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
          script.async = true;
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      if (!isActive) return;

      const Pose = (window as any).Pose;
      pose = new Pose({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      pose.setOptions({
        modelComplexity: 0,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        if (!isActive) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        
        // Mirror horizontally
        canvasCtx.scale(-1, 1);
        canvasCtx.translate(-canvasElement.width, 0);
        
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        if (results.poseLandmarks) {
          const landmarks = results.poseLandmarks;
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];
          const leftElbow = landmarks[13];
          const rightElbow = landmarks[14];
          const leftWrist = landmarks[15];
          const rightWrist = landmarks[16];
          const leftHip = landmarks[23];
          const rightHip = landmarks[24];
          const leftKnee = landmarks[25];
          const rightKnee = landmarks[26];
          const leftAnkle = landmarks[27];
          const rightAnkle = landmarks[28];

          // Draw skeleton joints
          const drawJoint = (point: any, color: string) => {
            if (!point) return;
            canvasCtx.fillStyle = color;
            canvasCtx.beginPath();
            canvasCtx.arc(point.x * canvasElement.width, point.y * canvasElement.height, 4, 0, 2 * Math.PI);
            canvasCtx.fill();
          };

          const drawLine = (p1: any, p2: any, color: string) => {
            if (!p1 || !p2) return;
            canvasCtx.beginPath();
            canvasCtx.moveTo(p1.x * canvasElement.width, p1.y * canvasElement.height);
            canvasCtx.lineTo(p2.x * canvasElement.width, p2.y * canvasElement.height);
            canvasCtx.strokeStyle = color;
            canvasCtx.lineWidth = 2;
            canvasCtx.stroke();
          };

          // Draw lines
          drawLine(leftShoulder, rightShoulder, "#ffffff");
          drawLine(leftShoulder, leftHip, "#ffffff");
          drawLine(rightShoulder, rightHip, "#ffffff");
          drawLine(leftHip, rightHip, "#ffffff");
          
          drawLine(leftShoulder, leftElbow, "#ffffff");
          drawLine(leftElbow, leftWrist, "#ffffff");
          
          drawLine(rightShoulder, rightElbow, "#ffffff");
          drawLine(rightElbow, rightWrist, "#ffffff");
          
          drawLine(leftHip, leftKnee, "#ffffff");
          drawLine(leftKnee, leftAnkle, "#ffffff");
          
          drawLine(rightHip, rightKnee, "#ffffff");
          drawLine(rightKnee, rightAnkle, "#ffffff");

          drawJoint(leftShoulder, "#00ffcc");
          drawJoint(rightShoulder, "#00ffcc");
          drawJoint(leftElbow, "#00ffcc");
          drawJoint(rightElbow, "#00ffcc");
          drawJoint(leftHip, "#ff0077");
          drawJoint(rightHip, "#ff0077");
          drawJoint(leftKnee, "#ffcc00");
          drawJoint(rightKnee, "#ffcc00");
          drawJoint(leftAnkle, "#ffcc00");
          drawJoint(rightAnkle, "#ffcc00");
          drawJoint(leftWrist, "#00ff00");
          drawJoint(rightWrist, "#00ff00");

          // Lane detection based on body center X
          const centerX = (leftHip.x + rightHip.x) / 2;
          let lane = 0;
          if (centerX > 0.58) lane = -1; // Leaning left (mirrored)
          else if (centerX < 0.42) lane = 1;  // Leaning right (mirrored)

          // Vertical position (Y is 0 at top, 1 at bottom)
          const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

          // Adaptive baseline posture Y
          if (baselineYRef.current === null) {
            baselineYRef.current = shoulderY;
          } else {
            // Slow exponential moving average for baseline
            baselineYRef.current = baselineYRef.current * 0.98 + shoulderY * 0.02;
          }

          const currentBaseline = baselineYRef.current;

          // Jump detection: shoulder moves UP (smaller Y) or wrists raised above shoulders
          const handsUp = leftWrist.y < leftShoulder.y || rightWrist.y < rightShoulder.y;
          const isJumping = shoulderY < currentBaseline - 0.065 || handsUp;

          // Slide/Crouch detection: shoulder/hip drops DOWN (larger Y)
          const isSliding = shoulderY > currentBaseline + 0.06;

          // Walking / Motion detection (Running in place)
          const now = Date.now();
          if (prevLandmarksRef.current) {
            const prevLeftKnee = prevLandmarksRef.current[25];
            const prevRightKnee = prevLandmarksRef.current[26];
            
            // Hitung perubahan vertikal (Y) dan horizontal (X)
            const deltaL_Y = Math.abs(leftKnee.y - prevLeftKnee.y);
            const deltaR_Y = Math.abs(rightKnee.y - prevRightKnee.y);
            const deltaL_X = Math.abs(leftKnee.x - prevLeftKnee.x);
            const deltaR_X = Math.abs(rightKnee.x - prevRightKnee.x);
            
            // Gunakan threshold menengah agar lari lebih mudah terdeteksi tapi tetap menolak gerakan mikro
            const WALK_THRESHOLD_Y = 0.018;
            const WALK_THRESHOLD_X = 0.015;
            
            if (deltaL_Y > WALK_THRESHOLD_Y || deltaR_Y > WALK_THRESHOLD_Y || deltaL_X > WALK_THRESHOLD_X || deltaR_X > WALK_THRESHOLD_X) {
              lastWalkTimeRef.current = now;
            }
          }
          prevLandmarksRef.current = landmarks;
          
          // Kurangi waktu toleransi jalan agar karakter lebih cepat berhenti saat pemain diam
          const isWalking = (now - lastWalkTimeRef.current) < 400;

          // Emit state update when state changes
          const stateStr = `${lane},${isWalking},${isJumping},${isSliding}`;
          if (stateStr !== lastEmittedStateRef.current) {
            kbStateRef.current.lane = lane;
            onPoseState({ lane, isWalking, isJumping, isSliding });
            lastEmittedStateRef.current = stateStr;
          }

          // Un-mirror canvas context for text rendering so text is readable
          canvasCtx.restore();
          canvasCtx.save();
          
          // Draw Status Badge Overlay on Camera
          canvasCtx.fillStyle = "rgba(0, 0, 0, 0.65)";
          canvasCtx.fillRect(8, 8, 140, 60);
          canvasCtx.strokeStyle = "#3b82f6";
          canvasCtx.lineWidth = 1;
          canvasCtx.strokeRect(8, 8, 140, 60);

          canvasCtx.fillStyle = "#ffffff";
          canvasCtx.font = "bold 11px sans-serif";
          canvasCtx.fillText(`JALUR: ${lane === -1 ? "KIRI" : lane === 1 ? "KANAN" : "TENGAH"}`, 14, 24);

          canvasCtx.fillStyle = isJumping ? "#38bdf8" : isSliding ? "#f43f5e" : "#a3e635";
          canvasCtx.fillText(`AKSI: ${isJumping ? "JUMP!" : isSliding ? "SLIDE!" : isWalking ? "RUN" : "DIAM"}`, 14, 44);
        }

        canvasCtx.restore();
      });
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, facingMode: "user" } 
        });
        
        if (!isActive || !videoElement) return;
        videoElement.srcObject = stream;
        await videoElement.play();

        const processFrame = async () => {
          if (!isActive || !videoElement) return;
          
          if (videoElement.readyState >= 2) {
            await pose.send({ image: videoElement });
          }
          animationFrameId = requestAnimationFrame(processFrame);
        };
        
        processFrame();
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    initMediaPipe().then(() => {
      if (isActive) startCamera();
    });

    return () => {
      isActive = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (pose) {
        pose.close();
      }
    };
  }, [onPoseState]);

  return (
    <div className={`fixed z-50 bg-black/90 p-2 rounded-xl shadow-2xl border border-blue-500/30 backdrop-blur-md transition-all duration-300 ${isFullscreen ? "inset-4 flex flex-col" : `bottom-4 right-4 ${isExpanded ? "w-80" : "w-52"}`}`}>
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-white text-xs font-bold">Kamera Pose</span>
        <div className="flex gap-2">
          {!isFullscreen && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-[10px] font-medium transition-colors border border-gray-600 focus:outline-none"
            >
              {isExpanded ? "Kecilkan" : "Perbesar"}
            </button>
          )}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-[10px] font-medium transition-colors border border-gray-600 focus:outline-none"
          >
            {isFullscreen ? "Tutup Full" : "Full"}
          </button>
        </div>
      </div>
      <div className={`relative w-full overflow-hidden rounded-lg transition-all duration-300 bg-black/50 ${isFullscreen ? "flex-1" : isExpanded ? "h-60" : "h-36"}`}>
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-contain hidden"
        ></video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-contain rounded-md"
          width="640"
          height="480"
        ></canvas>
      </div>
      <p className={`text-gray-300 text-[10px] text-center mt-2 font-mono leading-tight ${isFullscreen ? "text-sm" : ""}`}>
        Miring Kiri/Kanan: Pindah Jalur<br/>
        Lompat / Tangan Atas: Jump<br/>
        Jongkok / Squat: Slide<br/>
        Alt: Gunakan Keyboard (A/D/W/S)
      </p>
    </div>
  );
}

