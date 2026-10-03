"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { verifyResetToken, resetPasswordWithToken } from "@/app/actions";

function ResetPasswordForm() {
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
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Memverifikasi link reset password...</p>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Link Reset Tidak Valid</h2>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            {tokenError || "Link reset password ini mungkin sudah digunakan atau sudah kadaluarsa."}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (successMsg) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Berhasil Diubah!</h2>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            Password akun Anda (<strong className="text-slate-900">{email}</strong>) telah diperbarui. Mengalihkan Anda ke halaman utama...
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
        >
          Masuk Akun Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Buat Password Baru</h2>
        <p className="text-xs text-slate-500 mt-1">
          Reset password untuk email <strong className="text-indigo-600">{email}</strong>
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Password Baru
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full py-3 pl-10 pr-10 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full py-3 pl-10 pr-10 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
            submitting ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 relative z-10 animate-fadeIn">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-600 font-medium text-sm">Memuat...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
