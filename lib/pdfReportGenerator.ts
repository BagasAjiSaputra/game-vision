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
  game_duration?: number | string;
  duration?: number | string;
  screenshot_url?: string;
  disability_category?: string;
  school?: string;
  age?: number | string;
  tgmd_locomotor_score?: number;
  tgmd_object_control_score?: number;
}

/**
 * Helper function to format duration in seconds to readable string
 * e.g., 90 -> "1 m 30 s", 60 -> "1 Menit", 45 -> "45 Detik"
 */
function formatDuration(duration?: number | string): string {
  if (duration === undefined || duration === null || duration === "" || duration === "-") {
    return "-";
  }
  const num = typeof duration === "number" ? duration : parseInt(String(duration), 10);
  if (isNaN(num) || num <= 0) {
    return String(duration);
  }
  if (num >= 60) {
    const mins = Math.floor(num / 60);
    const secs = num % 60;
    return secs > 0 ? `${mins} m ${secs} s` : `${mins} Menit`;
  }
  return `${num} Detik`;
}

// ============================================================
// NORMA SKOR MOTORIK (skala 0 - 100)
// Ubah ambang di bawah ini bila norma resmi berubah.
// Poor: < poorMax | Fair: poorMax - fairMax | Good: fairMax+1 - goodMax | Excellent: > goodMax
// ============================================================
type NormCategory = "Poor" | "Fair" | "Good" | "Excellent";

interface TaskNorm {
  key: string;
  task: string;
  domain: string;
  domainShort: string;
  poorMax: number;
  fairMax: number;
  goodMax: number;
}

const TASK_NORMS: TaskNorm[] = [
  {
    key: "heli_runner",
    task: "Heli Runner",
    domain: "Locomotor / Agility",
    domainShort: "Locomotor/agility",
    poorMax: 25,
    fairMax: 50,
    goodMax: 75,
  },
  {
    key: "endless_runner",
    task: "Endless Runner",
    domain: "Endurance / Coordination",
    domainShort: "Endurance/coordination",
    poorMax: 25,
    fairMax: 50,
    goodMax: 75,
  },
  {
    key: "basket_shoot",
    task: "Basket Shoot",
    domain: "Manipulative Accuracy",
    domainShort: "Manipulative accuracy",
    poorMax: 25,
    fairMax: 50,
    goodMax: 75,
  },
];

const CATEGORY_ORDINAL: Record<NormCategory, number> = {
  Poor: 1,
  Fair: 2,
  Good: 3,
  Excellent: 4,
};

const ORDINAL_CATEGORY: NormCategory[] = ["Poor", "Fair", "Good", "Excellent"];

const CATEGORY_COLORS: Record<NormCategory, [number, number, number]> = {
  Poor: [192, 57, 43],
  Fair: [214, 170, 0],
  Good: [122, 182, 72],
  Excellent: [30, 94, 32],
};

function getNormCategory(score: number, norm: TaskNorm): NormCategory {
  const s = Math.min(100, Math.max(0, score));
  if (s < norm.poorMax) return "Poor";
  if (s <= norm.fairMax) return "Fair";
  if (s <= norm.goodMax) return "Good";
  return "Excellent";
}

