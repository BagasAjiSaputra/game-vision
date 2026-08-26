import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

console.log("URL:", supabaseUrl);
console.log("KEY:", supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.from('game_scores').insert([
    {
      player_name: 'TEST_USER',
      game_type: 'test',
      score: 10
    }
  ]);
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
