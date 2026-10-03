"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { verifyResetToken, resetPasswordWithToken } from "@/app/actions";

function ResetPasswordForm({ isLightMode }: { isLightMode: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function checkToken() {
      if (!token || !email) {
        setTokenError("Link reset password tidak valid atau tidak lengkap.");
        setVerifying(false);
        return;
      }

      try {
        const res = await verifyResetToken(email, token);
        if (res.success) {
          setTokenValid(true);
        } else {
          setTokenError(res.error || "Token reset password tidak valid atau telah kadaluarsa.");
        }
      } catch (err: any) {
        setTokenError("Gagal mengonfirmasi link reset password.");
      } finally {
        setVerifying(false);
      }
    }

    checkToken();
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setErrorMsg("Password minimal harus 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Konfirmasi password tidak cocok dengan password baru.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await resetPasswordWithToken(email, token, newPassword);
      if (!res.success) {
        setErrorMsg(res.error || "Gagal mengatur ulang password.");
      } else {
        setSuccessMsg(res.message || "Password berhasil diubah!");
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[260px] text-center">
        <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4 ${
          isLightMode ? 'border-indigo-600' : 'border-[#d4ff00]'
        }`} />
        <p className={`font-bold text-sm ${isLightMode ? 'text-slate-600' : 'text-[#a0a0a0]'}`}>
          Memverifikasi link reset password...
        </p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight mb-2">Link Reset Tidak Valid</h2>
          <p className={`text-xs font-semibold max-w-sm mx-auto ${isLightMode ? 'text-slate-600' : 'text-[#a0a0a0]'}`}>
            {tokenError || "Link reset password ini mungkin sudah digunakan atau sudah kadaluarsa."}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className={`inline-flex items-center gap-2 px-6 py-3 border-2 font-black text-xs uppercase tracking-wider rounded-2xl transition-all hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none ${
            isLightMode 
              ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-[0_4px_0_0_#4338ca]' 
              : 'bg-[#d4ff00] text-black border-[#b8de00] hover:bg-[#b8de00] shadow-[0_4px_0_0_#9bb800]'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (successMsg) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Password Berhasil Diubah!</h2>
          <p className={`text-xs font-semibold max-w-sm mx-auto ${isLightMode ? 'text-slate-600' : 'text-[#a0a0a0]'}`}>
            Password akun Anda (<strong className={isLightMode ? 'text-indigo-600' : 'text-[#d4ff00]'}>{email}</strong>) telah diperbarui. Mengalihkan Anda ke halaman utama...
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className={`inline-flex items-center gap-2 px-6 py-3 border-2 font-black text-xs uppercase tracking-wider rounded-2xl transition-all hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none ${
            isLightMode 
              ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-[0_4px_0_0_#4338ca]' 
              : 'bg-[#d4ff00] text-black border-[#b8de00] hover:bg-[#b8de00] shadow-[0_4px_0_0_#9bb800]'
          }`}
        >
          Masuk Akun Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className={`w-14 h-14 border-2 rounded-2xl flex items-center justify-center mx-auto mb-3 ${
          isLightMode ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-[#d4ff00]/10 text-[#d4ff00] border-[#d4ff00]/30'
        }`}>
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Buat Password Baru</h2>
        <p className={`text-xs font-semibold mt-1 ${isLightMode ? 'text-slate-500' : 'text-[#a0a0a0]'}`}>
          Reset password untuk email <strong className={isLightMode ? 'text-indigo-600' : 'text-[#d4ff00]'}>{email}</strong>
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-500 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
            Password Baru
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full py-3 pl-10 pr-10 rounded-2xl text-sm font-medium border-2 focus:outline-none transition-colors ${
                isLightMode 
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' 
                  : 'bg-[#0a0d0c] border-[#2a2d2a] text-white focus:border-[#d4ff00]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full py-3 pl-10 pr-10 rounded-2xl text-sm font-medium border-2 focus:outline-none transition-colors ${
                isLightMode 
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' 
                  : 'bg-[#0a0d0c] border-[#2a2d2a] text-white focus:border-[#d4ff00]'
              }`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider border-2 transition-all transform hover:-translate-y-0.5 active:translate-y-[4px] active:shadow-none flex items-center justify-center gap-2 mt-2 ${
            isLightMode 
              ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-[0_4px_0_0_#4338ca]' 
              : 'bg-[#d4ff00] text-black border-[#b8de00] hover:bg-[#b8de00] shadow-[0_4px_0_0_#9bb800]'
          } ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" /> Simpan Password Baru
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [isLightMode, setIsLightMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("isLightMode");
    if (savedTheme !== null) setIsLightMode(savedTheme === "true");
  }, []);

  return (
    <main className={`min-h-screen font-sans flex flex-col justify-center items-center p-6 relative transition-colors duration-300 ${
      isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0d0c] text-white'
    }`}>
      {/* Header Controls */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center max-w-md mx-auto w-full">
        <Link 
          href="/" 
          className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all active:translate-y-[2px] active:shadow-none ${
            isLightMode 
              ? 'bg-white text-slate-800 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:bg-slate-50' 
              : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_4px_0_0_#0a0d0c] hover:border-[#d4ff00] hover:text-[#d4ff00]'
          }`}
          title="Kembali ke Beranda"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

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
      </div>

      <div className={`w-full max-w-md rounded-3xl p-6 md:p-8 border-2 relative z-10 transition-all ${
        isLightMode 
          ? 'bg-white text-slate-900 border-slate-200 shadow-[0_12px_0_0_#cbd5e1]' 
          : 'bg-[#1c1e1c] text-white border-[#2a2d2a] shadow-[0_12px_0_0_#0a0d0c]'
      }`}>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-10">
            <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4 ${
              isLightMode ? 'border-indigo-600' : 'border-[#d4ff00]'
            }`} />
            <p className={`font-bold text-sm ${isLightMode ? 'text-slate-600' : 'text-[#a0a0a0]'}`}>Memuat...</p>
          </div>
        }>
          <ResetPasswordForm isLightMode={isLightMode} />
        </Suspense>
      </div>
    </main>
  );
}
