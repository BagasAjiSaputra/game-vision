-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Table for Teachers (Akun Guru)
create table if not exists public.teachers (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  email text not null unique,
  password_hash text not null,
  school_name text null default 'SLB TUNAS KASIH SURABAYA'::text,
  created_at timestamp with time zone null default now(),
  constraint teachers_pkey primary key (id)
) TABLESPACE pg_default;

create index if not exists idx_teachers_email on public.teachers using btree (email) TABLESPACE pg_default;

-- Table for Game Scores (Skor Game Murid)
create table if not exists public.game_scores (
  id uuid not null default extensions.uuid_generate_v4 (),
  teacher_id uuid null references public.teachers(id) on delete set null,
  player_name text not null,
  game_type text not null,
  score integer not null,
  created_at timestamp with time zone null default now(),
  school text null default 'SLB TUNAS KASIH SURABAYA'::text,
  age integer null,
  screenshot_url text null,
  duration character varying null,
  constraint game_scores_pkey primary key (id)
) TABLESPACE pg_default;



-- Tambahkan kolom teacher_id jika tabel game_scores sudah ada sebelumnya
alter table public.game_scores add column if not exists teacher_id uuid null references public.teachers(id) on delete set null;

-- Tambahkan kolom screenshot_url jika tabel game_scores sudah ada sebelumnya
alter table public.game_scores add column if not exists screenshot_url text null;

-- Tambahkan kolom duration jika tabel game_scores sudah ada sebelumnya (dalam detik)
alter table public.game_scores add column if not exists duration integer null;

create index IF not exists idx_game_scores_game_type on public.game_scores using btree (game_type) TABLESPACE pg_default;
create index IF not exists idx_game_scores_score_desc on public.game_scores using btree (score desc) TABLESPACE pg_default;
create index IF not exists idx_game_scores_teacher_id on public.game_scores using btree (teacher_id) TABLESPACE pg_default;

-- ============================================
-- Supabase Storage: Bucket untuk Screenshot Game
-- ============================================
-- Buat bucket "gamemotion" (public agar bisa diakses via URL)
-- CATATAN: Jalankan ini di Supabase Dashboard > SQL Editor
-- karena storage.buckets memerlukan akses dari service_role
insert into storage.buckets (id, name, public)
values ('gamemotion', 'gamemotion', true)
on conflict (id) do nothing;

-- Policy: Siapapun bisa upload (karena game ini dipakai tanpa auth user)
create policy "Allow public uploads to gamemotion"
on storage.objects for insert
to public
with check (bucket_id = 'gamemotion');

-- Policy: Siapapun bisa membaca file screenshot
create policy "Allow public read gamemotion"
on storage.objects for select
to public
using (bucket_id = 'gamemotion');