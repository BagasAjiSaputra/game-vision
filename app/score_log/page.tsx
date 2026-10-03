"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Trophy, 
  Search, 
  RefreshCw, 
  Calendar, 
  Moon, 
  Sun, 
  UserCheck, 
  ShieldCheck, 
  School, 
  FileSpreadsheet, 
  Image, 
  FileText,
  Activity,
  Award,
  Users
} from "lucide-react";
import { getGameScores } from "@/app/actions";
import { getScoreCategory, getGameTitle } from "@/lib/scoreUtils";
import { useTeacherAuth } from "@/lib/teacherAuth";

interface ScoreLog {
  id: string;
  teacher_id?: string;
  player_name: string;
  game_type: string;
  score: number;
  school?: string;
  age?: number;
  screenshot_url?: string;
  created_at: string;
  duration?: string | number;
  game_duration?: number;
  movement_count?: number;
  disability_category?: string;
  tgmd_locomotor_score?: number;
  tgmd_object_control_score?: number;
  teachers?: {
    name: string;
    school_name: string;
  };
}

export default function ScoreLogPage() {
  const [logs, setLogs] = useState<ScoreLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGame, setFilterGame] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<"all" | "my_students">("all");
  const [searchName, setSearchName] = useState("");

  const [isLightMode, setIsLightMode] = useState(true);
  const { teacher } = useTeacherAuth();

  useEffect(() => {
    fetchLogs();
    const savedTheme = localStorage.getItem("isLightMode");
    if (savedTheme !== null) setIsLightMode(savedTheme === "true");
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await getGameScores();
      if (!response.success) throw new Error(response.error);
      setLogs(response.data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchGame = filterGame === "all" || log.game_type === filterGame;
    const matchName = log.player_name.toLowerCase().includes(searchName.toLowerCase());
    const matchTeacher = filterMode === "all" || (teacher && log.teacher_id === teacher.id);
    return matchGame && matchName && matchTeacher;
  });

  const getGameName = (type: string) => {
    return getGameTitle(type);
  };

  const getGameBadge = (type: string) => {
    switch(type) {
      case 'endless_runner': 
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'heli_runner': 
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'basket_shoot': 
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default: 
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getCategoryStyle = (score: number) => {
    const cat = getScoreCategory(score);
    switch (cat.color) {
      case "emerald":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "blue":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "yellow":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "orange":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert("Tidak ada data log skor untuk diexport.");
      return;
    }

    const headers = [
      "No",
      "Nama Pemain / Murid",
      "Usia",
      "Jenis Permainan",
      "Skor (0-100)",
      "Kategori Evaluasi",
      "Sekolah / Instansi",
      "Nama Guru",
      "Tanggal & Waktu"
    ];

    const rows = filteredLogs.map((log, index) => {
      const gameName = getGameName(log.game_type);
      const category = getScoreCategory(log.score).label;
      const school = log.school || log.teachers?.school_name || "SLB TUNAS KASIH";
      const teacherName = log.teachers?.name || "-";
      const formattedDate = new Date(log.created_at).toLocaleString("id-ID");

      return [
        index + 1,
        `"${log.player_name.replace(/"/g, '""')}"`,
        log.age ? `"${log.age} Th"` : '"-"',
        `"${gameName}"`,
        log.score,
        `"${category}"`,
        `"${school.replace(/"/g, '""')}"`,
        `"${teacherName.replace(/"/g, '""')}"`,
        `"${formattedDate}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    
    link.href = url;
    link.setAttribute("download", `Log_Skor_Motionpedia_${filterMode}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const totalEvaluations = filteredLogs.length;
  const avgScore = totalEvaluations > 0 ? Math.round(filteredLogs.reduce((acc, l) => acc + l.score, 0) / totalEvaluations) : 0;
  const highestScore = totalEvaluations > 0 ? Math.max(...filteredLogs.map(l => l.score)) : 0;
  const uniqueStudents = new Set(filteredLogs.map(l => l.player_name.toLowerCase())).size;

  return (
    <main className={`min-h-screen font-sans px-6 py-12 md:px-12 md:py-16 transition-colors duration-300 ${
      isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0d0c] text-white'
    }`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all active:translate-y-[2px] active:shadow-none ${
                isLightMode 
                  ? 'bg-white text-slate-800 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:bg-slate-50' 
                  : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_4px_0_0_#0a0d0c] hover:border-[#d4ff00] hover:text-[#d4ff00]'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                  Evaluasi Skor <span className={isLightMode ? "text-indigo-600" : "text-[#d4ff00]"}>Murid</span>
                </h1>
                {teacher && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 flex items-center gap-1.5 ${
                    isLightMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-[#1c1e1c] border-[#d4ff00]/40 text-[#d4ff00]'
                  }`}>
                    <ShieldCheck className="w-3.5 h-3.5" /> Akun Guru
                  </span>
                )}
              </div>
              <p className={`text-xs font-semibold mt-0.5 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>
                {teacher ? `Terhubung sebagai ${teacher.name} (${teacher.school_name || 'SLB TUNAS KASIH'})` : 'Rekam data evaluasi permainan sensor gerak'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExportCSV} 
              className={`px-4 py-2.5 rounded-2xl border-2 font-bold text-xs flex items-center gap-2 transition-all active:translate-y-[2px] active:shadow-none ${
                isLightMode 
                  ? 'bg-white text-slate-800 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:border-emerald-500 hover:text-emerald-600' 
                  : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_4px_0_0_#0a0d0c] hover:border-emerald-400 hover:text-emerald-400'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export CSV
            </button>

            <button 
              onClick={async () => {
                if (filteredLogs.length === 0) {
                  alert("Tidak ada log untuk diexport PDF.");
                  return;
                }
                const firstPlayer = filteredLogs[0]?.player_name || "Siswa";
                const { generateStudentPDFReport } = await import("@/lib/pdfReportGenerator");
                
                const pdfLogs = filteredLogs.map(l => ({
                  id: l.id,
                  created_at: l.created_at,
                  player_name: l.player_name,
                  game_type: getGameName(l.game_type),
                  raw_score: l.score,
                  score_category: getScoreCategory(l.score).label,
                  game_duration: l.game_duration ?? l.duration,
                  screenshot_url: l.screenshot_url,
                  disability_category: l.disability_category,
                  school: l.school || l.teachers?.school_name,
                  age: l.age,
                  tgmd_locomotor_score: l.tgmd_locomotor_score,
                  tgmd_object_control_score: l.tgmd_object_control_score
                }));

                await generateStudentPDFReport(firstPlayer, pdfLogs);
              }} 
              className={`px-4 py-2.5 rounded-2xl border-2 font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all active:translate-y-[2px] active:shadow-none ${
                isLightMode 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-[0_4px_0_0_#4338ca]' 
                  : 'bg-[#d4ff00] hover:bg-[#b8de00] text-black border-[#b8de00] shadow-[0_4px_0_0_#9bb800]'
              }`}
            >
              <FileText className="w-4 h-4" /> Export PDF Laporan
            </button>

            <button 
              onClick={() => { const next = !isLightMode; setIsLightMode(next); localStorage.setItem('isLightMode', String(next)); }} 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all active:translate-y-[2px] active:shadow-none ${
                isLightMode 
                  ? 'bg-white text-slate-700 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:bg-slate-100' 
                  : 'bg-[#1c1e1c] text-[#a0a0a0] border-[#2a2d2a] shadow-[0_4px_0_0_#0a0d0c] hover:text-white hover:border-[#d4ff00]'
              }`}
              title="Ganti Tema"
            >
              {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button 
              onClick={fetchLogs} 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all active:translate-y-[2px] active:shadow-none ${
                isLightMode 
                  ? 'bg-white text-slate-700 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:bg-slate-100' 
                  : 'bg-[#1c1e1c] text-[#a0a0a0] border-[#2a2d2a] shadow-[0_4px_0_0_#0a0d0c] hover:text-white hover:border-[#d4ff00]'
              }`}
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className={`p-5 rounded-3xl border-2 transition-all ${
            isLightMode ? 'bg-white text-slate-800 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#0a0d0c]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Total Evaluasi</span>
              <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center ${isLightMode ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-[#d4ff00]/10 border-[#d4ff00]/30 text-[#d4ff00]'}`}>
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black mt-3">{totalEvaluations}</p>
          </div>

          <div className={`p-5 rounded-3xl border-2 transition-all ${
            isLightMode ? 'bg-white text-slate-800 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#0a0d0c]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Rata-rata Skor</span>
              <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center ${isLightMode ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'}`}>
                <Award className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black mt-3">{avgScore}<span className="text-xs font-bold text-[#a0a0a0]">/100</span></p>
          </div>

          <div className={`p-5 rounded-3xl border-2 transition-all ${
            isLightMode ? 'bg-white text-slate-800 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#0a0d0c]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Skor Tertinggi</span>
              <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center ${isLightMode ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black mt-3">{highestScore}<span className="text-xs font-bold text-[#a0a0a0]">/100</span></p>
          </div>

          <div className={`p-5 rounded-3xl border-2 transition-all ${
            isLightMode ? 'bg-white text-slate-800 border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_6px_0_0_#0a0d0c]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Murid Evaluasi</span>
              <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center ${isLightMode ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black mt-3">{uniqueStudents}</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className={`p-5 rounded-3xl border-2 mb-8 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center ${
          isLightMode ? 'bg-white border-slate-200 shadow-[0_6px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] border-[#2a2d2a] shadow-[0_6px_0_0_#0a0d0c]'
        }`}>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a0a0]" />
              <input 
                type="text" 
                placeholder="Cari nama murid..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className={`w-full border-2 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none transition-colors ${
                  isLightMode 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' 
                    : 'bg-[#0a0d0c] border-[#2a2d2a] text-white focus:border-[#d4ff00]'
                }`}
              />
            </div>

            {/* Filter Mode Switcher if teacher logged in */}
            {teacher && (
              <div className={`flex items-center p-1 rounded-2xl border-2 ${
                isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-[#0a0d0c] border-[#2a2d2a]'
              }`}>
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-2 ${
                    filterMode === "all"
                      ? isLightMode ? "bg-indigo-600 text-white border-indigo-600 shadow-[0_2px_0_0_#4338ca]" : "bg-[#d4ff00] text-black border-[#d4ff00] shadow-[0_2px_0_0_#9bb800]"
                      : "text-[#a0a0a0] border-transparent hover:text-white"
                  }`}
                >
                  Semua Log
                </button>
                <button
                  onClick={() => setFilterMode("my_students")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-2 ${
                    filterMode === "my_students"
                      ? isLightMode ? "bg-indigo-600 text-white border-indigo-600 shadow-[0_2px_0_0_#4338ca]" : "bg-[#d4ff00] text-black border-[#d4ff00] shadow-[0_2px_0_0_#9bb800]"
                      : "text-[#a0a0a0] border-transparent hover:text-white"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" /> Murid Saya
                </button>
              </div>
            )}
          </div>

          {/* Game Type Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {['all', 'endless_runner', 'heli_runner', 'basket_shoot'].map(filter => (
              <button 
                key={filter}
                onClick={() => setFilterGame(filter)}
                className={`px-3.5 py-2 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border-2 shrink-0 ${
                  filterGame === filter 
                    ? isLightMode 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_3px_0_0_#4338ca]' 
                      : 'bg-[#d4ff00] text-black border-[#d4ff00] shadow-[0_3px_0_0_#9bb800]'
                    : isLightMode 
                      ? 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900' 
                      : 'bg-[#0a0d0c] text-[#a0a0a0] border-[#2a2d2a] hover:text-white'
                }`}
              >
                {filter === 'all' ? 'Semua Mode' : getGameName(filter)}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table Container */}
        <div className={`rounded-3xl border-2 overflow-hidden ${
          isLightMode ? 'bg-white border-slate-200 shadow-[0_8px_0_0_#e2e8f0]' : 'bg-[#1c1e1c] border-[#2a2d2a] shadow-[0_8px_0_0_#0a0d0c]'
        }`}>
          {/* Desktop Table Header */}
          <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-b-2 font-black text-xs uppercase tracking-wider hidden md:grid ${
            isLightMode ? 'border-slate-200 text-slate-600 bg-slate-100' : 'border-[#2a2d2a] text-[#a0a0a0] bg-[#0a0d0c]'
          }`}>
            <div className="col-span-4">Murid / Pemain</div>
            <div className="col-span-3">Mode & Sekolah</div>
            <div className="col-span-3">Tanggal Evaluasi</div>
            <div className="col-span-2 text-right">Skor & Aksi</div>
          </div>
          
          <div className={`divide-y ${isLightMode ? 'divide-slate-200' : 'divide-[#2a2d2a]'}`}>
            {loading ? (
              <div className="flex flex-col justify-center items-center h-48 py-10">
                <div className={`w-8 h-8 border-3 rounded-full animate-spin mb-3 ${isLightMode ? 'border-indigo-600 border-t-transparent' : 'border-[#d4ff00] border-t-transparent'}`}></div>
                <p className={`text-xs font-bold ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Memuat data skor evaluasi...</p>
              </div>
            ) : filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div key={log.id} className={`p-4 md:px-6 md:py-4 transition-colors ${
                  isLightMode ? 'hover:bg-slate-50' : 'hover:bg-black/30'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Student Info */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.player_name}`} 
                        alt="Avatar" 
                        className={`w-11 h-11 rounded-full border-2 shrink-0 ${
                          isLightMode ? 'border-slate-200 bg-indigo-50' : 'border-[#2a2d2a] bg-black/40'
                        }`} 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base truncate">{log.player_name}</span>
                          {log.age && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-2 ${
                              isLightMode ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-black/40 text-gray-300 border-[#2a2d2a]'
                            }`}>
                              {log.age} Th
                            </span>
                          )}
                        </div>
                        {log.teachers?.name && (
                          <span className={`text-xs font-semibold block truncate ${isLightMode ? 'text-indigo-600' : 'text-[#d4ff00]'}`}>
                            Guru: {log.teachers.name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Game Type & School */}
                    <div className="md:col-span-3 flex flex-col items-start gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getGameBadge(log.game_type)}`}>
                        {getGameName(log.game_type)}
                      </span>
                      <span className={`text-xs font-medium flex items-center gap-1.5 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>
                        <School className="w-3.5 h-3.5 shrink-0" /> {log.school || log.teachers?.school_name || 'SLB TUNAS KASIH'}
                      </span>
                    </div>
                    
                    {/* Date */}
                    <div className={`md:col-span-3 flex items-center gap-1.5 text-xs font-medium ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>
                      <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    
                    {/* Score & Action Buttons */}
                    <div className="md:col-span-2 flex flex-row md:flex-col md:items-end justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xl">{log.score}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border-2 ${getCategoryStyle(log.score)}`}>
                          {getScoreCategory(log.score).label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.screenshot_url && (
                          <a
                            href={log.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 ${
                              isLightMode 
                                ? 'text-slate-700 border-slate-200 hover:bg-slate-100' 
                                : 'text-gray-300 border-[#2a2d2a] hover:bg-white/10 hover:text-white'
                            }`}
                            title="Tampilkan Screenshot Game"
                          >
                            <Image className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={async () => {
                            const { generateStudentPDFReport } = await import("@/lib/pdfReportGenerator");
                            const studentLogs = filteredLogs
                              .filter((l) => l.player_name.toLowerCase() === log.player_name.toLowerCase())
                              .map((l) => ({
                                id: l.id,
                                created_at: l.created_at,
                                player_name: l.player_name,
                                game_type: getGameName(l.game_type),
                                raw_score: l.score,
                                score_category: getScoreCategory(l.score).label,
                                game_duration: l.game_duration ?? l.duration,
                                screenshot_url: l.screenshot_url,
                                disability_category: l.disability_category,
                                school: l.school || l.teachers?.school_name,
                                age: l.age,
                                tgmd_locomotor_score: l.tgmd_locomotor_score,
                                tgmd_object_control_score: l.tgmd_object_control_score,
                              }));

                            await generateStudentPDFReport(log.player_name, studentLogs);
                          }}
                          className={`px-3 py-1.5 rounded-xl border-2 font-bold text-xs transition-all flex items-center gap-1.5 active:scale-95 ${
                            isLightMode
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                              : "bg-[#d4ff00]/10 text-[#d4ff00] border-[#d4ff00]/30 hover:bg-[#d4ff00]/20"
                          }`}
                          title={`Unduh Laporan PDF ${log.player_name}`}
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-base font-bold">Tidak ada data skor ditemukan</p>
                <p className={`text-xs mt-1 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>Coba ubah kata kunci pencarian atau filter mode permainan</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