function normalizeGameKey(gameType: string): string {
  return gameType.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function formatScore(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(1);
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
  const school = sampleLog.school || "SLB TUNAS KASIH SURABAYA";
  const currentDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const primaryNavy = [15, 32, 67]; // #0f2043 Navy UNESA
  const accentGold = [217, 119, 6]; // Amber/Gold accent

  // --- HEADER BANNER UNESA FIKK ---
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(14, 12, 182, 20, "F");

  // Accent Line
  doc.setFillColor(accentGold[0], accentGold[1], accentGold[2]);
  doc.rect(14, 32, 182, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("UNIVERSITAS NEGERI SURABAYA — FAKULTAS ILMU KEOLAHRAGAN DAN KESEHATAN", 105, 18, { align: "center" });

  doc.setFontSize(11);
  doc.text(
    "LAPORAN DETAIL EVALUASI MOTORIK GAME AI MARKERLESS",
    105,
    25,
    { align: "center" }
  );

  let currentY = 39;

  // Intro text
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const introText =
    "Dokumen ini memuat detail penilaian motorik kasar siswa berdasarkan hasil pengujian Game AI Markerless. Laporan mencakup data identitas anak, perolehan skor game beserta durasi dan normanya, serta bukti visual tangkapan layar aktivitas game dengan tracking kamera MediaPipe.";
  const splitIntro = doc.splitTextToSize(introText, 182);
  doc.text(splitIntro, 14, currentY);

  currentY += splitIntro.length * 4.2 + 4;

  // --- BAGIAN A: IDENTITAS ANAK ---
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("A. Identitas Anak", 14, currentY);
  currentY += 3.5;

  autoTable(doc, {
    startY: currentY,
    head: [],
    body: [
      ["Nama Siswa", playerName],
      ["Usia", age],
      ["Sekolah / Instansi", school],
      ["Tanggal Laporan", currentDate],
    ],
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [40, 40, 40] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, fillColor: [240, 244, 248] },
      1: { cellWidth: 137, fillColor: [255, 255, 255] },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // --- BAGIAN B: SKOR GAME AI MARKERLESS ---
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("B. Skor Game AI Markerless", 14, currentY);
  currentY += 3.5;

  // Ambil skor tertinggi (0-100) per jenis game
  const bestScores: Record<string, number | undefined> = {};
  for (const log of studentLogs) {
    const key = normalizeGameKey(log.game_type);
    const score = Math.min(100, Math.max(0, Number(log.raw_score) || 0));
    if (bestScores[key] === undefined || score > (bestScores[key] as number)) {
      bestScores[key] = score;
    }
  }

  const playedNorms = TASK_NORMS.filter((n) => bestScores[n.key] !== undefined);
  const totalGames = playedNorms.length;
  const averageScore =
    totalGames > 0
      ? playedNorms.reduce((sum, n) => sum + (bestScores[n.key] as number), 0) / totalGames
      : 0;

  const navyHead = {
    fillColor: primaryNavy as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 8.5,
  };
  const bodyStyles = {
    fontSize: 8.5,
    cellPadding: 2.5,
    textColor: [40, 40, 40] as [number, number, number],
    lineColor: [210, 215, 225] as [number, number, number],
    lineWidth: 0.2,
  };

  // B.1 Ringkasan skor
  autoTable(doc, {
    startY: currentY,
    head: [[...TASK_NORMS.map((n) => n.task), "Jumlah Game", "Rata-rata Skor"]],
    body: [
      [
        ...TASK_NORMS.map((n) =>
          bestScores[n.key] !== undefined ? formatScore(bestScores[n.key] as number) : "-"
        ),
        totalGames.toString(),
        totalGames > 0 ? averageScore.toFixed(1) : "-",
      ],
    ],
    theme: "grid",
    headStyles: navyHead,
    styles: bodyStyles,
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // B.2 Kategori norma per task
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Kategori Norma (Table 2, Norms of Motoric Score for Disability Students)", 14, currentY);
  currentY += 2.5;

  const taskCategories: (NormCategory | null)[] = TASK_NORMS.map((n) =>
    bestScores[n.key] !== undefined ? getNormCategory(bestScores[n.key] as number, n) : null
  );

  autoTable(doc, {
    startY: currentY,
    head: [["Task", "Domain", "Skor", "Kategori"]],
    body: TASK_NORMS.map((n, i) => [
      n.task,
      n.domain,
      bestScores[n.key] !== undefined ? formatScore(bestScores[n.key] as number) : "-",
      taskCategories[i] ?? "Belum dimainkan",
    ]),
    theme: "grid",
    headStyles: navyHead,
    styles: bodyStyles,
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 62 },
      2: { cellWidth: 35 },
      3: { cellWidth: 40 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const cat = taskCategories[data.row.index];
        if (cat) {
          data.cell.styles.fillColor = CATEGORY_COLORS[cat];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [130, 130, 130];
          data.cell.styles.fontStyle = "italic";
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 2;

  // B.3 Kategori komposit (rata-rata ordinal, dibulatkan)
  const playedCategories = taskCategories.filter((c): c is NormCategory => c !== null);
  let overallCategory: NormCategory | null = null;
  if (playedCategories.length > 0) {
    const avgOrdinal =
      playedCategories.reduce((sum, c) => sum + CATEGORY_ORDINAL[c], 0) / playedCategories.length;
    const rounded = Math.min(4, Math.max(1, Math.round(avgOrdinal)));
    overallCategory = ORDINAL_CATEGORY[rounded - 1];
  }

  autoTable(doc, {
    startY: currentY,
    body: [["Kategori Game AI Keseluruhan", overallCategory ?? "-"]],
    theme: "grid",
    styles: { ...bodyStyles, fontSize: 9.5, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 112, fontStyle: "bold", fillColor: [234, 240, 248], textColor: [20, 30, 50] },
      1: {
        cellWidth: 70,
        halign: "center",
        fontStyle: "bold",
        fillColor: overallCategory ? CATEGORY_COLORS[overallCategory] : [240, 240, 240],
        textColor: overallCategory ? [255, 255, 255] : [120, 120, 120],
      },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // B.4 Rujukan ambang norma (skala 0 - 100)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 110, 125);
  doc.text("Rujukan Ambang Norma (Skala Skor 0 - 100)", 14, currentY);
  currentY += 1.5;

  autoTable(doc, {
    startY: currentY,
    head: [["Task", "Domain", "Poor", "Fair", "Good", "Excellent"]],
    body: TASK_NORMS.map((n) => [
      n.task,
      n.domainShort,
      `< ${n.poorMax}`,
      `${n.poorMax} - ${n.fairMax}`,
      `${n.fairMax + 1} - ${n.goodMax}`,
      `> ${n.goodMax} (maks. 100)`,
    ]),
    theme: "grid",
    headStyles: { ...navyHead, fillColor: [55, 75, 105], fontSize: 8 },
    styles: { ...bodyStyles, fontSize: 8, cellPadding: 2.2 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 25 },
      3: { cellWidth: 27 },
      4: { cellWidth: 27 },
      5: { cellWidth: 33 },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 110, 125);
  const normNote = doc.splitTextToSize(
    "Skor tiap task diambil dari skor tertinggi siswa pada rentang 0 - 100. Kategori komposit dihitung dari rata-rata ordinal kategori task yang dimainkan (Poor=1, Fair=2, Good=3, Excellent=4), dibulatkan ke kategori terdekat.",
    182
  );
  doc.text(normNote, 14, currentY);
  currentY += normNote.length * 3.4 + 6;

  // --- BAGIAN C: BUKTI SCREENSHOT ACTIVITY & MEDIA PIPE ---
  // Selalu mulai di halaman baru agar judul menyatu dengan screenshot pertama
  doc.addPage();
  currentY = 18;
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("C. Dokumen Tangkapan Layar Game & Tracking MediaPipe", 14, currentY);
  currentY += 6;

  const logsWithScreenshots = studentLogs.filter((l) => l.screenshot_url);

  if (logsWithScreenshots.length === 0) {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Belum ada tangkapan layar game yang tersimpan untuk siswa ini.", 14, currentY);
  } else {
    for (let i = 0; i < logsWithScreenshots.length; i++) {
      const log = logsWithScreenshots[i];
      const rawDur = log.game_duration ?? log.duration;
      const formattedDur = formatDuration(rawDur);

      // Height of screenshot image box: ~75mm
      const requiredHeight = 88;
      if (currentY + requiredHeight > 270) {
        doc.addPage();
        currentY = 16;
      }

      const dateStr = new Date(log.created_at).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Info banner above screenshot
      doc.setFillColor(240, 244, 248);
      doc.setDrawColor(200, 210, 225);
      doc.rect(14, currentY, 182, 7, "FD");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 32, 67);
      doc.text(
        `[${i + 1}] Game: ${log.game_type}  |  Skor: ${log.raw_score} (${log.score_category})  |  Durasi Main: ${formattedDur}  |  Waktu: ${dateStr}`,
        17,
        currentY + 4.8
      );

      currentY += 9;

      try {
        const imgData = await fetchImageAsBase64(log.screenshot_url!);
        if (imgData) {
          // Draw Border box around image
          doc.setDrawColor(180, 190, 205);
          doc.rect(14, currentY, 182, 75, "D");
          doc.addImage(imgData, "JPEG", 14.5, currentY + 0.5, 181, 74);
          currentY += 80;
        } else {
          doc.setFontSize(8);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(120, 120, 120);
          doc.text("[Gagal memuat gambar tangkapan layar]", 14, currentY + 5);
          currentY += 12;
        }
      } catch (err) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120, 120, 120);
        doc.text("[Gambar tangkapan layar tidak dapat ditampilkan]", 14, currentY + 5);
        currentY += 12;
      }
    }
  }

  // --- ADD PAGE NUMBERS AND FOOTER TO ALL PAGES ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Header for Page 2+
    if (i > 1) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text(`Laporan Detail Evaluasi Motorik Siswa: ${playerName}`, 14, 10);
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 11.5, 196, 11.5);
    }

    // Footer on all pages
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 284, 196, 284);

    doc.text(
      "Dokumen Resmi Evaluasi Motorik Game AI Markerless — RuangRobot & UNESA FIKK",
      14,
      288
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, 196, 288, { align: "right" });
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
