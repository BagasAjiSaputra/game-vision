/**
 * Screenshot Capture Utility
 * 
 * Menggabungkan game canvas (Three.js / 2D) dengan kamera MediaPipe
 * menjadi satu gambar komposit untuk dokumentasi evaluasi.
 */

export interface ScreenshotStat {
  label: string;
  value: string | number;
  /** Warna angka (default putih) */
  valueColor?: string;
  /** Titik indikator di samping label (opsional) */
  dotColor?: string;
}

export interface CaptureOptions {
  /**
   * HUD yang tampil di atas canvas sebagai elemen DOM (skor, koin, waktu, ...).
   * Digambar ke screenshot di kiri atas dengan gaya yang sama seperti HUD game.
   */
  stats?: ScreenshotStat[];
}

/**
 * Capture screenshot komposit: Game canvas + HUD (skor/koin/waktu) + MediaPipe kamera overlay.
 * Returns: Blob JPEG, atau null jika gagal.
 */
export async function captureGameScreenshot(options: CaptureOptions = {}): Promise<Blob | null> {
  try {
    const allCanvases = Array.from(document.querySelectorAll('canvas'));
    const videos = Array.from(document.querySelectorAll('video'));
    
    if (allCanvases.length === 0) {
      return null;
    }

    // Identifikasi game canvas (terbesar atau 2D/3D container) dan pose canvas (terkecil / di dalam container kamera)
    let gameCanvas: HTMLCanvasElement | null = null;
    let poseCanvas: HTMLCanvasElement | null = null;
    let maxArea = -1;

    allCanvases.forEach((canvas) => {
      const rect = canvas.getBoundingClientRect();
      const area = rect.width * rect.height;
      const parent = canvas.parentElement;
      const isCameraContainer = parent?.closest('.w-48, .w-40, .w-64, [class*="camera"], [class*="pose"]') || canvas.width < 400;

      if (isCameraContainer) {
        poseCanvas = canvas;
      } else if (area > maxArea) {
        maxArea = area;
        gameCanvas = canvas;
      }
    });

    // Fallback jika tidak terpisah dengan class camera
    if (!gameCanvas && allCanvases.length > 0) {
      gameCanvas = allCanvases[0];
      if (allCanvases.length > 1) {
        poseCanvas = allCanvases[1];
      }
    }

    if (!gameCanvas) {
      return null;
    }

    // Ukuran output = ukuran game canvas yang tampil di layar
    const gc = gameCanvas as HTMLCanvasElement;
    const gameRect = gc.getBoundingClientRect();
    const outputWidth = Math.round(gameRect.width);
    const outputHeight = Math.round(gameRect.height);

    // Buat composite canvas
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = outputWidth;
    compositeCanvas.height = outputHeight;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return null;

    // 1. Gambar game canvas sebagai background utama
    try {
      if (gameCanvas) {
        ctx.drawImage(gameCanvas, 0, 0, outputWidth, outputHeight);
      } else {
        // Fallback latar belakang jika game berbasis HTML/CSS DOM (seperti Basket Shoot)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, outputWidth, outputHeight);
      }
    } catch (err) {
      console.error('[Screenshot] Gagal draw game canvas:', err);
    }

    // 1b. HUD DOM (skor, koin, waktu) yang tampil di atas canvas
    if (options.stats && options.stats.length > 0) {
      drawHudStats(ctx, options.stats, outputWidth);
    }

    // 2. Hitung ukuran & posisi inset kamera (kanan bawah, mirip layout asli)
    const insetWidth = Math.round(outputWidth * 0.22);
    const insetHeight = Math.round(insetWidth * 0.75); // 4:3 ratio
    const insetPadding = 16;
    const insetX = outputWidth - insetWidth - insetPadding;
    const insetY = outputHeight - insetHeight - insetPadding - 80; // Extra space for controls text

    // Rounded rectangle background untuk inset
    const radius = 12;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(insetX + radius, insetY);
    ctx.lineTo(insetX + insetWidth - radius, insetY);
    ctx.quadraticCurveTo(insetX + insetWidth, insetY, insetX + insetWidth, insetY + radius);
    ctx.lineTo(insetX + insetWidth, insetY + insetHeight - radius);
    ctx.quadraticCurveTo(insetX + insetWidth, insetY + insetHeight, insetX + insetWidth - radius, insetY + insetHeight);
    ctx.lineTo(insetX + radius, insetY + insetHeight);
    ctx.quadraticCurveTo(insetX, insetY + insetHeight, insetX, insetY + insetHeight - radius);
    ctx.lineTo(insetX, insetY + radius);
    ctx.quadraticCurveTo(insetX, insetY, insetX + radius, insetY);
    ctx.closePath();
    ctx.clip();

    // Background hitam untuk inset area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(insetX, insetY, insetWidth, insetHeight);

    // 3. Gambar pose canvas (landmark overlay dari MediaPipe) ke inset
    if (poseCanvas) {
      try {
        ctx.drawImage(poseCanvas, insetX, insetY, insetWidth, insetHeight);
      } catch (err) {
        console.error('[Screenshot] Gagal draw pose canvas:', err);
      }
    }

    // 4. Coba gambar video element (webcam asli) juga ke inset sebagai layer bawah
    // Video element biasanya hidden tapi masih punya frame data
    if (videos.length > 0) {
      const webcamVideo = videos[0];
      if (webcamVideo.readyState >= 2 && webcamVideo.videoWidth > 0) {
        try {
          // Gambar video dulu sebagai base layer, lalu pose canvas di atasnya
          // Kita perlu re-draw: clear inset, draw video, draw pose overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(insetX, insetY, insetWidth, insetHeight);
          ctx.drawImage(webcamVideo, insetX, insetY, insetWidth, insetHeight);
          
          // Re-draw pose canvas overlay on top of video
          if (poseCanvas) {
            ctx.drawImage(poseCanvas, insetX, insetY, insetWidth, insetHeight);
          }
        } catch (err) {
          // Video cross-origin error is expected, fallback ke pose canvas saja
          console.warn('[Screenshot] Video draw failed (CORS), using pose canvas only');
        }
      }
    }

    ctx.restore();

    // 5. Border untuk inset kamera
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(insetX + radius, insetY);
    ctx.lineTo(insetX + insetWidth - radius, insetY);
    ctx.quadraticCurveTo(insetX + insetWidth, insetY, insetX + insetWidth, insetY + radius);
    ctx.lineTo(insetX + insetWidth, insetY + insetHeight - radius);
    ctx.quadraticCurveTo(insetX + insetWidth, insetY + insetHeight, insetX + insetWidth - radius, insetY + insetHeight);
    ctx.lineTo(insetX + radius, insetY + insetHeight);
    ctx.quadraticCurveTo(insetX, insetY + insetHeight, insetX, insetY + insetHeight - radius);
    ctx.lineTo(insetX, insetY + radius);
    ctx.quadraticCurveTo(insetX, insetY, insetX + radius, insetY);
    ctx.closePath();
    ctx.stroke();

    // 6. Label "📷 Kamera Pose" di atas inset
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(insetX, insetY - 22, 110, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('📷 Kamera Pose', insetX + 6, insetY - 8);

    // Export ke blob
    return canvasToBlob(compositeCanvas);

  } catch (err) {
    console.error('[Screenshot] Capture failed:', err);
    return null;
  }
}

/**
 * Gambar kotak HUD (mirip HUD game: kartu gelap rounded, label abu-abu, angka besar tebal)
 * berjajar di kiri atas screenshot.
 */
function drawHudStats(ctx: CanvasRenderingContext2D, stats: ScreenshotStat[], outputWidth: number) {
  const s = Math.min(1.4, Math.max(0.7, outputWidth / 1280));
  const fontFamily =
    getComputedStyle(document.body).fontFamily || 'ui-sans-serif, system-ui, sans-serif';

  const margin = 16 * s;
  const gap = 16 * s;
  const padX = 28 * s;
  const boxH = 104 * s;
  const radius = 24 * s;
  const labelFont = `700 ${15 * s}px ${fontFamily}`;
  const valueFont = `900 ${46 * s}px ${fontFamily}`;
  const dotR = 6 * s;
  const dotGap = 8 * s;
  const letterSpacing = `${2 * s}px`;
  const supportsLetterSpacing = 'letterSpacing' in ctx;
  const setSpacing = (v: string) => {
    if (supportsLetterSpacing) {
      (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = v;
    }
  };

  let x = margin;
  const y = margin;

  for (const stat of stats) {
    const label = stat.label.toUpperCase();
    const value = String(stat.value);

    ctx.save();
    ctx.font = labelFont;
    setSpacing(letterSpacing);
    const labelW = ctx.measureText(label).width + (stat.dotColor ? dotR * 2 + dotGap : 0);
    ctx.font = valueFont;
    setSpacing('0px');
    const valueW = ctx.measureText(value).width;
    ctx.restore();

    const boxW = Math.max(130 * s, Math.max(labelW, valueW) + padX * 2);

    // Kartu
    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, boxW, boxH, radius);
    else ctx.rect(x, y, boxW, boxH);
    ctx.fillStyle = 'rgba(28, 30, 28, 0.9)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 24 * s;
    ctx.shadowOffsetY = 8 * s;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();
    ctx.restore();

    const cx = x + boxW / 2;
    const labelY = y + 27 * s;
    const valueY = y + 69 * s;

    // Label (+ titik indikator)
    ctx.save();
    ctx.font = labelFont;
    setSpacing(letterSpacing);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let labelX = cx - labelW / 2;
    if (stat.dotColor) {
      ctx.fillStyle = stat.dotColor;
      ctx.beginPath();
      ctx.arc(labelX + dotR, labelY, dotR, 0, Math.PI * 2);
      ctx.fill();
      labelX += dotR * 2 + dotGap;
    }
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(label, labelX, labelY);
    ctx.restore();

    // Nilai
    ctx.save();
    ctx.font = valueFont;
    setSpacing('0px');
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = stat.valueColor || '#ffffff';
    ctx.fillText(value, cx, valueY);
    ctx.restore();

    x += boxW + gap;
  }
}

/**
 * Convert HTMLCanvasElement ke Blob (JPEG, quality 0.8)
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.8
      );
    } catch (err) {
      console.error('[Screenshot] toBlob failed:', err);
      resolve(null);
    }
  });
}
