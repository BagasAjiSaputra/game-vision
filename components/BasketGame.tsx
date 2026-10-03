"use client";

import { useEffect, useRef } from "react";
import { BasketPoseState } from "./BasketPoseController";

interface BasketGameProps {
  poseState: BasketPoseState | null;
  onScoreUpdate: (score: number) => void;
  onMiss?: () => void;
  /** Sisa waktu (detik) untuk ditampilkan di HUD canvas */
  timeLeft?: number;
}

type ShotStatus = "playing" | "scored" | "missed";

// Ukuran elemen game (px, mengikuti versi DOM sebelumnya)
const HOOP_W = 160;
const HOOP_H = 128;
const BALL_SIZE = 112;
const HAND_FONT_SIZE = 100;
const FRAME_MS = 1000 / 60;

/**
 * Basket Shoot — dirender sepenuhnya di <canvas> 2D (seperti Heli/Endless yang memakai canvas WebGL),
 * sehingga screenshot game (captureGameScreenshot) dapat merekam game + skor + waktu,
 * lalu ditambah inset kamera MediaPipe.
 */
export default function BasketGame({ poseState, onScoreUpdate, onMiss, timeLeft }: BasketGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Props terbaru disimpan di ref agar loop animasi tidak perlu di-restart
  const poseRef = useRef<BasketPoseState | null>(poseState);
  const timeLeftRef = useRef<number | undefined>(timeLeft);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onMissRef = useRef(onMiss);

  useEffect(() => {
    poseRef.current = poseState;
    timeLeftRef.current = timeLeft;
    onScoreUpdateRef.current = onScoreUpdate;
    onMissRef.current = onMiss;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Assets ---
    const courtImg = new Image();
    courtImg.src = "/assets/basket/court_bg.png";
    const ballImg = new Image();
    ballImg.src = "/assets/basket/ball.png";

    const fontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";

    // --- Ukuran canvas (CSS px) ---
    let width = 0;
    let height = 0;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // --- Game state (persen layar) ---
    let score = 0;
    let status: ShotStatus = "playing";
    let statusAt = 0;

    let hoopX = 50;
    let hoopDirection = 1;
    let hoopSpeed = 0.2;

    let aimX = 50;

    let isBallThrown = false;
    let hasFiredThisJump = false;
    let throwProgress = 0;
    let resultAt = 0; // waktu bola mencapai ring (0 = belum)
    const throwStartX = 50;
    const throwStartY = 85;
    let throwTargetX = 50;
    const throwTargetY = 20;

    let lastTime = performance.now();
    let rafId = 0;

    const update = (now: number, step: number) => {
      const pose = poseRef.current;

      // 1. Ring bergerak kiri-kanan
      hoopX += hoopDirection * hoopSpeed * step;
      if (hoopX > 85) {
        hoopX = 85;
        hoopDirection = -1;
      } else if (hoopX < 15) {
        hoopX = 15;
        hoopDirection = 1;
      }

      // 2. Aim halus mengikuti pose
      if (pose) {
        const targetAimX = pose.aimX * 100;
        const easing = 1 - Math.pow(0.9, step);
        aimX += (targetAimX - aimX) * easing;
      }

      // 3. Trigger tembakan
      if (pose && pose.isJumping && pose.isShooting && !isBallThrown && !hasFiredThisJump) {
        isBallThrown = true;
        hasFiredThisJump = true;
        throwProgress = 0;
        resultAt = 0;
        throwTargetX = aimX;
        status = "playing";
      }
      if (pose && !pose.isJumping && !pose.isShooting) {
        hasFiredThisJump = false;
      }

      // 4. Bola
      if (isBallThrown) {
        if (throwProgress < 1) {
          throwProgress = Math.min(1, throwProgress + 0.025 * step);
        } else if (resultAt === 0) {
          // Bola mencapai ring -> evaluasi
          resultAt = now;
          statusAt = now;
          const distanceToHoop = Math.abs(throwTargetX - hoopX);
          if (distanceToHoop < 8) {
            status = "scored";
            score = Math.min(100, score + 10);
            onScoreUpdateRef.current(score);
            hoopSpeed = Math.min(0.8, hoopSpeed + 0.05);
          } else {
            status = "missed";
            onMissRef.current?.();
          }
        } else if (now - resultAt > 1000) {
          // Reset bola setelah 1 detik
          isBallThrown = false;
          throwProgress = 0;
          resultAt = 0;
          status = "playing";
        }
      }
    };

    // ---------- Drawing helpers ----------
    const roundRectPath = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }
    };

    const drawBackground = () => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      if (courtImg.complete && courtImg.naturalWidth > 0) {
        // background-size: cover; background-position: center bottom
        const s = Math.max(width / courtImg.naturalWidth, height / courtImg.naturalHeight);
        const dw = courtImg.naturalWidth * s;
        const dh = courtImg.naturalHeight * s;
        ctx.drawImage(courtImg, (width - dw) / 2, height - dh, dw, dh);
      }

      // Overlay gelap
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, width, height);

      // Lantai lapangan
      const floor = ctx.createLinearGradient(0, height, 0, height / 2);
      floor.addColorStop(0, "rgba(197, 121, 58, 0.8)");
      floor.addColorStop(1, "rgba(197, 121, 58, 0)");
      ctx.fillStyle = floor;
      ctx.fillRect(0, height / 2, width, height / 2);
    };

    const drawHoop = () => {
      const cx = (hoopX / 100) * width;
      const cy = 0.2 * height;
      const left = cx - HOOP_W / 2;
      const top = cy - HOOP_H / 2;

      // Papan
      roundRectPath(left + 2, top + 2, HOOP_W - 4, HOOP_H - 4, 8);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#d1d5db";
      ctx.stroke();

      // Kotak target merah
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 4;
      ctx.strokeRect(cx - 32 + 2, top + HOOP_H - 20 - 48 + 2, 64 - 4, 48 - 4);

      // Jaring
      const netTop = top + HOOP_H * 0.8;
      ctx.save();
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 32, netTop);
      ctx.lineTo(cx - 32, netTop + 52);
      ctx.quadraticCurveTo(cx - 32, netTop + 64, cx - 20, netTop + 64);
      ctx.lineTo(cx + 20, netTop + 64);
      ctx.quadraticCurveTo(cx + 32, netTop + 64, cx + 32, netTop + 52);
      ctx.lineTo(cx + 32, netTop);
      ctx.stroke();
      ctx.restore();

      // Ring
      ctx.beginPath();
      ctx.ellipse(cx, top + HOOP_H - 16, 38, 6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 4;
      ctx.stroke();
    };

    const drawCrosshair = () => {
      const cx = (aimX / 100) * width;
      const cy = 0.2 * height;
      ctx.save();
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, 23, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBall = () => {
      let xPct: number;
      let yPct: number;
      let scale = 1;
      let rotation = 0;

      if (isBallThrown) {
        const t = throwProgress;
        xPct = throwStartX + (throwTargetX - throwStartX) * t;
        const arc = Math.sin(t * Math.PI) * 15;
        yPct = throwStartY + (throwTargetY - throwStartY) * t - arc;
        scale = 1 - 0.5 * t;
        rotation = t * Math.PI * 2;
      } else {
        xPct = 50 + (aimX - 50) * 0.2;
        yPct = 85;
      }

      const size = BALL_SIZE * scale;
      const x = (xPct / 100) * width;
      const y = (yPct / 100) * height;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 20;
      if (ballImg.complete && ballImg.naturalWidth > 0) {
        ctx.drawImage(ballImg, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(0, 0, size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawHands = () => {
      const aimOffset = (aimX - 50) * 0.2;
      let opacity = 1;
      let handY = 90;
      let handScale = 1;

      if (isBallThrown) {
        const t = throwProgress;
        if (t < 0.25) {
          handY = 90 - t * 120;
          handScale = 1 - t * 1.5;
          opacity = Math.max(0, 1 - t / 0.25);
        } else {
          opacity = 0;
        }
      }
      if (opacity <= 0) return;

      const drawHand = (xPct: number, angleDeg: number) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate((xPct / 100) * width, (handY / 100) * height);
        ctx.rotate((angleDeg * Math.PI) / 180);
        ctx.scale(handScale, handScale);
        ctx.font = `${HAND_FONT_SIZE}px ${fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 20;
        ctx.fillText("✋🏽", 0, 0);
        ctx.restore();
      };

      drawHand(45 + aimOffset, -15);
      drawHand(55 + aimOffset, 15);
    };

    const drawStatus = (now: number) => {
      if (status === "playing") return;
      const elapsed = now - statusAt;
      const isScored = status === "scored";
      const text = isScored ? "GOAL!" : "GAGAL!";
      const color = isScored ? "#4ade80" : "#ef4444";
      const glow = isScored ? "rgba(74, 222, 128, 0.8)" : "rgba(239, 68, 68, 0.8)";

      // GOAL: animasi memantul, GAGAL: berkedip
      const offsetY = isScored ? -Math.abs(Math.sin((elapsed / 1000) * Math.PI)) * 25 : 0;
      const alpha = isScored ? 1 : 0.6 + 0.4 * Math.abs(Math.cos((elapsed / 1000) * Math.PI));

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 60px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = glow;
      ctx.shadowBlur = 15;
      ctx.fillStyle = color;
      ctx.fillText(text, width / 2, height * 0.25 + 30 + offsetY);
      ctx.restore();
    };

    const drawStatBox = (x: number, y: number, label: string, value: string, now: number, withDot: boolean) => {
      const boxW = 150;
      const boxH = 104;

      ctx.save();
      roundRectPath(x, y, boxW, boxH, 24);
      ctx.fillStyle = "rgba(28, 30, 28, 0.9)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fill();
      ctx.restore();

      roundRectPath(x + 0.5, y + 0.5, boxW - 1, boxH - 1, 24);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.font = `700 15px ${fontFamily}`;
      if ("letterSpacing" in ctx) {
        (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "2px";
      }
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      const labelWidth = ctx.measureText(label).width;
      const dotSpace = withDot ? 18 : 0;
      const labelX = x + boxW / 2 + dotSpace / 2;

      if (withDot) {
        const pulse = 0.5 + 0.5 * Math.abs(Math.sin((now / 1000) * Math.PI));
        ctx.globalAlpha = pulse;
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.arc(labelX - labelWidth / 2 - 12, y + 26, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = "#9ca3af";
      ctx.fillText(label, labelX, y + 26);
      ctx.restore();

      ctx.save();
      ctx.font = `900 46px ${fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(value, x + boxW / 2, y + 68);
      ctx.restore();
    };

    const drawHud = (now: number) => {
      const margin = 24;
      drawStatBox(margin, margin, "SCORE", String(score), now, true);

      const t = timeLeftRef.current;
      if (typeof t === "number") {
        const mins = Math.floor(Math.max(0, t) / 60);
        const secs = (Math.max(0, t) % 60).toString().padStart(2, "0");
        drawStatBox(margin + 150 + 16, margin, "WAKTU", `${mins}:${secs}`, now, false);
      }
    };

    const render = (now: number) => {
      drawBackground();
      drawHoop();
      drawCrosshair();
      drawBall();
      drawHands();
      drawStatus(now);
      drawHud(now);
    };

    const loop = (now: number) => {
      const step = Math.min(4, (now - lastTime) / FRAME_MS); // dinormalisasi ke 60fps
      lastTime = now;
      update(now, step);
      render(now);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
