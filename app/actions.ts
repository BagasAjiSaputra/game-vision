"use server";

import { createClient } from '@supabase/supabase-js';

// Menggunakan Service Role Key agar bisa bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

export async function saveGameScore(playerName: string, gameType: string, score: number) {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return { success: false, error: 'Konfigurasi Supabase tidak lengkap di server.' };
  }

  const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { data, error } = await supabaseServer.from('game_scores').insert([
      {
        player_name: playerName,
        game_type: gameType,
        score: score
      }
    ]);

    if (error) {
      console.error("Server Action Supabase Insert Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
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
