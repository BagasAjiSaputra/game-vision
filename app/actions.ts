"use server";

import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

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

// --- AUTH GURU ACTIONS ---

export async function registerTeacher(name: string, email: string, password: string, schoolName?: string) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  if (!name.trim() || !email.trim() || !password.trim()) {
    return { success: false, error: 'Nama, Email, dan Password wajib diisi.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Cek email duplikat
    const { data: existing } = await supabaseServer
      .from('teachers')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1);

    if (existing && existing.length > 0) {
      return { success: false, error: 'Email sudah terdaftar. Silakan login.' };
    }

    const passwordHash = hashPassword(password);
    const finalSchoolName = schoolName?.trim() || 'SLB TUNAS KASIH SURABAYA';

    // 2. Insert Guru baru
    const { data, error } = await supabaseServer
      .from('teachers')
      .insert([
        {
          name: name.trim(),
          email: cleanEmail,
          password_hash: passwordHash,
          school_name: finalSchoolName,
        }
      ])
      .select('id, name, email, school_name')
      .single();

    if (error) {
      console.error("Register Teacher Supabase Error:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      teacher: {
        id: data.id,
        name: data.name,
        email: data.email,
        school_name: data.school_name,
      } as TeacherUser,
      message: 'Registrasi Akun Guru berhasil!'
    };
  } catch (err: any) {
    console.error("Register Teacher Exception:", err);
    return { success: false, error: err.message };
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
      .select('id, name, email, password_hash, school_name')
      .eq('email', cleanEmail)
      .single();

    if (error || !data) {
      return { success: false, error: 'Email atau Password salah.' };
    }

    const inputHash = hashPassword(password);
    if (inputHash !== data.password_hash) {
      return { success: false, error: 'Email atau Password salah.' };
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

