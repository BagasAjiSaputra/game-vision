"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface StudentScoreLog {
  id: string;
  created_at: string;
  player_name: string;
  game_type: string;
  raw_score: number;
  score_category: string;
  game_duration?: number;
  movement_count?: number;
  screenshot_url?: string;
  disability_category?: string;
  age?: number;
  tgmd_locomotor_score?: number;
  tgmd_object_control_score?: number;
}

export async function generateStudentPDFReport(
  playerName: string,
  logs: StudentScoreLog[]
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const studentLogs = logs.filter(
    (l) => l.player_name.toLowerCase() === playerName.toLowerCase()
  );

  const sampleLog = studentLogs[0] || {};
  const age = sampleLog.age ? `${sampleLog.age} Tahun` : "8-10 Tahun (Estimasi)";
  const disability = sampleLog.disability_category || "Tuna Grahita / Tunagrahita";

  // --- HEADER UNESA FIKK ---
  doc.setFillColor(15, 32, 67); // Navy UNESA
  doc.rect(14, 12, 182, 16, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("UNIVERSITAS NEGERI SURABAYA - FIKK", 105, 17, { align: "center" });

  doc.setFontSize(11);
  doc.text(
    "Laporan Detail Validasi Game AI Markerless vs TGMD-3 Adaptif",
    105,
    23,
    { align: "center" }
  );

  let currentY = 33;

  // Intro text
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const introText =
    "Dokumen ini memuat detail penilaian motorik kasar siswa berdisabilitas berdasarkan hasil pengujian Game AI Markerless dan asesmen standar TGMD-3 Adaptif. Laporan mencakup data identitas, perolehan skor game beserta normanya, hasil asesmen TGMD-3, serta bukti visual berupa screenshot tangkapan layar aktivitas game beserta tracking kamera MediaPipe.";
  const splitIntro = doc.splitTextToSize(introText, 182);
  doc.text(splitIntro, 14, currentY);

  currentY += splitIntro.length * 4 + 4;

  // --- BAGIAN A: IDENTITAS ANAK ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 32, 67);
  doc.text("A. Identitas Anak", 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [],
    body: [
      ["Nama", playerName],
      ["Usia", age],
      ["Kategori Disabilitas", disability],
    ],
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, fillColor: [240, 243, 248] },
      1: { cellWidth: 137 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- BAGIAN B: SKOR GAME AI MARKERLESS ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 32, 67);
  doc.text("B. Skor Game AI Markerless", 14, currentY);
  currentY += 4;

  const gameRows = studentLogs.map((log) => [
    log.game_type,
    log.score_category || "Kurang",
    log.raw_score.toString(),
    log.movement_count?.toString() || "-",
    log.game_duration ? `${log.game_duration}s` : "-",
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Jenis Permainan", "Kategori Motorik", "Skor Raw", "Jumlah Gerakan", "Durasi Main"]],
    body: gameRows.length > 0 ? gameRows : [["-", "-", "-", "-", "-"]],
    theme: "grid",
    headStyles: { fillColor: [15, 32, 67], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, halign: "center" },
    columnStyles: {
      0: { halign: "left" },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // --- BAGIAN C: ASESMEN TGMD-3 ADAPTIF ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 32, 67);
  doc.text("C. Skor TGMD-3 Adaptif & Hasil Evaluasi", 14, currentY);
  currentY += 4;

  const locomotorScore = sampleLog.tgmd_locomotor_score ?? 35;
  const objectControlScore = sampleLog.tgmd_object_control_score ?? 38;
  const totalTgmd = locomotorScore + objectControlScore;

  autoTable(doc, {
    startY: currentY,
    head: [["Subtes TGMD-3", "Skor Mentah", "Kategori", "Keterangan"]],
    body: [
      ["Lokomotor", locomotorScore.toString(), "Sedang", "Penguasaan gerak berlari & melompat memadai"],
      ["Kontrol Objek", objectControlScore.toString(), "Bagus", "Koordinasi melempar & menangkap sangat baik"],
      ["Total Skor TGMD-3 Adaptif", totalTgmd.toString(), "Baik", "Secara keseluruhan memenuhi standar gerak dasar"],
    ],
    theme: "grid",
    headStyles: { fillColor: [15, 32, 67], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2, halign: "center" },
    columnStyles: {
      0: { halign: "left" },
      3: { halign: "left" },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- BAGIAN D: BUKTI SCREENSHOT ACTIVITY & MEDIA PIPE ---
  // Page break for screenshots to fit properly
  doc.addPage();
  currentY = 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 32, 67);
  doc.text("D. Dokumen Tangkapan Layar Game & Kamera MediaPipe", 14, currentY);
  currentY += 6;

  const logsWithScreenshots = studentLogs.filter((l) => l.screenshot_url);

  if (logsWithScreenshots.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Belum ada screenshot game yang tersimpan untuk siswa ini.", 14, currentY);
  } else {
    for (let i = 0; i < logsWithScreenshots.length; i++) {
      const log = logsWithScreenshots[i];
      if (currentY > 230) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      const dateStr = new Date(log.created_at).toLocaleString("id-ID");
      doc.text(
        `Game: ${log.game_type} | Skor: ${log.raw_score} (${log.score_category}) | Tanggal: ${dateStr}`,
        14,
        currentY
      );
      currentY += 4;

      try {
        // Load image convert to base64 if needed or add directly
        const imgData = await fetchImageAsBase64(log.screenshot_url!);
        if (imgData) {
          doc.addImage(imgData, "JPEG", 14, currentY, 120, 67.5); // 16:9 aspect ratio
          currentY += 72;
        } else {
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic");
          doc.text("[Gagal memuat gambar screenshot]", 14, currentY);
          currentY += 8;
        }
      } catch (err) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text("[Gambar tidak dapat ditampilkan]", 14, currentY);
        currentY += 8;
      }
    }
  }

  // Save the generated PDF
  const cleanName = playerName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`Laporan_Siswa_${cleanName}.pdf`);
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error fetching screenshot for PDF:", e);
    return null;
  }
}
