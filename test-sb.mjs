import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const { data, error } = await supabase.from('game_scores').insert([
  { player_name: 'TEST_USER', game_type: 'test', score: 10 }
]);
console.log("Error:", error);
