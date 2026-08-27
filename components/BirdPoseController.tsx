"use client";

import { useEffect, useRef, useState } from "react";

export type BirdPoseState = {
  lane: number;
  isFlying: boolean;
};

interface BirdPoseControllerProps {
  onPoseState: (state: BirdPoseState) => void;
}

export default function BirdPoseController({ onPoseState }: BirdPoseControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const lastEmittedStateRef = useRef<string>("");
  
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
        
        // Flip horizontally
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

          const drawLine = (p1: any, p2: any, color: string) => {
            if (!p1 || !p2) return;
            canvasCtx.beginPath();
            canvasCtx.moveTo(p1.x * canvasElement.width, p1.y * canvasElement.height);
            canvasCtx.lineTo(p2.x * canvasElement.width, p2.y * canvasElement.height);
            canvasCtx.strokeStyle = color;
            canvasCtx.lineWidth = 2;
            canvasCtx.stroke();
          };

          const drawJoint = (point: any, color: string, radius: number = 4) => {
            if (!point) return;
            canvasCtx.fillStyle = color;
            canvasCtx.beginPath();
            canvasCtx.arc(point.x * canvasElement.width, point.y * canvasElement.height, radius, 0, 2 * Math.PI);
            canvasCtx.fill();
          };

          // Draw body lines
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

          // Draw joints
          drawJoint(leftShoulder, "#00ffcc");
          drawJoint(rightShoulder, "#00ffcc");
          drawJoint(leftElbow, "#00ffcc");
          drawJoint(rightElbow, "#00ffcc");
          drawJoint(leftHip, "#ff0077");
          drawJoint(rightHip, "#ff0077");
          drawJoint(leftKnee, "#ff0077");
          drawJoint(rightKnee, "#ff0077");
          drawJoint(leftAnkle, "#ff0077");
          drawJoint(rightAnkle, "#ff0077");

          // Draw wrists (Wings)
          drawJoint(leftWrist, "cyan", 8);
          drawJoint(rightWrist, "cyan", 8);

          // Bird pose detection logic
          // Tilt detection (Banking)
          let lane = 0;
          // In MediaPipe, Y goes down.
          // leftWrist is user's physical left hand.
          // If left hand is lower than right hand (leftWrist.y > rightWrist.y) -> banking left -> lane = -1
          const wingTilt = leftWrist.y - rightWrist.y;
          
          if (wingTilt > 0.15) {
            lane = -1; // Move left
          } else if (wingTilt < -0.15) {
            lane = 1;  // Move right
          }

          // Flying detection
          // Leg lift: if one knee is noticeably higher than the other (diff > 0.08)
          // or if both knees are raised high above the regular standing position.
          const isFlying = Math.abs(leftKnee.y - rightKnee.y) > 0.08 || 
                           (leftKnee.y < leftHip.y + 0.25 && rightKnee.y < rightHip.y + 0.25);

          const stateStr = `${lane},${isFlying}`;
          if (stateStr !== lastEmittedStateRef.current) {
             onPoseState({ lane, isFlying });
             lastEmittedStateRef.current = stateStr;
          }
        }
        canvasCtx.restore();
      });
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240 } // Removed facingMode so external cameras work
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
    <div className={`fixed bottom-4 right-4 z-50 bg-black/80 p-3 rounded-xl shadow-lg border border-blue-500/50 backdrop-blur-sm transition-all duration-300 ${isExpanded ? "w-80" : "w-52"}`}>
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-white text-xs font-bold">Kamera Pose</span>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-[10px] font-medium transition-colors border border-gray-600 focus:outline-none"
        >
          {isExpanded ? "Kecilkan" : "Perbesar"}
        </button>
      </div>
      <div className={`relative w-full rounded-lg overflow-hidden border border-gray-700 transition-all duration-300 ${isExpanded ? "h-60" : "h-36"}`}>
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover hidden"
        ></video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-cover"
          width="320"
          height="240"
        ></canvas>
      </div>
      <div className="text-white text-[10px] text-center mt-3 font-medium space-y-1">
        <p className="text-cyan-400">Angkat Satu Kaki: Terbang Maju</p>
        <p>Miring Kiri: Belok Kiri</p>
        <p>Miring Kanan: Belok Kanan</p>
        <p className="text-gray-400">Turunkan Kaki: Berhenti</p>
      </div>
    </div>
  );
}
