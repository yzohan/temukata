-- =========================================================================
-- TEMUKATA DYNAMIC LEADERBOARD SYSTEM (PRODUCTION READY)
-- Arsitektur Database: Point Transactions, Otomatisasi Ranking & Snapshots
-- Jalankan skrip ini langsung di Supabase SQL Editor
-- =========================================================================

-- 0. TAMBAHKAN KOLOM-KOLOM YANG MUNGKIN BELUM ADA DI TABEL PROFILES
alter table public.profiles 
  add column if not exists diamonds integer not null default 0,
  add column if not exists streak_count integer not null default 0,
  add column if not exists equipped_border text not null default 'ice-dream',
  add column if not exists last_active_date date default current_date;

-- 1. TRIGGER AUTO-CREATE PROFILE SAAT REGISTER (Memastikan Profil Selalu Ada)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.profiles (id, display_name, role, diamonds, streak_count, equipped_border)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'student',
    0,
    0,
    'ice-dream'
  )
  on conflict (id) do update set
    display_name = coalesce(nullif(excluded.display_name, ''), public.profiles.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SINKRONKAN SEMUA USER YANG PERNAH REGISTER TAPI PROFILNYA BELUM ADA
insert into public.profiles (id, display_name, role, diamonds, streak_count, equipped_border)
select 
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  'student',
  0,
  0,
  'ice-dream'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 2. TABEL POINT_TRANSACTIONS (Sumber Tunggal Poin Murid)
create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null check (points > 0),
  reason text not null,
  source_type text not null default 'lesson_completion', -- e.g. 'lesson_completion'
  source_id text not null,                                -- e.g. lesson_id (idempotency key)
  created_at timestamptz not null default now(),
  unique (user_id, source_type, source_id)               -- Mencegah reward ganda / refresh ganda!
);

create index if not exists pt_user_created_idx
  on public.point_transactions(user_id, created_at desc);

create index if not exists pt_created_idx
  on public.point_transactions(created_at desc);

-- 2. TABEL LEADERBOARD_SNAPSHOTS (Pencatat Histori Perubahan Posisi)
create table if not exists public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_type text not null check (period_type in ('weekly', 'monthly', 'all_time')),
  period_start timestamptz not null,
  rank integer not null check (rank > 0),
  points integer not null default 0,
  snapshot_at timestamptz not null default now(),
  unique (user_id, period_type, period_start)
);

create index if not exists ls_user_period_idx
  on public.leaderboard_snapshots(user_id, period_type, period_start desc);

-- 3. PERBAIKAN RLS PADA PROFILES & POINT_TRANSACTIONS
alter table public.point_transactions enable row level security;
alter table public.leaderboard_snapshots enable row level security;

-- Izin membaca point_transactions
drop policy if exists "users read own point transactions" on public.point_transactions;
create policy "users read own point transactions"
  on public.point_transactions for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- Izin membaca profil sesama murid untuk leaderboard
drop policy if exists "students view classmate profiles" on public.profiles;
create policy "students view classmate profiles"
  on public.profiles for select to authenticated
  using (role = 'student' or id = auth.uid());

-- Izin murid membuat / memperbarui profil miliknya sendiri
drop policy if exists "profile insert own" on public.profiles;
create policy "profile insert own"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profile update own" on public.profiles;
create policy "profile update own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Izin membaca snapshot
drop policy if exists "authenticated read snapshots" on public.leaderboard_snapshots;
create policy "authenticated read snapshots"
  on public.leaderboard_snapshots for select to authenticated
  using (true);

