"use client";

import { useState } from "react";
import { User, LogIn, UserPlus, X, School, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { loginTeacher, registerTeacher, TeacherUser } from "@/app/actions";
import { setStoredTeacher } from "@/lib/teacherAuth";

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: TeacherUser) => void;
  isLightMode?: boolean;
}

export default function TeacherAuthModal({ isOpen, onClose, onSuccess, isLightMode = true }: TeacherAuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("SLB TUNAS KASIH SURABAYA");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (activeTab === "login") {
        const res = await loginTeacher(email, password);
        if (!res.success || !res.teacher) {
          setErrorMsg(res.error || "Login gagal.");
        } else {
          setSuccessMsg("Login Berhasil!");
          setStoredTeacher(res.teacher);
          setTimeout(() => {
            onSuccess(res.teacher);
            onClose();
          }, 600);
        }
      } else {
        const res = await registerTeacher(name, email, password, schoolName);
        if (!res.success || !res.teacher) {
          setErrorMsg(res.error || "Registrasi gagal.");
        } else {
          setSuccessMsg("Registrasi Akun Guru Berhasil!");
          setStoredTeacher(res.teacher);
          setTimeout(() => {
            onSuccess(res.teacher);
            onClose();
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border transition-all transform scale-100 ${
          isLightMode ? "bg-white text-slate-900 border-slate-200" : "bg-[#181b19] text-white border-white/10"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isLightMode ? "bg-indigo-100 text-indigo-600" : "bg-[#d4ff00]/10 text-[#d4ff00]"}`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Portal Akun Guru</h2>
              <p className={`text-xs ${isLightMode ? "text-slate-500" : "text-gray-400"}`}>
                Kelola data & skor murid
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isLightMode ? "hover:bg-slate-100 text-slate-400 hover:text-slate-700" : "hover:bg-white/10 text-gray-400 hover:text-white"}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`grid grid-cols-2 p-1 rounded-2xl mb-6 border ${isLightMode ? "bg-slate-100 border-slate-200" : "bg-[#0d100e] border-white/5"}`}>
          <button
            type="button"
            onClick={() => { setActiveTab("login"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === "login"
                ? isLightMode 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "bg-[#1c1e1c] text-[#d4ff00] shadow-sm"
                : isLightMode 
                  ? "text-slate-500 hover:text-slate-800" 
                  : "text-gray-400 hover:text-white"
            }`}
          >
            <LogIn className="w-4 h-4" /> Login Guru
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("register"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === "register"
                ? isLightMode 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "bg-[#1c1e1c] text-[#d4ff00] shadow-sm"
                : isLightMode 
                  ? "text-slate-500 hover:text-slate-800" 
                  : "text-gray-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-4 h-4" /> Register Baru
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "register" && (
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLightMode ? "text-slate-700" : "text-gray-300"}`}>
                Nama Lengkap Guru
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Rina S.Pd"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full py-3 pl-10 pr-4 rounded-xl text-sm border focus:outline-none transition-colors ${
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      : "bg-[#0d100e] border-white/10 text-white focus:border-[#d4ff00]"
                  }`}
                />
              </div>
            </div>
          )}

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isLightMode ? "text-slate-700" : "text-gray-300"}`}>
              Email Guru
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="guru@sekolah.sch.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full py-3 pl-10 pr-4 rounded-xl text-sm border focus:outline-none transition-colors ${
                  isLightMode
                    ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                    : "bg-[#0d100e] border-white/10 text-white focus:border-[#d4ff00]"
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isLightMode ? "text-slate-700" : "text-gray-300"}`}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full py-3 pl-10 pr-4 rounded-xl text-sm border focus:outline-none transition-colors ${
                  isLightMode
                    ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                    : "bg-[#0d100e] border-white/10 text-white focus:border-[#d4ff00]"
                }`}
              />
            </div>
          </div>

          {activeTab === "register" && (
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isLightMode ? "text-slate-700" : "text-gray-300"}`}>
                Nama Sekolah / Instansi
              </label>
              <div className="relative">
                <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="SLB TUNAS KASIH SURABAYA"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className={`w-full py-3 pl-10 pr-4 rounded-xl text-sm border focus:outline-none transition-colors ${
                    isLightMode
                      ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500"
                      : "bg-[#0d100e] border-white/10 text-white focus:border-[#d4ff00]"
                  }`}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
              isLightMode
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                : "bg-[#d4ff00] text-black hover:bg-[#b8de00] shadow-md"
            } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : activeTab === "login" ? (
              <>
                <LogIn className="w-4 h-4" /> Masuk Akun Guru
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Buat Akun Guru
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
