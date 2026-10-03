"use client";

import { useState } from "react";
import { User, LogIn, UserPlus, X, School, Mail, Lock, CheckCircle2, AlertCircle, KeyRound, ArrowLeft, RefreshCw } from "lucide-react";
import { loginTeacher, registerTeacher, verifyTeacherOtp, resendTeacherOtp, requestPasswordReset, TeacherUser } from "@/app/actions";
import { setStoredTeacher } from "@/lib/teacherAuth";

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: TeacherUser) => void;
  isLightMode?: boolean;
}

export default function TeacherAuthModal({ isOpen, onClose, onSuccess, isLightMode = true }: TeacherAuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"auth" | "otp" | "forgot_password">("auth");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("SLB TUNAS KASIH SURABAYA");
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (activeTab === "login") {
        const res = await loginTeacher(email, password);
        if (!res.success) {
          if (res.requiresOtp && res.email) {
            setEmail(res.email);
            setStep("otp");
            setErrorMsg(res.error || "Akun Anda belum diaktifkan. Silakan verifikasi OTP.");
          } else {
            setErrorMsg(res.error || "Login gagal.");
          }
        } else if (res.teacher) {
          setSuccessMsg("Login Berhasil!");
          setStoredTeacher(res.teacher);
          setTimeout(() => {
            onSuccess(res.teacher!);
            onClose();
          }, 600);
        }
      } else {
        // Register (Nama, Email, Password, Sekolah)
        const res = await registerTeacher(name, email, password, schoolName);
        if (!res.success) {
          setErrorMsg(res.error || "Registrasi gagal.");
        } else if (res.requiresOtp && res.email) {
          setStep("otp");
          setSuccessMsg(res.message || "Kode OTP telah dikirimkan ke email Anda.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg("Masukkan 6 digit kode OTP.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await verifyTeacherOtp(email, otpCode);
      if (!res.success || !res.teacher) {
        setErrorMsg(res.error || "Verifikasi OTP gagal.");
      } else {
        setSuccessMsg("Aktivasi Akun Berhasil!");
        setStoredTeacher(res.teacher);
        setTimeout(() => {
          onSuccess(res.teacher!);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan sistem saat verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setErrorMsg("Masukkan email Anda.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const res = await requestPasswordReset(email, origin);
      if (!res.success) {
        setErrorMsg(res.error || "Gagal mengirim link reset password.");
      } else {
        setSuccessMsg(res.message || "Link reset password telah dikirim ke email Anda.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat mengirim link reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setErrorMsg("");
    setSuccessMsg("");
    setResending(true);

    try {
      const res = await resendTeacherOtp(email);
      if (res.success) {
        setSuccessMsg(res.message || "Kode OTP baru berhasil dikirim.");
      } else {
        setErrorMsg(res.error || "Gagal mengirim ulang OTP.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal mengirim ulang OTP.");
    } finally {
      setResending(false);
    }
  };

  const resetToAuthScreen = () => {
    setStep("auth");
    setOtpCode("");
    setErrorMsg("");
    setSuccessMsg("");
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
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              step === "otp" 
                ? isLightMode ? "bg-amber-100 text-amber-600" : "bg-amber-400/10 text-amber-400"
                : step === "forgot_password"
                ? isLightMode ? "bg-indigo-100 text-indigo-600" : "bg-indigo-400/10 text-indigo-400"
                : isLightMode ? "bg-indigo-100 text-indigo-600" : "bg-[#d4ff00]/10 text-[#d4ff00]"
            }`}>
              {step === "otp" ? <KeyRound className="w-5 h-5" /> : step === "forgot_password" ? <Mail className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {step === "otp" ? "Aktivasi Akun OTP" : step === "forgot_password" ? "Lupa Password Guru" : "Portal Akun Guru"}
              </h2>
              <p className={`text-xs ${isLightMode ? "text-slate-500" : "text-gray-400"}`}>
                {step === "otp" ? "Verifikasi email untuk melanjutkan" : step === "forgot_password" ? "Kirim link reset ke email Anda" : "Kelola data & skor murid"}
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

        {/* Tab Switcher (Hanya saat step === "auth") */}
        {step === "auth" && (
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
        )}

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

        {/* STEP 1: AUTH FORM (Login / Register) */}
        {step === "auth" && (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className={`block text-xs font-bold ${isLightMode ? "text-slate-700" : "text-gray-300"}`}>
                  Password
                </label>
                {activeTab === "login" && (
                  <button
                    type="button"
                    onClick={() => { setStep("forgot_password"); setErrorMsg(""); setSuccessMsg(""); }}
                    className={`text-xs font-semibold hover:underline ${
                      isLightMode ? "text-indigo-600" : "text-[#d4ff00]"
                    }`}
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
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
                  <UserPlus className="w-4 h-4" /> Kirim Kode OTP Aktivasi
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: FORGOT PASSWORD FORM */}
        {step === "forgot_password" && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className={`p-3.5 rounded-2xl text-xs border ${
              isLightMode ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-[#0d100e] border-white/10 text-gray-300"
            }`}>
              Masukkan email terdaftar Anda. Kami akan mengirimkan link ke email untuk membuat password baru.
            </div>

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
              ) : (
                <>
                  <Mail className="w-4 h-4" /> Kirim Link Reset Password
                </>
              )}
            </button>

            <div className="flex items-center justify-center pt-2 text-xs">
              <button
                type="button"
                onClick={resetToAuthScreen}
                className={`flex items-center gap-1 font-semibold hover:underline ${
                  isLightMode ? "text-slate-500 hover:text-slate-800" : "text-gray-400 hover:text-white"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: OTP VERIFICATION FORM */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className={`p-3.5 rounded-2xl text-xs border ${
              isLightMode ? "bg-slate-50 border-slate-200 text-slate-600" : "bg-[#0d100e] border-white/10 text-gray-300"
            }`}>
              Kode OTP 6-digit telah dikirim ke <strong className="text-indigo-600 font-bold">{email}</strong>. 
              Silakan cek folder inbox atau spam email Anda.
            </div>

            <div>
              <label className={`block text-xs font-bold mb-2 text-center uppercase tracking-wider ${isLightMode ? "text-slate-700" : "text-gray-300"}`}>
                Masukkan 6-Digit Kode OTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                className={`w-full py-3.5 px-4 text-center font-mono text-2xl font-bold tracking-[0.5em] rounded-2xl border focus:outline-none transition-colors ${
                  isLightMode
                    ? "bg-slate-50 border-slate-300 text-indigo-600 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                    : "bg-[#0d100e] border-white/20 text-[#d4ff00] focus:border-[#d4ff00] focus:ring-2 focus:ring-[#d4ff00]/20"
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                isLightMode
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  : "bg-[#d4ff00] text-black hover:bg-[#b8de00] shadow-md"
              } ${loading || otpCode.length !== 6 ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Verifikasi & Aktifkan
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={resetToAuthScreen}
                className={`flex items-center gap-1 font-semibold hover:underline ${
                  isLightMode ? "text-slate-500 hover:text-slate-800" : "text-gray-400 hover:text-white"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Ganti Email / Password
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className={`flex items-center gap-1 font-bold ${
                  isLightMode ? "text-indigo-600 hover:text-indigo-800" : "text-[#d4ff00] hover:underline"
                } ${resending ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} /> 
                {resending ? "Mengirim..." : "Kirim Ulang OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
