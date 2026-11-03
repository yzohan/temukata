-- =========================================================================
-- TEMUKATA LEADERBOARD SYSTEM MIGRATION & REAL SEED DATA
-- Jalankan skrip ini langsung di Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. TAMBAH KOLOM PADA TABEL PROFILES UNTUK MENDUKUNG LEADERBOARD
alter table public.profiles
  add column if not exists equipped_border text not null default 'ice-dream',
  add column if not exists weekly_points integer not null default 0,
  add column if not exists monthly_points integer not null default 0,
  add column if not exists total_points integer not null default 0,
  add column if not exists previous_rank integer default null;

-- 2. PERBARUI ROW LEVEL SECURITY (RLS)
-- Supaya semua murid yang login dapat membaca data peringkat sesama murid
drop policy if exists "profile read own" on public.profiles;
drop policy if exists "students can view peer profiles for leaderboard" on public.profiles;

create policy "students can view peer profiles for leaderboard"
  on public.profiles
  for select
  to authenticated
  using (role = 'student' or id = auth.uid());

create policy "profile update own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid());

-- 3. FUNCTION & RPC: GET_LEADERBOARD
-- Fungsi ini otomatis menghitung peringkat (Rank), Poin per periode (Mingguan/Bulanan),
-- serta perubahan posisi (Rank Change: Naik (+), Turun (-), atau Tetap (0))
create or replace function public.get_leaderboard(p_period text default 'weekly')
returns table (
  user_id uuid,
  display_name text,
  equipped_border text,
  points integer,
  rank bigint,
  previous_rank integer,
  rank_change integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with scored as (
    select
      p.id as u_id,
      p.display_name as u_name,
      coalesce(p.equipped_border, 'ice-dream') as u_border,
      case
        when p_period = 'monthly' then
          greatest(coalesce(p.monthly_points, 0), coalesce(p.total_points, 0), coalesce(p.diamonds, 0) * 3)
        else
          greatest(coalesce(p.weekly_points, 0), coalesce(p.diamonds, 0))
      end as u_points,
      p.previous_rank as u_prev_rank
    from public.profiles p
    where p.role = 'student'
  ),
  ranked as (
    select
      s.u_id,
      s.u_name,
      s.u_border,
      s.u_points,
      dense_rank() over (order by s.u_points desc, s.u_name asc) as calc_rank,
      s.u_prev_rank
    from scored s
  )
  select
    r.u_id as user_id,
    r.u_name as display_name,
    r.u_border as equipped_border,
    r.u_points::integer as points,
    r.calc_rank as rank,
    r.u_prev_rank as previous_rank,
    case
      when r.u_prev_rank is not null then (r.u_prev_rank - r.calc_rank)::integer
      else 0
    end as rank_change
  from ranked r
  order by r.calc_rank asc;
end;
$$;

-- Berikan izin akses fungsi ke authenticated dan anon
grant execute on function public.get_leaderboard(text) to authenticated, anon;

-- 4. VIEW LEADERBOARD UNTUK QUERY LANGSUNG DARI SUPABASE CLIENT
create or replace view public.leaderboard_view as
  select * from public.get_leaderboard('weekly');

grant select on public.leaderboard_view to authenticated, anon;

-- 5. TRIGGER OTOMATIS: UPDATE POIN & RANK SETIAP SELESAI MENGERJAKAN BACAAN
-- Setiap kali murid menyelesaikan 1 bacaan (tabel attempts), poin otomatis bertambah ke profil!
create or replace function public.on_attempt_add_points()
returns trigger language plpgsql security definer as $$
declare
  earned_points integer;
begin
  -- Poin dihitung: skor (0-5) * 30 poin + bonus partisipasi 50 poin
  earned_points := (new.score * 30) + 50;

  update public.profiles
  set
    diamonds = diamonds + new.score * 2,
    weekly_points = weekly_points + earned_points,
    monthly_points = monthly_points + earned_points,
    total_points = total_points + earned_points,
    last_active_date = current_date
  where id = new.student_id;

  return new;
end;
$$;

drop trigger if exists tr_attempt_add_points on public.attempts;
create trigger tr_attempt_add_points
after insert on public.attempts
for each row execute procedure public.on_attempt_add_points();

-- 6. SEED DATA SISWA RIIL KELAS TEMUKATA (DATA NYATA DI DATABASE)
-- Memasukkan siswa kelas contoh dengan profil lengkap agar papan peringkat terisi riil di Supabase
do $$
declare
  v_uid uuid;
begin
  -- Aurelia (Juara 1)
  v_uid := 'a0000000-0000-0000-0000-000000000001';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'Aurelia', 'student', 45, 1520, 4800, 4800, 1, 'flower-garden')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;

  -- Raka (Juara 2)
  v_uid := 'a0000000-0000-0000-0000-000000000002';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'Raka', 'student', 40, 1340, 4200, 4200, 3, 'ice-dream')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;

  -- Nadine (Juara 3)
  v_uid := 'a0000000-0000-0000-0000-000000000003';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'Nadine', 'student', 35, 1270, 3950, 3950, 2, 'cherry-blossom')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;

  -- Jennifer (Peringkat 4)
  v_uid := 'a0000000-0000-0000-0000-000000000004';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'Jennifer', 'student', 30, 1020, 3200, 3200, 7, 'midnight-blue')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;

  -- William (Peringkat 5)
  v_uid := 'a0000000-0000-0000-0000-000000000005';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'William', 'student', 30, 1000, 3100, 3100, 6, 'golden-star')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;

  -- Emory (Peringkat 7)
  v_uid := 'a0000000-0000-0000-0000-000000000006';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'Emory', 'student', 25, 920, 2900, 2900, 6, 'aurora-night')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;

  -- Lydia (Peringkat 8)
  v_uid := 'a0000000-0000-0000-0000-000000000007';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'Lydia', 'student', 25, 900, 2800, 2800, 8, 'ocean-pulse')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;

  -- Arvin (Peringkat 9)
  v_uid := 'a0000000-0000-0000-0000-000000000008';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'Arvin', 'student', 20, 880, 2700, 2700, 11, 'moonlight')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;

  -- Bianca (Peringkat 10)
  v_uid := 'a0000000-0000-0000-0000-000000000009';
  insert into public.profiles (id, display_name, role, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border)
  values (v_uid, 'Bianca', 'student', 20, 860, 2600, 2600, 9, 'flower-garden')
  on conflict (id) do update set
    display_name = excluded.display_name,
    weekly_points = excluded.weekly_points,
    monthly_points = excluded.monthly_points,
    equipped_border = excluded.equipped_border,
    previous_rank = excluded.previous_rank;
end $$;
