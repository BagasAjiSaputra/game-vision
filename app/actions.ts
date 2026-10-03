"use server";

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { Resend } from 'resend';

// Menggunakan Service Role Key agar bisa bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

function hashPassword(password: string): string {
  const salt = 'game_motion_teacher_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export type TeacherUser = {
  id: string;
  name: string;
  email: string;
  school_name?: string;
};

// Helper untuk mengirim email OTP via Resend
async function sendOtpEmail(email: string, otpCode: string) {
  const resendApiKey = process.env.RESEND_API_KEY || '';
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY belum dikonfigurasi di environment server.');
  }

  const resend = new Resend(resendApiKey);

  const { data, error } = await resend.emails.send({
    from: 'Motionpedia <support@motionpedia.online>',
    to: email,
    subject: `${otpCode} - Kode OTP Aktivasi Akun Motionpedia`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Motionpedia</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Aktivasi Akun Guru</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Halo, masukkan kode OTP berikut untuk mengaktifkan akun Anda:</p>
          <div style="margin: 16px 0;">
            <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 12px 28px; border-radius: 14px; display: inline-block;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">
            Kode ini berlaku selama <strong>10 menit</strong>.<br/>Jangan berikan kode ini kepada siapa pun.
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Email otomatis dari Motionpedia &bull; Jika Anda tidak merasa mendaftar, abaikan email ini.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend Email Error:", error);
    throw new Error(error.message || "Gagal mengirim email OTP via Resend.");
  }

  return data;
}

// Helper untuk mengirim email Link Reset Password via Resend
async function sendResetPasswordEmail(email: string, resetUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY || '';
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY belum dikonfigurasi di environment server.');
  }

  const resend = new Resend(resendApiKey);

  const { data, error } = await resend.emails.send({
    from: 'Motionpedia <support@motionpedia.online>',
    to: email,
    subject: 'Reset Password Akun Motionpedia Guru',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Motionpedia</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Permintaan Reset Password</p>
        </div>
        <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Halo, kami menerima permintaan untuk mereset password akun Motionpedia Anda.</p>
          <p style="color: #334155; font-size: 14px; margin-bottom: 24px;">Klik tombol di bawah ini untuk membuat password baru:</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: 700; font-size: 15px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
              Reset Password Saya
            </a>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 20px 0 0 0; word-break: break-all;">
            Jika tombol di atas tidak dapat diklik, salin & tempel link berikut ke browser Anda:<br/>
            <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0 0;">
            Link ini berlaku selama <strong>1 jam</strong>.
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
          Email otomatis dari Motionpedia &bull; Jika Anda tidak meminta reset password, abaikan email ini.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend Reset Email Error:", error);
    throw new Error(error.message || "Gagal mengirim email reset password via Resend.");
  }

  return data;
}

// --- AUTH GURU ACTIONS ---

/**
 * Minta Reset Password (Kirim Link via Email)
 */
export async function requestPasswordReset(email: string, originUrl?: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  if (!email || !email.trim()) {
    return { success: false, error: 'Email wajib diisi.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Cek apakah email terdaftar
    const { data, error } = await supabaseServer
      .from('teachers')
      .select('id, name, email')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return { success: false, error: 'Email tidak terdaftar dalam sistem.' };
    }

    // 2. Generate secure token & expiry (1 jam)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabaseServer
      .from('teachers')
      .update({
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpiresAt,
      })
      .eq('id', data.id);

    if (updateErr) {
      console.error("Failed to update reset token:", updateErr);
      return { success: false, error: updateErr.message };
    }

    // Determine Base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://motionpedia.online';
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

    // 3. Kirim Email via Resend
    await sendResetPasswordEmail(cleanEmail, resetUrl);

    return {
      success: true,
      message: `Link reset password telah dikirim ke ${cleanEmail}. Silakan periksa kotak masuk atau spam email Anda.`
    };
  } catch (err: any) {
    console.error("Request Password Reset Exception:", err);
    return { success: false, error: err?.message || 'Gagal memproses permintaan reset password.' };
  }
}

/**
 * Verifikasi Token Reset Password
 */
export async function verifyResetToken(email: string, token: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  if (!email || !token) {
    return { success: false, error: 'Token atau email tidak valid.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    const { data, error } = await supabaseServer
      .from('teachers')
      .select('id, reset_token, reset_token_expires_at')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return { success: false, error: 'Token reset password tidak valid.' };
    }

    if (!data.reset_token || data.reset_token !== cleanToken) {
      return { success: false, error: 'Token reset password tidak sesuai atau sudah digunakan.' };
    }

    if (data.reset_token_expires_at && new Date(data.reset_token_expires_at) < new Date()) {
      return { success: false, error: 'Link reset password telah kadaluarsa. Silakan minta link baru.' };
    }

    return { success: true, message: 'Token valid.' };
  } catch (err: any) {
    console.error("Verify Reset Token Exception:", err);
    return { success: false, error: 'Gagal memverifikasi token reset password.' };
  }
}

