"use client";

import { getScoreCategory, getGameTitle } from "@/lib/scoreUtils";

function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[] = 0) {
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

export async function generateAndDownloadReportPNG({
  playerName,
  playerAge,
  gameType,
  score,
  snapshotUrl,
}: {
  playerName: string;
  playerAge?: number | string;
  gameType: string;
  score: number;
  snapshotUrl?: string;
}) {
  if (typeof window === "undefined") return;

  try {
    const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
    const category = getScoreCategory(normalizedScore);
    const gameTitle = getGameTitle(gameType);
    const currentDate = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const currentTime = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1000;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, 1000);
    bgGradient.addColorStop(0, "#0f172a");
    bgGradient.addColorStop(1, "#1e293b");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 800, 1000);

    // Card Container
    ctx.fillStyle = "#1c1e1c";
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 3;
    ctx.beginPath();
    drawBox(ctx, 40, 40, 720, 920, 24);
    ctx.fill();
    ctx.stroke();

    // Header Banner
    const headerGrad = ctx.createLinearGradient(40, 40, 760, 40);
    headerGrad.addColorStop(0, "#0284c7");
    headerGrad.addColorStop(1, "#0d9488");
    ctx.fillStyle = headerGrad;
    ctx.beginPath();
    drawBox(ctx, 40, 40, 720, 110, [24, 24, 0, 0]);
    ctx.fill();

    // Title Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LAPORAN EVALUASI GERAKAN SISWA", 400, 85);
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#e0f2fe";
    ctx.fillText("RUANGROBOT GAME MOTION SYSTEM", 400, 115);

    // Student Info Box
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    drawBox(ctx, 70, 180, 660, 110, 16);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.font = "bold 15px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("NAMA SISWA:", 90, 215);
    ctx.fillText("USIA / KELAS:", 90, 245);
    ctx.fillText("PERMAINAN:", 90, 275);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText((playerName || "Siswa").toUpperCase(), 220, 215);
    ctx.fillText(playerAge ? `${playerAge} Tahun` : "-", 220, 245);
    ctx.fillText(gameTitle.toUpperCase(), 220, 275);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${currentDate} | ${currentTime}`, 710, 215);

    // Score Display Box
    let badgeColor = "#10b981";
    if (normalizedScore < 60) badgeColor = "#ef4444";
    else if (normalizedScore < 70) badgeColor = "#f97316";
    else if (normalizedScore < 80) badgeColor = "#eab308";
    else if (normalizedScore < 90) badgeColor = "#3b82f6";

    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    drawBox(ctx, 70, 310, 660, 150, 16);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("SKOR AKHIR (SKALA 0 - 100)", 400, 340);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 56px sans-serif";
    ctx.fillText(`${normalizedScore} / 100`, 400, 405);

    // Category Badge
    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    drawBox(ctx, 280, 415, 240, 36, 18);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`KATEGORI: ${category.label.toUpperCase()}`, 400, 439);

    // Motion Screenshot Box
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    drawBox(ctx, 70, 480, 660, 360, 16);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("SCREEN CAPTURE GERAKAN SISWA", 90, 510);

    if (snapshotUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = snapshotUrl;
      });
      ctx.save();
      ctx.beginPath();
      drawBox(ctx, 90, 525, 620, 300, 12);
      ctx.clip();
      ctx.drawImage(img, 90, 525, 620, 300);
      ctx.restore();
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(90, 525, 620, 300);
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.font = "16px sans-serif";
      ctx.fillText("Tampilan Kamera Pose Terdeteksi Aktif", 400, 675);
    }

    // Description & Footer
    ctx.fillStyle = "#94a3b8";
    ctx.font = "italic 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`"${category.description}"`, 400, 870);

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("Dokumen Resmi Laporan Evaluasi Game Motion — RuangRobot", 400, 920);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = (playerName || "Pemain").trim().replace(/\s+/g, "_");
    link.download = `Laporan_Gerakan_${safeName}_${normalizedScore}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Failed to generate report PNG:", err);
  }
}
