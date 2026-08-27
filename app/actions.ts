"use server";

import { createClient } from '@supabase/supabase-js';

// Menggunakan Service Role Key agar bisa bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

export async function saveGameScore(playerName: string, gameType: string, score: number, age?: number) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // 1. Cek apakah pemain sudah punya skor di game ini
    const { data: existingData, error: fetchError } = await supabaseServer
      .from('game_scores')
      .select('id, score')
      .eq('player_name', playerName)
      .eq('game_type', gameType)
      .order('score', { ascending: false }) // Ambil yang skornya paling tinggi jika ada duplikat sebelumnya
      .limit(1);

    if (fetchError) {
      console.error("Server Action Supabase Fetch Error:", fetchError);
      return { success: false, error: fetchError.message };
    }

    if (existingData && existingData.length > 0) {
      const record = existingData[0];

      // 2. Hanya update jika skor baru LEBIH TINGGI dari rekor sebelumnya
      if (score > record.score) {
        const { data, error } = await supabaseServer
          .from('game_scores')
          .update({ score: score, age: age, created_at: new Date().toISOString() }) // Update skor & waktu
          .eq('id', record.id);

        if (error) {
          console.error("Server Action Supabase Update Error:", error);
          return { success: false, error: error.message };
        }
        return { success: true, data, message: "Rekor baru berhasil diperbarui!" };
      } else {
        return { success: true, message: "Skor tidak lebih tinggi dari rekor sebelumnya." };
      }
    } else {
      // 3. Jika belum ada, buat baris baru (Insert)
      const { data, error } = await supabaseServer.from('game_scores').insert([
        {
          player_name: playerName,
          game_type: gameType,
          score: score,
          age: age
        }
      ]);

      if (error) {
        console.error("Server Action Supabase Insert Error:", error);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    }
  } catch (err: any) {
    console.error("Server Action exception:", err);
    return { success: false, error: err.message };
  }
}

export async function getGameScores() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data, error } = await supabaseServer
      .from('game_scores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

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
