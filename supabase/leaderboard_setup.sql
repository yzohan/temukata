-- =========================================================================
-- TEMUKATA SISTEM DATABASE LEADERBOARD (MURNI DATA USER REGISTER & LOGIN)
-- Jalankan skrip ini langsung di Supabase SQL Editor (https://supabase.com/dashboard)
-- =========================================================================

-- 1. TAMBAH KOLOM PENDUKUNG LEADERBOARD KE TABEL PROFILES
-- Kolom ini menyimpan border avatar yang dipakai murid, poin mingguan, bulanan, dan total
alter table public.profiles
  add column if not exists equipped_border text not null default 'ice-dream',
  add column if not exists weekly_points integer not null default 0,
  add column if not exists monthly_points integer not null default 0,
  add column if not exists total_points integer not null default 0,
  add column if not exists previous_rank integer default null;

-- Sinkronkan poin awal dari diamonds yang sudah dimiliki murid yang sudah register
update public.profiles
set
  weekly_points = coalesce(diamonds, 25),
  monthly_points = coalesce(diamonds, 25),
  total_points = coalesce(diamonds, 25)
where weekly_points = 0 and diamonds is not null;

-- 2. BUKA AKSES RLS (ROW LEVEL SECURITY) UNTUK LEADERBOARD
-- Supaya user-user yang register/login bisa saling melihat nama, poin, dan peringkat di leaderboard
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
-- Fungsi ini mengambil SEMUA user murid (role = 'student') yang TERDAFTAR di database,
-- lalu mengurutkan peringkat secara otomatis berdasarkan poin aktual mereka!
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
      coalesce(nullif(p.display_name, ''), 'Siswa') as u_name,
      coalesce(p.equipped_border, 'ice-dream') as u_border,
      case
        when p_period = 'monthly' then
          greatest(coalesce(p.monthly_points, 0), coalesce(p.total_points, 0), coalesce(p.diamonds, 0))
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

grant execute on function public.get_leaderboard(text) to authenticated, anon;

-- 4. VIEW LEADERBOARD UNTUK QUERY LANGSUNG
create or replace view public.leaderboard_view as
  select * from public.get_leaderboard('weekly');

grant select on public.leaderboard_view to authenticated, anon;

-- 5. TRIGGER OTOMATIS: TIAP SELESAI BACA, POIN DATABASE OTOMATIS NAIK!
-- Saat murid mengumpulkan jawaban di tabel attempts, poin di profiles otomatis bertambah!
create or replace function public.on_attempt_add_points()
returns trigger language plpgsql security definer as $$
declare
  earned_points integer;
begin
  -- Nilai: Skor (0-5) * 30 poin + bonus partisipasi 50 poin
  earned_points := (new.score * 30) + 50;

  update public.profiles
  set
    diamonds = diamonds + (new.score * 2),
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
