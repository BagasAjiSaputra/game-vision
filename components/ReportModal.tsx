"use client";

import { useRef, useState } from "react";
import { X, Download, Printer, Award, User, Calendar, Activity, CheckCircle, Flame } from "lucide-react";
import { getScoreCategory, getGameTitle } from "@/lib/scoreUtils";

interface ReportModalProps {
  playerName: string;
  playerAge?: number | string;
  gameType: string;
  score: number;
  snapshotUrl?: string;
  onClose: () => void;
}

export default function ReportModal({
  playerName,
  playerAge,
  gameType,
  score,
  snapshotUrl,
  onClose,
}: ReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Function to print / export PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // Function to render canvas and download as PNG
  const handleDownloadPNG = async () => {
    setIsDownloading(true);
    try {
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
      ctx.roundRect(40, 40, 720, 920, 24);
      ctx.fill();
      ctx.stroke();

      // Header Banner
      const headerGrad = ctx.createLinearGradient(40, 40, 760, 40);
      headerGrad.addColorStop(0, "#0284c7");
      headerGrad.addColorStop(1, "#0d9488");
      ctx.fillStyle = headerGrad;
      ctx.beginPath();
      ctx.roundRect(40, 40, 720, 110, [24, 24, 0, 0]);
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
      ctx.roundRect(70, 180, 660, 110, 16);
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
      ctx.roundRect(70, 310, 660, 150, 16);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("SKOR AKHIR (SKALA 0 - 100)", 400, 340);

      ctx.fillStyle = "#ffffff";
      ctx.font = "black 56px sans-serif";
      ctx.fillText(`${normalizedScore} / 100`, 400, 405);

      // Category Badge
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.roundRect(280, 415, 240, 36, 18);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`KATEGORI: ${category.label.toUpperCase()}`, 400, 439);

      // Motion Screenshot Box
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(70, 480, 660, 360, 16);
      ctx.fill();

      ctx.textAlign = "left";
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("SCREEN CAPTURE GERAKAN SISWA", 90, 510);

      // Draw snapshot image if available
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
        ctx.roundRect(90, 525, 620, 300, 12);
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

      // Trigger PNG download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Laporan_Gerakan_${playerName.replace(/\s+/g, "_")}_${normalizedScore}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image report", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      {/* Printable CSS style overlay */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8">
        
        {/* Top bar (Modal Controls - Hidden when printing) */}
        <div className="no-print flex justify-between items-center px-6 py-4 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            <span className="text-white font-bold text-lg">Export Laporan Evaluasi Siswa</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Document Content */}
        <div id="printable-report" ref={reportRef} className="p-6 md:p-8 bg-slate-950 text-white space-y-6">
          
          {/* Header Banner */}
          <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-6 h-6 text-yellow-300" />
                <span className="text-xs font-black uppercase tracking-widest text-blue-200">RUANGROBOT GAME MOTION SYSTEM</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">LAPORAN EVALUASI GERAKAN</h1>
              <p className="text-sm text-blue-100 font-medium">Standardized Motion & Motor Skill Assessment Report</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-center shrink-0">
              <span className="block text-[10px] uppercase font-bold text-blue-200">Tanggal Evaluasi</span>
              <span className="text-sm font-bold">{currentDate}</span>
            </div>
          </div>

          {/* Student & Game Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Nama Siswa</p>
                <p className="text-lg font-bold text-white uppercase">{playerName || "Siswa"}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Usia / Kelas</p>
                <p className="text-lg font-bold text-white">{playerAge ? `${playerAge} Tahun` : "-"}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Jenis Game</p>
                <p className="text-lg font-bold text-white">{gameTitle}</p>
              </div>
            </div>
          </div>

          {/* Score & Category Rating Section */}
          <div className={`rounded-2xl border-2 ${category.borderColor} bg-slate-900 p-6 text-center relative overflow-hidden`}>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">SKOR HASIL GERAKAN (SKALA 0 - 100)</p>
            
            <div className="flex justify-center items-baseline gap-2 mb-3">
              <span className="text-6xl font-black text-white">{normalizedScore}</span>
              <span className="text-2xl font-bold text-slate-500">/ 100</span>
            </div>

            {/* Category Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full font-black text-lg bg-gradient-to-r ${category.gradient} text-white shadow-lg uppercase tracking-wider mb-3">
              <CheckCircle className="w-5 h-5" />
              Kategori: {category.label}
            </div>

            <p className="text-sm font-medium text-slate-300 max-w-xl mx-auto italic">
              "{category.description}"
            </p>
          </div>

          {/* Screen Capture of Student Motion */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> Bukti Screen Capture Gerakan Siswa
              </h3>
              <span className="text-xs text-slate-500 font-semibold">1 Tangkapan Layar Pose Kamera</span>
            </div>

            <div className="relative w-full h-64 sm:h-80 bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
              {snapshotUrl ? (
                <img
                  src={snapshotUrl}
                  alt="Student Motion Capture"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-sm">Tangkapan Layar Kamera Terdeteksi Saat Permainan Berlangsung</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer stamp */}
          <div className="pt-2 text-center text-xs text-slate-500 font-medium">
            Dokumen Laporan Sistem Motion Control — RuangRobot Indonesia
          </div>
        </div>

        {/* Action Buttons (Download PNG & Print PDF - Hidden when printing) */}
        <div className="no-print flex flex-col sm:flex-row gap-4 p-6 bg-slate-900 border-t border-slate-800">
          <button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isDownloading ? "Menyiapkan Gambar..." : "Unduh Laporan (PNG)"}
          </button>
          
          <button
            onClick={handlePrintPDF}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Printer className="w-5 h-5" />
            Unduh PDF / Cetak Laporan
          </button>
        </div>

      </div>
    </div>
  );
}