/**
 * Update Password Baru dengan Token Reset
 */
export async function resetPasswordWithToken(email: string, token: string, newPassword: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  if (!email || !token || !newPassword || !newPassword.trim()) {
    return { success: false, error: 'Semua bidang wajib diisi.' };
  }

  if (newPassword.trim().length < 6) {
    return { success: false, error: 'Password minimal harus 6 karakter.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    // Verifikasi token
    const { data, error } = await supabaseServer
      .from('teachers')
      .select('id, reset_token, reset_token_expires_at')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return { success: false, error: 'Akun tidak ditemukan.' };
    }

    if (!data.reset_token || data.reset_token !== cleanToken) {
      return { success: false, error: 'Token reset password tidak sesuai atau sudah digunakan.' };
    }

    if (data.reset_token_expires_at && new Date(data.reset_token_expires_at) < new Date()) {
      return { success: false, error: 'Link reset password telah kadaluarsa.' };
    }

    const passwordHash = hashPassword(newPassword);

    // Update password, hapus reset token & aktifkan akun
    const { error: updateErr } = await supabaseServer
      .from('teachers')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires_at: null,
        is_activated: true,
      })
      .eq('id', data.id);

    if (updateErr) {
      console.error("Reset Password Update Error:", updateErr);
      return { success: false, error: updateErr.message };
    }

    return {
      success: true,
      message: 'Password berhasil diperbarui! Silakan login dengan password baru Anda.'
    };
  } catch (err: any) {
    console.error("Reset Password Exception:", err);
    return { success: false, error: err?.message || 'Gagal mengubah password.' };
  }
}

/**
 * Register Guru dengan Nama, Email, Password, dan Sekolah/Instansi.
 * Mengirimkan Kode OTP ke email untuk aktivasi.
 */
