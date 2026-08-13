"use client";

import { useEffect, useRef } from "react";

export type PoseAction = "left" | "right" | "jump" | "none";

interface PoseControllerProps {
  onAction: (action: PoseAction) => void;
}

export default function PoseController({ onAction }: PoseControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State variables for debounce
  const lastActionRef = useRef<PoseAction>("none");
  const lastActionTimeRef = useRef<number>(0);
  
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
      // Load script dynamically to avoid Next.js Turbopack export errors
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
        // Draw skeleton
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // We flip horizontally when drawing the image so it acts like a mirror
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
        // Simple visualization: draw dots on left/right knee
        const landmarks = results.poseLandmarks;
        const leftKnee = landmarks[25]; // Mediapipe left is screen right when mirrored
        const rightKnee = landmarks[26];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftWrist = landmarks[15];
        const rightWrist = landmarks[16];
        
        // Draw knees
        canvasCtx.fillStyle = "red";
        canvasCtx.beginPath();
        canvasCtx.arc(leftKnee.x * canvasElement.width, leftKnee.y * canvasElement.height, 5, 0, 2 * Math.PI);
        canvasCtx.fill();

        canvasCtx.fillStyle = "blue";
        canvasCtx.beginPath();
        canvasCtx.arc(rightKnee.x * canvasElement.width, rightKnee.y * canvasElement.height, 5, 0, 2 * Math.PI);
        canvasCtx.fill();

        // Draw wrists
        canvasCtx.fillStyle = "yellow";
        canvasCtx.beginPath();
        canvasCtx.arc(leftWrist.x * canvasElement.width, leftWrist.y * canvasElement.height, 5, 0, 2 * Math.PI);
        canvasCtx.fill();

        canvasCtx.beginPath();
        canvasCtx.arc(rightWrist.x * canvasElement.width, rightWrist.y * canvasElement.height, 5, 0, 2 * Math.PI);
        canvasCtx.fill();

        // Threshold for knee raise
        const leftKneeRaised = leftKnee.y < leftHip.y + 0.15; 
        const rightKneeRaised = rightKnee.y < rightHip.y + 0.15;
        
        // Threshold for hands raise
        const bothHandsRaised = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
        
        let currentAction: PoseAction = "none";
        
        if (bothHandsRaised) {
            currentAction = "jump";
        } else if (leftKneeRaised) {
            currentAction = "left"; // User lifts their left leg (which is on the left side of screen)
        } else if (rightKneeRaised) {
            currentAction = "right"; // User lifts their right leg
        }
        
        const now = Date.now();
        // Debounce actions
        if (currentAction !== "none" && (currentAction !== lastActionRef.current || now - lastActionTimeRef.current > 800)) {
            // Because camera is mirrored, we might need to invert left/right depending on how user expects it.
            // If they raise the leg on the left side of the screen (their right leg), they want to go left?
            // Usually, lifting left leg -> go left. Let's just pass the action.
            onAction(currentAction);
            lastActionRef.current = currentAction;
            lastActionTimeRef.current = now;
        } else if (currentAction === "none" && now - lastActionTimeRef.current > 500) {
            // Reset after 0.5s of no action
             lastActionRef.current = "none";
        }
      }
      canvasCtx.restore();
    });
    };    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, facingMode: "user" } 
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
  }, [onAction]);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black p-2 rounded-lg shadow-lg border border-gray-700">
      <div className="relative w-48 h-36">
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover hidden"
        ></video>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
          width="320"
          height="240"
        ></canvas>
      </div>
      <p className="text-white text-xs text-center mt-2 font-mono">
        Raise Left Leg: Move Left<br/>
        Raise Right Leg: Move Right<br/>
        Raise Both Hands: Jump
      </p>
    </div>
  );
}
