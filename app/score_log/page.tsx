"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Search, Activity, Calendar, Moon, Sun, UserCheck, ShieldCheck, School, Download, FileSpreadsheet, FileCode, Image, FileText } from "lucide-react";
import { getGameScores } from "@/app/actions";
import { getScoreCategory } from "@/lib/scoreUtils";
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
    const savedTheme = localStorage.getItem('isLightMode');
    if (savedTheme !== null) setIsLightMode(savedTheme === 'true');
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
    switch(type) {
      case 'endless_runner': return 'Endless Runner';
      case 'heli_runner': return 'Heli Runner';
      case 'basket_shoot': return 'Basket Shoot';
      default: return type;
    }
  };

  const getGameColor = (type: string) => {
    switch(type) {
      case 'endless_runner': return isLightMode ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-[#d4ff00] bg-[#d4ff00]/10 border-[#d4ff00]/30';
      case 'heli_runner': return isLightMode ? 'text-blue-700 bg-blue-100 border-blue-200' : 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/30';
      case 'basket_shoot': return isLightMode ? 'text-orange-700 bg-orange-100 border-orange-200' : 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/30';
      default: return isLightMode ? 'text-slate-700 bg-slate-100 border-slate-200' : 'text-white bg-white/10 border-white/30';
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
    link.setAttribute("download", `Log_Skor_Game_Motion_${filterMode}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (filteredLogs.length === 0) {
      alert("Tidak ada data log skor untuk diexport.");
      return;
    }

    const exportData = filteredLogs.map((log, index) => ({
      no: index + 1,
      player_name: log.player_name,
      age: log.age || null,
      game_type: log.game_type,
      game_name: getGameName(log.game_type),
      score: log.score,
      category: getScoreCategory(log.score).label,
      school: log.school || log.teachers?.school_name || "SLB TUNAS KASIH",
      teacher_name: log.teachers?.name || null,
      date: new Date(log.created_at).toLocaleString("id-ID"),
      raw_timestamp: log.created_at
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    
    link.href = url;
    link.setAttribute("download", `Log_Skor_Game_Motion_${filterMode}_${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className={`flex min-h-screen flex-col font-sans ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0d0c] text-white'}`}>
      <div className="w-full mx-auto px-4 py-6 md:px-12 md:py-16 flex flex-col min-h-screen">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-colors border ${isLightMode ? 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-900 shadow-sm' : 'bg-[#1c1e1c] text-[#a0a0a0] border-white/5 hover:border-white/50 hover:text-white'}`}>
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
            <div>
              <p className={`text-xs md:text-sm ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>
                {teacher ? `Guru: ${teacher.name} (${teacher.school_name})` : 'Dashboard Data'}
              </p>
              <h1 className="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                Log Skor Permainan
                {teacher && (
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Akun Guru Active
                  </span>
                )}
              </h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Export Buttons */}
            <button 
              onClick={handleExportCSV} 
              title="Unduh Data Skor Format CSV (Excel)"
              className={`px-4 py-2.5 md:px-5 md:py-3 rounded-full border-2 flex items-center gap-2 transition-all active:translate-y-[2px] font-bold text-xs uppercase tracking-wider ${
                isLightMode 
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm' 
                  : 'bg-emerald-500 text-black border-emerald-500 hover:bg-emerald-400'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>

            <button 
              onClick={async () => {
                if (filteredLogs.length === 0) {
                  alert("Tidak ada log untuk diexport PDF.");
                  return;
                }
                const firstPlayer = filteredLogs[0]?.player_name || "Siswa";
                const { generateStudentPDFReport } = await import("@/lib/pdfReportGenerator");
                
                // Transforma log format untuk PDF
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
              title="Unduh Laporan Format PDF (Lengkap Screenshot)"
              className={`px-4 py-2.5 md:px-5 md:py-3 rounded-full border-2 flex items-center gap-2 transition-all active:translate-y-[2px] font-bold text-xs uppercase tracking-wider ${
                isLightMode 
                  ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700 shadow-sm' 
                  : 'bg-rose-500 text-black border-rose-500 hover:bg-rose-400'
              }`}
            >
              <FileText className="w-4 h-4" /> Export PDF Siswa
            </button>

            <button 
              onClick={() => { const next = !isLightMode; setIsLightMode(next); localStorage.setItem('isLightMode', String(next)); }} 
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors ${isLightMode ? 'bg-white text-slate-700 shadow-sm hover:bg-slate-100 border border-slate-200' : 'bg-[#1c1e1c] text-[#a0a0a0] hover:text-white border border-white/5'}`}
            >
              {isLightMode ? <Moon className="w-5 h-5 md:w-6 md:h-6" /> : <Sun className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            <button onClick={fetchLogs} className={`px-4 py-2.5 md:px-5 md:py-3 rounded-full border-2 flex items-center gap-2 transition-all active:translate-y-[2px] font-bold text-xs uppercase tracking-wider ${isLightMode ? 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50' : 'bg-[#1c1e1c] border-[#2a2d2a] hover:bg-[#2a2d2a]'}`}>
              <Activity className="w-4 h-4" /> REFRESH
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 md:p-6 rounded-3xl border mb-6 md:mb-8 flex flex-col gap-4 md:gap-6 ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1e1c] border-white/5'}`}>
          
          {teacher && (
            <div className={`flex items-center p-1 rounded-2xl border w-fit ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-[#0a0d0c] border-white/10'}`}>
              <button
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-bold transition-all ${
                  filterMode === "all"
                    ? (isLightMode ? "bg-white text-slate-900 shadow-sm" : "bg-[#1c1e1c] text-white shadow-sm")
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Semua Log Global
              </button>
              <button
                onClick={() => setFilterMode("my_students")}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  filterMode === "my_students"
                    ? (isLightMode ? "bg-indigo-600 text-white shadow-sm" : "bg-[#d4ff00] text-black shadow-sm")
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <UserCheck className="w-4 h-4" /> Murid Saya ({teacher.name})
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Cari nama pemain..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className={`w-full border rounded-full py-3.5 pl-12 pr-6 text-sm focus:outline-none transition-colors ${isLightMode ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400' : 'bg-[#0a0d0c] border-white/10 text-white focus:border-white/30'}`}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar shrink-0">
              {['all', 'endless_runner', 'heli_runner', 'basket_shoot'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setFilterGame(filter)}
                  className={`px-5 py-2.5 md:px-6 md:py-3 rounded-full font-bold text-xs md:text-sm whitespace-nowrap transition-colors border shrink-0 ${filterGame === filter ? (isLightMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-black border-white') : (isLightMode ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300' : 'bg-[#0a0d0c] text-[#a0a0a0] border-white/10 hover:border-white/30')}`}
                >
                  {filter === 'all' ? 'Semua Game' : getGameName(filter)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table / List */}
        <div className={`rounded-3xl border ${isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1c1e1c] border-white/5'}`}>
          <div className={`grid grid-cols-12 gap-4 p-6 border-b font-bold text-xs uppercase tracking-wider hidden md:grid ${isLightMode ? 'border-slate-200 text-slate-500' : 'border-white/5 text-[#a0a0a0]'}`}>
            <div className="col-span-4">Pemain / Murid</div>
            <div className="col-span-3">Permainan & Sekolah</div>
            <div className="col-span-3">Tanggal</div>
            <div className="col-span-2 text-right">Skor</div>
          </div>
          
          <div className="p-4 md:p-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className={`animate-spin rounded-full h-8 w-8 border-t-2 ${isLightMode ? 'border-slate-900' : 'border-white'}`}></div>
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="flex flex-col gap-3 md:gap-0">
                {filteredLogs.map((log) => (
                  <div key={log.id} className={`grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl md:rounded-none md:border-b transition-colors items-center ${isLightMode ? 'bg-slate-50 md:bg-transparent border-slate-200 hover:bg-slate-50' : 'bg-[#0a0d0c] md:bg-transparent border-white/5 hover:bg-white/5'}`}>
                    
                    <div className="md:col-span-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center font-bold shrink-0 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${log.player_name}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{log.player_name}</span>
                          {log.age && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLightMode ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-gray-300'}`}>
                              {log.age} Th
                            </span>
                          )}
                        </div>
                        {log.teachers?.name && (
                          <span className="text-[11px] text-indigo-500 font-semibold block">
                            Guru: {log.teachers.name}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:col-span-3 flex flex-col justify-center items-start gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGameColor(log.game_type)}`}>
                        {getGameName(log.game_type)}
                      </span>
                      <span className={`text-[11px] flex items-center gap-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        <School className="w-3 h-3" /> {log.school || log.teachers?.school_name || 'SLB TUNAS KASIH'}
                      </span>
                    </div>
                    
                    <div className={`md:col-span-3 flex items-center gap-2 text-sm ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>
                      <Calendar className="w-4 h-4" />
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    
                    <div className="md:col-span-2 flex flex-col md:items-end justify-center gap-1">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500 md:hidden" />
                        <span className={`font-black text-2xl md:text-xl ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{log.score}</span>
                      </div>
                      {(() => {
                        const cat = getScoreCategory(log.score);
                        return (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeBg} ${cat.textColor} ${cat.borderColor} uppercase tracking-wider`}>
                            {cat.label}
                          </span>
                        );
                      })()}
                      <div className="flex items-center gap-1 mt-1">
                        {log.screenshot_url && (
                          <a
                            href={log.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${isLightMode ? 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100' : 'text-cyan-400 border-cyan-800 bg-cyan-900/30 hover:bg-cyan-900/50'}`}
                            title="Lihat Screenshot Game"
                          >
                            <Image className="w-3 h-3" />
                            
                          </a>
                        )}
                        <button
                          onClick={async () => {
                            const { generateStudentPDFReport } = await import("@/lib/pdfReportGenerator");
                            
                            // Ambil semua log milik siswa ini saja
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
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all active:scale-95 ${
                            isLightMode
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/60"
                          }`}
                          title={`Unduh Laporan PDF ${log.player_name}`}
                        >
                          <FileText className="w-3 h-3" />
                          PDF
                        </button>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center h-64 ${isLightMode ? 'text-slate-400' : 'text-[#a0a0a0]'}`}>
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Tidak ada data ditemukan</p>
              </div>
            )}
          </div>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </main>
  );
}

