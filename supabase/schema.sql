create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('student', 'teacher');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 3 and 160),
  subject text not null,
  body text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  prompt text not null,
  answer_spans jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (lesson_id, position)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  lesson_id uuid not null references public.lessons(id),
  score smallint not null check (score between 0 and 5),
  total smallint not null default 5 check (total = 5),
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists lessons_published_idx on public.lessons(published);
create index if not exists lessons_owner_idx on public.lessons(created_by, created_at desc);
create index if not exists questions_lesson_idx on public.questions(lesson_id, position);
create index if not exists attempts_student_idx on public.attempts(student_id, submitted_at desc);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Student-facing view intentionally excludes answer_spans.
create or replace view public.student_questions as
  select q.id, q.lesson_id, q.position, q.prompt, q.created_at
  from public.questions q
  join public.lessons l on l.id = q.lesson_id
  where l.published = true;

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;

-- Profiles: users may read their own role/profile. Browser users may update only display_name.
drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profile update own display name" on public.profiles;
create policy "profile update own display name" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Lesson access controls apply to browser-client reads. The API uses a server-only service key and applies role/owner checks itself.
drop policy if exists "read published or owned lessons" on public.lessons;
create policy "read published or owned lessons" on public.lessons for select to authenticated
  using (published = true or created_by = auth.uid());
drop policy if exists "teachers create lessons" on public.lessons;
create policy "teachers create lessons" on public.lessons for insert to authenticated
  with check (created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));
drop policy if exists "teachers update own lessons" on public.lessons;
create policy "teachers update own lessons" on public.lessons for update to authenticated
  using (created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (created_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

-- Answer keys are not directly selectable by client roles; use the student-facing view for prompts.
revoke all on public.questions from anon, authenticated;
grant select on public.student_questions to authenticated;

-- Attempts are written by the server API. Students can read only their own records; teachers read through the API after ownership checks.
drop policy if exists "students read own attempts" on public.attempts;
create policy "students read own attempts" on public.attempts for select to authenticated using (student_id = auth.uid());
revoke insert, update, delete on public.attempts from anon, authenticated;

-- Important setup: manually assign the teacher role only to trusted users after signup, from SQL Editor:
-- update public.profiles set role = 'teacher'
-- where id = (select id from auth.users where email = 'teacher@example.com');
-- Never let the registration form or browser client set role='teacher'. Keep service-role keys server-side only.