-- 4. FUNCTION: AWARD_LESSON_POINTS (Pemberian Poin Idempoten di Backend/Database)
create or replace function public.award_lesson_points(
  p_user_id uuid,
  p_lesson_id uuid,
  p_score integer
)
returns table (
  awarded boolean,
  points_earned integer,
  new_diamonds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lesson_title text;
  v_points integer;
  v_inserted_id uuid;
begin
  -- 1. Ambil judul bacaan
  select title into v_lesson_title
  from public.lessons
  where id = p_lesson_id and published = true;

  if v_lesson_title is null then
    v_lesson_title := 'Materi Literasi';
  end if;

  -- 2. Hitung poin: 50 poin penyelesaian materi + 20 poin per soal benar (maksimal 150 poin)
  v_points := 50 + (greatest(0, least(5, p_score)) * 20);

  -- 3. Simpan transaksi (idempoten: jika user sudah pernah dapat poin di materi ini, on conflict do nothing)
  insert into public.point_transactions (user_id, points, reason, source_type, source_id)
  values (p_user_id, v_points, 'Menyelesaikan bacaan: ' || v_lesson_title, 'lesson_completion', p_lesson_id::text)
  on conflict (user_id, source_type, source_id) do nothing
  returning id into v_inserted_id;

  -- 4. Tambahkan diamonds jika transaksi berhasil
  if v_inserted_id is not null then
    update public.profiles
    set
      diamonds = coalesce(diamonds, 0) + (p_score * 2),
      last_active_date = current_date
    where id = p_user_id;

    return query
    select true, v_points, coalesce((select diamonds from public.profiles where id = p_user_id), 0);
  else
    return query
    select false, 0, coalesce((select diamonds from public.profiles where id = p_user_id), 0);
  end if;
end;
$$;

grant execute on function public.award_lesson_points(uuid, uuid, integer) to authenticated, service_role;

-- 5. FUNCTION UTAMA: GET_DYNAMIC_LEADERBOARD
-- Menghitung otomatis: Poin aktual dari point_transactions, ranking via DENSE_RANK(),
-- dan perubahan posisi (Naik/Turun) dari leaderboard_snapshots.
create or replace function public.get_dynamic_leaderboard(
  p_period text default 'weekly',
  p_limit integer default 100
)
returns table (
  user_id uuid,
  display_name text,
  equipped_border text,
  points bigint,
  rank bigint,
  rank_change integer,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_start timestamptz;
  v_prev_period_start timestamptz;
begin
  -- Hitung rentang waktu berdasarkan Timezone Asia/Jakarta (WIB)
  if p_period = 'weekly' then
    -- Senin 00:00 WIB minggu berjalan
    v_period_start := (date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta');
    v_prev_period_start := v_period_start - interval '7 days';
  elsif p_period = 'monthly' then
    -- Tanggal 1 00:00 WIB bulan berjalan
    v_period_start := (date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta');
    v_prev_period_start := (date_trunc('month', (v_period_start - interval '1 day') at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta');
  else
    -- All-time
    v_period_start := '1970-01-01 00:00:00+07'::timestamptz;
    v_prev_period_start := null;
  end if;

  return query
  with user_points as (
    -- Ambil seluruh murid yang terdaftar dan agregasikan poin riilnya
    select
      p.id as u_id,
      coalesce(nullif(p.display_name, ''), 'Siswa') as u_name,
      coalesce(p.equipped_border, 'ice-dream') as u_border,
      coalesce(sum(pt.points), 0)::bigint as u_total_points
    from public.profiles p
    left join public.point_transactions pt
      on pt.user_id = p.id
      and (p_period = 'all_time' or pt.created_at >= v_period_start)
    where p.role = 'student'
    group by p.id, p.display_name, p.equipped_border
  ),
  ranked_active as (
    -- Hanya siswa dengan poin > 0 yang masuk ke ranking kompetitif
    select
      up.u_id,
      up.u_name,
      up.u_border,
      up.u_total_points,
      dense_rank() over (order by up.u_total_points desc, up.u_name asc) as current_rank,
      'active'::text as u_status
    from user_points up
    where up.u_total_points > 0
  ),
  unstarted as (
    -- Siswa dengan 0 poin berstatus 'not_started' (Belum Memulai)
    select
      up.u_id,
      up.u_name,
      up.u_border,
      0::bigint as u_total_points,
      0::bigint as current_rank,
      'not_started'::text as u_status
    from user_points up
    where up.u_total_points = 0
  ),
  all_users as (
    select * from ranked_active
    union all
    select * from unstarted
  )
  select
    au.u_id as user_id,
    au.u_name as display_name,
    au.u_border as equipped_border,
    au.u_total_points as points,
    au.current_rank as rank,
    case
      -- Jika ada snapshot periode sebelumnya, hitung perubahan posisi
      when au.u_status = 'active' and prev.rank is not null then
        (prev.rank - au.current_rank)::integer
      else 0
    end as rank_change,
    au.u_status as status
  from all_users au
  left join public.leaderboard_snapshots prev
    on prev.user_id = au.u_id
    and prev.period_type = p_period
    and prev.period_start = v_prev_period_start
  order by
    case when au.u_status = 'active' then 0 else 1 end,
    au.current_rank asc,
    au.u_name asc
  limit p_limit;
end;
$$;

grant execute on function public.get_dynamic_leaderboard(text, integer) to authenticated, anon;

-- 6. FUNCTION: TAKE_LEADERBOARD_SNAPSHOT
-- Digunakan untuk membekukan ranking saat pergantian minggu / bulan
create or replace function public.take_leaderboard_snapshot(p_period text default 'weekly')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_start timestamptz;
  v_count integer := 0;
begin
  if p_period = 'weekly' then
    v_period_start := (date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta');
  elsif p_period = 'monthly' then
    v_period_start := (date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta');
  else
    v_period_start := '1970-01-01 00:00:00+07'::timestamptz;
  end if;

  insert into public.leaderboard_snapshots (user_id, period_type, period_start, rank, points, snapshot_at)
  select
    l.user_id,
    p_period,
    v_period_start,
    l.rank::integer,
    l.points::integer,
    now()
  from public.get_dynamic_leaderboard(p_period, 500) l
  where l.status = 'active'
  on conflict (user_id, period_type, period_start)
  do update set
    rank = excluded.rank,
    points = excluded.points,
    snapshot_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.take_leaderboard_snapshot(text) to authenticated, service_role;