export async function registerTeacher(name: string, email: string, password: string, schoolName?: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  if (!name || !name.trim() || !email || !email.trim() || !password || !password.trim()) {
    return { success: false, error: 'Nama Lengkap, Email, dan Password wajib diisi.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const finalSchoolName = schoolName && schoolName.trim() ? schoolName.trim() : 'SLB TUNAS KASIH SURABAYA';

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const passwordHash = hashPassword(password);

    // 1. Cek email duplikat
    const { data: existing } = await supabaseServer
      .from('teachers')
      .select('id, is_activated')
      .eq('email', cleanEmail)
      .limit(1);

    if (existing && existing.length > 0) {
      const record = existing[0];
      if (record.is_activated !== false) {
        return { success: false, error: 'Email sudah terdaftar dan diaktifkan. Silakan login.' };
      }

      // Jika ada akun belum diaktifkan, perbarui nama, sekolah, password & OTP baru
      const { error: updateErr } = await supabaseServer
        .from('teachers')
        .update({
          name: cleanName,
          school_name: finalSchoolName,
          password_hash: passwordHash,
          otp_code: otpCode,
          otp_expires_at: otpExpiresAt,
          created_at: new Date().toISOString()
        })
        .eq('id', record.id);

      if (updateErr) {
        console.error("Update pending teacher error:", updateErr);
        return { success: false, error: updateErr.message };
      }
    } else {
      // 2. Insert Guru baru
      const { error: insertErr } = await supabaseServer
        .from('teachers')
        .insert([
          {
            name: cleanName,
            email: cleanEmail,
            password_hash: passwordHash,
            school_name: finalSchoolName,
            is_activated: false,
            otp_code: otpCode,
            otp_expires_at: otpExpiresAt,
          }
        ]);

      if (insertErr) {
        console.error("Register Teacher Supabase Error:", insertErr);
        return { success: false, error: insertErr.message };
      }
    }

    // 3. Kirim Email OTP via Resend
    await sendOtpEmail(cleanEmail, otpCode);

    return {
      success: true,
      requiresOtp: true,
      email: cleanEmail,
      message: `Kode OTP telah dikirim ke ${cleanEmail}. Silakan masukkan kode OTP untuk aktivasi.`
    };
  } catch (err: any) {
    console.error("Register Teacher Exception:", err);
    return { success: false, error: err?.message || 'Terjadi kesalahan sistem saat registrasi.' };
  }
}

/**
 * Verifikasi Kode OTP Aktivasi Akun
 */
export async function verifyTeacherOtp(email: string, otpCode: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  if (!email || !email.trim() || !otpCode || !otpCode.trim()) {
    return { success: false, error: 'Email dan Kode OTP wajib diisi.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    const { data, error } = await supabaseServer
      .from('teachers')
      .select('id, name, email, school_name, is_activated, otp_code, otp_expires_at')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return { success: false, error: 'Akun tidak ditemukan. Silakan registrasi ulang.' };
    }

    if (data.is_activated === true) {
      return {
        success: true,
        teacher: {
          id: data.id,
          name: data.name,
          email: data.email,
          school_name: data.school_name,
        } as TeacherUser,
        message: 'Akun Anda sudah aktif!'
      };
    }

    if (!data.otp_code || data.otp_code.trim() !== cleanOtp) {
      return { success: false, error: 'Kode OTP tidak sesuai. Silakan periksa kembali.' };
    }

    if (data.otp_expires_at && new Date(data.otp_expires_at) < new Date()) {
      return { success: false, error: 'Kode OTP telah kadaluarsa. Silakan minta kode OTP baru.' };
    }

    // Aktifkan akun
    const { error: updateErr } = await supabaseServer
      .from('teachers')
      .update({
        is_activated: true,
        otp_code: null,
        otp_expires_at: null,
      })
      .eq('id', data.id);

    if (updateErr) {
      console.error("Activate Teacher Error:", updateErr);
      return { success: false, error: updateErr.message };
    }

    return {
      success: true,
      teacher: {
        id: data.id,
        name: data.name,
        email: data.email,
        school_name: data.school_name,
      } as TeacherUser,
      message: 'Aktivasi akun berhasil!'
    };
  } catch (err: any) {
    console.error("Verify OTP Exception:", err);
    return { success: false, error: err?.message || 'Gagal memverifikasi Kode OTP.' };
  }
}

/**
 * Kirim Ulang Kode OTP ke Email
 */
export async function resendTeacherOtp(email: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  if (!email || !email.trim()) {
    return { success: false, error: 'Email wajib diisi.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabaseServer
      .from('teachers')
      .select('id, is_activated')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return { success: false, error: 'Akun tidak ditemukan. Silakan registrasi terlebih dahulu.' };
    }

    if (data.is_activated === true) {
      return { success: false, error: 'Akun sudah aktif. Silakan login.' };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: updateErr } = await supabaseServer
      .from('teachers')
      .update({
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt,
      })
      .eq('id', data.id);

    if (updateErr) {
      console.error("Resend OTP Update Error:", updateErr);
      return { success: false, error: updateErr.message };
    }

    await sendOtpEmail(cleanEmail, otpCode);

    return {
      success: true,
      message: `Kode OTP baru telah dikirim ke ${cleanEmail}.`
    };
  } catch (err: any) {
    console.error("Resend OTP Exception:", err);
    return { success: false, error: err?.message || 'Gagal mengirim ulang OTP.' };
  }
}

export async function loginTeacher(email: string, password: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  if (!email.trim() || !password.trim()) {
    return { success: false, error: 'Email dan Password wajib diisi.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabaseServer
      .from('teachers')
      .select('id, name, email, password_hash, school_name, is_activated')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return { success: false, error: 'Email atau Password salah.' };
    }

    const inputHash = hashPassword(password);
    if (inputHash !== data.password_hash) {
      return { success: false, error: 'Email atau Password salah.' };
    }

    if (data.is_activated === false) {
      // Buat OTP baru dan minta verifikasi
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await supabaseServer
        .from('teachers')
        .update({ otp_code: otpCode, otp_expires_at: otpExpiresAt })
        .eq('id', data.id);

      try {
        await sendOtpEmail(cleanEmail, otpCode);
      } catch (e) {
        console.error("Error sending OTP on login unactivated:", e);
      }

      return {
        success: false,
        requiresOtp: true,
        email: cleanEmail,
        error: 'Akun Anda belum aktif. Kami telah mengirimkan kode OTP baru ke email Anda.'
      };
    }

    return {
      success: true,
      teacher: {
        id: data.id,
        name: data.name,
        email: data.email,
        school_name: data.school_name,
      } as TeacherUser,
      message: 'Login berhasil!'
    };
  } catch (err: any) {
    console.error("Login Teacher Exception:", err);
    return { success: false, error: err.message };
  }
}

export async function saveGameScore(
  playerName: string,
  gameType: string,
  score: number,
  age?: number,
  teacherId?: string,
  schoolName?: string,
  screenshotUrl?: string,
  duration?: number | string
) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const finalPlayerName = (playerName && playerName.trim() ? playerName.trim() : 'PEMAIN TAMU').substring(0, 20).toUpperCase();
    const finalSchool = schoolName || 'SLB TUNAS KASIH SURABAYA';

    // Cek apakah record dengan player_name, teacher_id, dan game_type yang sama sudah ada
    let existingQuery = supabaseServer
      .from('game_scores')
      .select('id, score')
      .eq('player_name', finalPlayerName)
      .eq('game_type', gameType);

    if (teacherId) {
      existingQuery = existingQuery.eq('teacher_id', teacherId);
    } else {
      existingQuery = existingQuery.is('teacher_id', null);
    }

    const { data: existingRecords } = await existingQuery.limit(1);

    if (existingRecords && existingRecords.length > 0) {
      // UPDATE record yang ada
      const existingId = existingRecords[0].id;
      const updatePayload: any = {
        score: Math.max(0, Math.round(score)),
        age: age || null,
        school: finalSchool,
        created_at: new Date().toISOString()
      };
      if (screenshotUrl) updatePayload.screenshot_url = screenshotUrl;
      if (duration !== undefined && duration !== null) updatePayload.duration = duration.toString();

      const { data, error } = await supabaseServer
        .from('game_scores')
        .update(updatePayload)
        .eq('id', existingId)
        .select();

      if (error) {
        console.error("Server Action Supabase Update Error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data, message: "Skor berhasil diperbarui!" };
    } else {
      // INSERT record baru jika belum ada
      const insertPayload: any = {
        player_name: finalPlayerName,
        game_type: gameType,
        score: Math.max(0, Math.round(score)),
        age: age || null,
        school: finalSchool,
        created_at: new Date().toISOString()
      };
      if (teacherId) insertPayload.teacher_id = teacherId;
      if (screenshotUrl) insertPayload.screenshot_url = screenshotUrl;
      if (duration !== undefined && duration !== null) insertPayload.duration = duration.toString();

      const { data, error } = await supabaseServer
        .from('game_scores')
        .insert([insertPayload])
        .select();

      if (error) {
        console.error("Server Action Supabase Insert Error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, data, message: "Skor berhasil disimpan ke database!" };
    }
  } catch (err: any) {
    console.error("Server Action exception:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Upload screenshot ke Supabase Storage dan update record game_scores.
 * Menerima base64 data dari client, upload ke bucket "gamemotion",
 * lalu update kolom screenshot_url di record yang bersangkutan.
 */
export async function uploadScreenshotAndUpdateScore(
  scoreId: string,
  base64Data: string,
  gameType: string,
  playerName: string
) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // Decode base64 to buffer
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = playerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
    const filePath = `${gameType}/${safeName}_${timestamp}.jpg`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServer
      .storage
      .from('gamemotion')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error("Screenshot Upload Error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabaseServer
      .storage
      .from('gamemotion')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update game_scores record with screenshot URL
    if (scoreId) {
      const { error: updateError } = await supabaseServer
        .from('game_scores')
        .update({ screenshot_url: publicUrl })
        .eq('id', scoreId);

      if (updateError) {
        console.error("Screenshot URL Update Error:", updateError);
        // Masih return success karena upload berhasil
      }
    }

    return { success: true, url: publicUrl };
  } catch (err: any) {
    console.error("Upload Screenshot Exception:", err);
    return { success: false, error: err.message };
  }
}

export async function getGameScores(teacherId?: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    let query = supabaseServer
      .from('game_scores')
      .select('*, teachers(name, school_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Server Action Supabase Select Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Server Action Select exception:", err);
    return { success: false, error: err.message };
  }
}

export async function getTopScoresByGame(gameType: string, limit = 5) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data, error } = await supabaseServer
      .from('game_scores')
      .select('player_name, score, created_at')
      .eq('game_type', gameType)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true }) // If tie, older gets higher
      .limit(limit);

    if (error) {
      console.error(`Server Action Select Error for ${gameType}:`, error);
      return { success: false, error: error.message };
    }

    // Map to LeaderboardEntry format
    const formattedData = data.map(d => ({
      name: d.player_name,
      score: d.score,
      date: new Date(d.created_at).toLocaleDateString()
    }));

    return { success: true, data: formattedData };
  } catch (err: any) {
    console.error("Server Action Select exception:", err);
    return { success: false, error: err.message };
  }
}

export async function getLeaderboards() {
  const [endless, heli, basket] = await Promise.all([
    getTopScoresByGame('endless_runner'),
    getTopScoresByGame('heli_runner'),
    getTopScoresByGame('basket_shoot')
  ]);

  return {
    success: true,
    data: {
      endless: endless.success ? endless.data : [],
      heli: heli.success ? heli.data : [],
      basket: basket.success ? basket.data : []
    }
  };
}

