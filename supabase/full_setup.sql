-- =========================================================================
-- TEMUKATA COMPLETE DATABASE SCHEMA & SEED DATA
-- KHUSUS MODUL LITERASI MEMBACA BAHASA INDONESIA
-- Jalankan skrip ini langsung di Supabase SQL Editor
-- =========================================================================

-- 1. EXTENSIONS & ROLES
create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('student', 'teacher');
exception when duplicate_object then null;
end $$;

-- 2. TABEL PROFILES (Pembeda Murid vs Guru/Admin + Sistem Streak & Diamond)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'student',
  diamonds integer not null default 25,
  streak_count integer not null default 1,
  last_active_date date default current_date,
  created_at timestamptz not null default now()
);

-- 3. TABEL LESSONS (Materi Bacaan Bahasa Indonesia)
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 3 and 160),
  subject text not null default 'Bahasa Indonesia',
  body text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. TABEL QUESTIONS (Soal Pemahaman dan Bukti Bacaan)
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  prompt text not null,
  answer_spans jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (lesson_id, position)
);

-- 5. TABEL ATTEMPTS (Riwayat Jawaban & Skor Murid)
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  score smallint not null check (score between 0 and 5),
  total smallint not null default 5 check (total = 5),
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);

-- 6. INDEXES
create index if not exists lessons_published_idx on public.lessons(published);
create index if not exists questions_lesson_idx on public.questions(lesson_id, position);
create index if not exists attempts_student_idx on public.attempts(student_id, submitted_at desc);

-- 7. OTOMATIS MEMBUAT PROFIL SAAT USER BARU LOGIN GOOGLE / DAFTAR
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    'student' -- Akun otomatis menjadi murid (student)
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 8. VIEW KHUSUS MURID (Menyembunyikan kunci jawaban dari murid)
create or replace view public.student_questions as
  select q.id, q.lesson_id, q.position, q.prompt, q.created_at
  from public.questions q
  join public.lessons l on l.id = q.lesson_id
  where l.published = true;

-- 9. ROW LEVEL SECURITY (RLS) & HAK AKSES
alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;

-- Policies Profiles
drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated using (id = auth.uid());

-- Policies Lessons
drop policy if exists "read published lessons" on public.lessons;
create policy "read published lessons" on public.lessons for select to authenticated using (published = true or created_by = auth.uid());
drop policy if exists "teachers manage lessons" on public.lessons;
create policy "teachers manage lessons" on public.lessons for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

-- Policies Questions
drop policy if exists "teachers manage questions" on public.questions;
create policy "teachers manage questions" on public.questions for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'));

grant select on public.student_questions to authenticated;

-- Policies Attempts
drop policy if exists "students read write own attempts" on public.attempts;
create policy "students read write own attempts" on public.attempts for all to authenticated
  using (student_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher'))
  with check (student_id = auth.uid());

-- Bersihkan data lama jika pernah ada
truncate table public.questions cascade;
truncate table public.lessons cascade;

-- =========================================================================
-- SEED DATA: 6 MODUL RESMI LITERASI BAHASA INDONESIA & 30 SOAL
-- =========================================================================

-- Modul 1: Gagasan Pokok
with l as (
  insert into public.lessons (title, subject, body, published)
  values (
    'Gagasan Pokok: Menjaga Kelestarian Ekosistem Sungai',
    'Bahasa Indonesia',
    'Kebersihan sungai memegang peranan krusial bagi keberlangsungan ekosistem dan kesehatan masyarakat di sekitarnya. Gagasan utama dari pengelolaan sungai yang berkelanjutan adalah mencegah masuknya limbah industri dan sampah rumah tangga langsung ke aliran air. Ketika masyarakat membuang sampah plastik sembarangan, aliran sungai akan tersumbat sehingga memicu bencana banjir bandang saat musim hujan tiba. Selain menyebabkan banjir, air sungai yang tercemar bahan kimia berbahaya akan mematikan ikan dan merusak rantai makanan alami. Oleh karena itu, gerakan gotong royong membersihkan bantaran sungai setiap akhir pekan menjadi langkah nyata yang sangat efektif. Kesadaran kolektif warga untuk tidak mengotori sungai merupakan kunci utama terciptanya lingkungan hidup yang lestari dan asri bagi generasi penerus bangsa.',
    true
  ) returning id
)
insert into public.questions (lesson_id, position, prompt, answer_spans)
select l.id, p.pos, p.prompt, p.spans::jsonb
from l, (values
  (1, 'Apa gagasan utama dari pengelolaan sungai yang berkelanjutan?', '[{"start": 178, "end": 259}]'),
  (2, 'Apa dampak buruk pembuangan sampah plastik sembarangan terhadap aliran sungai?', '[{"start": 315, "end": 405}]'),
  (3, 'Mengapa air sungai yang tercemar bahan kimia berbahaya sangat merugikan lingkungan?', '[{"start": 480, "end": 533}]'),
  (4, 'Tindakan nyata apa yang sangat efektif dilakukan masyarakat untuk menjaga bantaran sungai?', '[{"start": 551, "end": 620}]'),
  (5, 'Apa kunci utama terciptanya lingkungan hidup yang lestari bagi generasi mendatang?', '[{"start": 664, "end": 717}]')
) as p(pos, prompt, spans);

-- Modul 2: Fakta dan Opini
with l as (
  insert into public.lessons (title, subject, body, published)
  values (
    'Fakta dan Opini: Pelestarian Hutan Mangrove Pesisir',
    'Bahasa Indonesia',
    'Hutan mangrove di pesisir utara Pulau Jawa memiliki fungsi ekologis sebagai benteng alami penahan abrasi ombak laut. Data dari Kementerian Lingkungan Hidup mencatat bahwa lebih dari lima puluh ribu hektare kawasan mangrove telah berhasil direhabilitasi sepanjang tahun lalu. Menurut pandangan beberapa aktivis lingkungan, penanaman kembali bibit bakau merupakan cara paling mulia dan paling sempurna untuk menyelamatkan bumi dari kehancuran iklim global. Secara ilmiah, akar tunjang pohon bakau yang rapat terbukti efektif memperlambat laju gelombang pasang dan mengendapkan lumpur di muara sungai. Sebagian wisatawan berpendapat bahwa hutan mangrove adalah tempat wisata alam yang paling menenangkan jiwa dibandingkan destinasi wisata lainnya. Namun, fakta di lapangan menunjukkan bahwa perusakan tambak liar tetap menjadi ancaman serius bagi kelangsungan ekosistem pesisir.',
    true
  ) returning id
)
insert into public.questions (lesson_id, position, prompt, answer_spans)
select l.id, p.pos, p.prompt, p.spans::jsonb
from l, (values
  (1, 'Berapa luas kawasan mangrove yang telah berhasil direhabilitasi sepanjang tahun lalu?', '[{"start": 171, "end": 274}]'),
  (2, 'Apa pandangan subjektif aktivis lingkungan terhadap kegiatan penanaman kembali bibit bakau?', '[{"start": 352, "end": 454}]'),
  (3, 'Apa fungsi ilmiah dari akar tunjang pohon bakau yang rapat di muara sungai?', '[{"start": 515, "end": 598}]'),
  (4, 'Bagaimana pendapat sebagian wisatawan tentang hutan mangrove dibanding tempat lain?', '[{"start": 651, "end": 744}]'),
  (5, 'Masalah apa di lapangan yang terbukti menjadi ancaman serius bagi ekosistem pesisir?', '[{"start": 788, "end": 875}]')
) as p(pos, prompt, spans);

-- Modul 3: Pesan Moral
with l as (
  insert into public.lessons (title, subject, body, published)
  values (
    'Pesan Moral: Kisah Semut Merah dan Burung Pipit',
    'Bahasa Indonesia',
    'Di tepi hutan yang lebat, seekor semut merah tergelincir jatuh ke dalam aliran sungai yang berarus deras saat sedang mencari makanan. Melihat semut merah yang megap-megap kepayahan, seekor burung pipit yang berhati dermawan segera memetik sehelai daun kering lalu menjatuhkannya ke dekat semut. Semut merah merayap naik ke atas daun tersebut sehingga selamat dari bahaya tenggelam menuju tepi sungai. Beberapa hari kemudian, seorang pemburu burung datang mengendap-endap dengan senapan angin yang diarahkan tepat ke dahan tempat burung pipit bertengger santai. Menyadari bahaya maut mengancam sahabatnya, semut merah tanpa ragu berlari kencang menggigit kaki pemburu sekuat tenaga hingga pemburu berteriak kesakitan dan tembakannya meleset jauh. Burung pipit pun berhasil terbang melarikan diri, membuktikan bahwa sekecil apa pun pertolongan yang tulus pasti akan menuai kebaikan yang setimpal.',
    true
  ) returning id
)
insert into public.questions (lesson_id, position, prompt, answer_spans)
select l.id, p.pos, p.prompt, p.spans::jsonb
from l, (values
  (1, 'Bagaimana burung pipit menolong semut merah yang hanyut di aliran sungai?', '[{"start": 224, "end": 294}]'),
  (2, 'Apa sifat atau watak utama yang ditunjukkan oleh burung pipit saat melihat semut kepayahan?', '[{"start": 207, "end": 223}]'),
  (3, 'Bahaya apa yang mengancam keselamatan burung pipit beberapa hari kemudian?', '[{"start": 425, "end": 560}]'),
  (4, 'Tindakan berani apa yang dilakukan semut merah untuk menyelamatkan sahabatnya?', '[{"start": 628, "end": 745}]'),
  (5, 'Apa pesan moral atau amanat utama dari kisah persahabatan tersebut?', '[{"start": 814, "end": 894}]')
) as p(pos, prompt, spans);

-- Modul 4: Sebab-Akibat
with l as (
  insert into public.lessons (title, subject, body, published)
  values (
    'Sebab-Akibat: Memahami Fenomena Terjadinya Pelangi',
    'Bahasa Indonesia',
    'Pelangi adalah fenomena optik menakjubkan yang terjadi akibat pembiasan, pemantulan, dan penguraian cahaya matahari oleh tetesan air hujan di atmosfer. Proses ini bermula ketika berkas sinar matahari yang tampak putih menembus butiran air hujan yang melayang di udara. Karena butiran air memiliki kerapatan optik yang lebih tinggi daripada udara, cahaya matahari dibelokkan atau mengalami pembiasan saat memasuki tetesan air tersebut. Pembelokan ini menyebabkan spektrum cahaya putih terurai menjadi berbagai panjang gelombang warna yang berbeda, mulai dari merah hingga ungu. Setelah mengenai dinding belakang butir air, sebagian berkas cahaya dipantulkan kembali menuju mata pengamat dengan sudut deviasi tertentu. Akibatnya, mata manusia menangkap lengkungan warna-warni yang indah di langit yang posisinya selalu membelakangi arah datangnya sinar matahari.',
    true
  ) returning id
)
insert into public.questions (lesson_id, position, prompt, answer_spans)
select l.id, p.pos, p.prompt, p.spans::jsonb
from l, (values
  (1, 'Apa penyebab utama munculnya fenomena optik pelangi di atmosfer?', '[{"start": 55, "end": 151}]'),
  (2, 'Mengapa sinar matahari mengalami pembelokan atau pembiasan saat menembus butiran hujan?', '[{"start": 269, "end": 345}]'),
  (3, 'Apa akibat dari pembelokan berkas cahaya putih di dalam tetesan air?', '[{"start": 450, "end": 576}]'),
  (4, 'Peristiwa apa yang terjadi pada berkas cahaya setelah mengenai dinding belakang butir air?', '[{"start": 622, "end": 716}]'),
  (5, 'Di mana letak posisi lengkungan pelangi jika dilihat oleh mata pengamat?', '[{"start": 800, "end": 860}]')
) as p(pos, prompt, spans);

-- Modul 5: Makna Kiasan
with l as (
  insert into public.lessons (title, subject, body, published)
  values (
    'Makna Kiasan: Cerita Keteladanan dan Perjuangan Hidup',
    'Bahasa Indonesia',
    'Pak Rahmat dikenal sebagai sosok yang berhati emas oleh seluruh warga desa karena ketulusannya mengajar anak-anak kurang mampu tanpa memungut bayaran sepeser pun. Setiap fajar menyingsing, ia sudah memeras keringat mencangkul di sawah garapannya demi menghidupi keluarganya. Meski hidupnya berada di bawah garis kemiskinan, Pak Rahmat pantang berpangku tangan dan tidak pernah mengeluhkan nasibnya yang berat. Ketika balai desa dilanda badai perpecahan pendapat antarwarga, Pak Rahmat selalu tampil dengan kepala dingin untuk meredakan pertikaian dan mencari jalan tengah yang damai. Ketulusan hatinya yang tulus bagai mutiara terpendam menjadikannya panutan sejati bagi generasi muda. Berkat keteguhan prinsipnya, anak-anak didiknya kini banyak yang berhasil menjadi bunga bangsa yang membanggakan nama tanah air di kancah nasional.',
    true
  ) returning id
)
insert into public.questions (lesson_id, position, prompt, answer_spans)
select l.id, p.pos, p.prompt, p.spans::jsonb
from l, (values
  (1, 'Apa bukti kalimat yang menunjukkan watak Pak Rahmat yang berhati emas?', '[{"start": 82, "end": 162}]'),
  (2, 'Ungkapan memeras keringat dalam cerita menggambarkan aktivitas apa yang dilakukan Pak Rahmat?', '[{"start": 215, "end": 274}]'),
  (3, 'Apa maksud kiasan bahwa Pak Rahmat pantang berpangku tangan menghadapi kesulitan hidup?', '[{"start": 364, "end": 409}]'),
  (4, 'Sikap apa yang ditunjukkan Pak Rahmat dengan ungkapan kepala dingin saat terjadi perpecahan di desa?', '[{"start": 520, "end": 583}]'),
  (5, 'Siapakah yang dimaksud dengan sebutan bunga bangsa dalam paragraf penutup cerita?', '[{"start": 715, "end": 833}]')
) as p(pos, prompt, spans);

-- Modul 6: Membaca Kritis
with l as (
  insert into public.lessons (title, subject, body, published)
  values (
    'Membaca Kritis: Memilah Fakta dan Menangkal Hoaks Digital',
    'Bahasa Indonesia',
    'Di era keterbukaan informasi digital, banjir berita hoaks atau kabar bohong menjadi tantangan besar bagi literasi generasi muda Indonesia. Banyak pembaca mudah terperangkap oleh judul berita yang sensasional atau provokatif tanpa membaca keseluruhan isi artikel secara cermat. Kunci utama untuk membentengi diri dari hoaks adalah dengan menerapkan teknik membaca kritis serta selalu memverifikasi sumber berita kepada lembaga yang kredibel. Kita juga perlu memeriksa apakah foto atau video yang disertakan merupakan peristiwa asli atau sekadar hasil suntingan manipulatif. Membagikan informasi yang belum terbukti kebenarannya tidak hanya menyesatkan orang lain, tetapi juga dapat menimbulkan kegaduhan sosial yang merugikan banyak pihak. Oleh sebab itu, saring sebelum berbagi harus menjadi pedoman wajib bagi setiap warganet yang bertanggung jawab demi mewujudkan ruang digital yang sehat dan mendidik.',
    true
  ) returning id
)
insert into public.questions (lesson_id, position, prompt, answer_spans)
select l.id, p.pos, p.prompt, p.spans::jsonb
from l, (values
  (1, 'Apa yang sering membuat pembaca mudah terperangkap kabar bohong di media digital?', '[{"start": 178, "end": 276}]'),
  (2, 'Langkah apa yang menjadi kunci utama membentengi diri dari serbuan berita hoaks?', '[{"start": 337, "end": 440}]'),
  (3, 'Pemeriksaan apa yang wajib dilakukan pembaca terhadap foto atau video pendukung berita?', '[{"start": 457, "end": 572}]'),
  (4, 'Apa bahaya yang ditimbulkan jika seseorang membagikan informasi yang belum terbukti kebenarannya?', '[{"start": 639, "end": 738}]'),
  (5, 'Semboyan atau pedoman apa yang harus dipegang teguh oleh setiap warganet yang bertanggung jawab?', '[{"start": 755, "end": 849}]')
) as p(pos, prompt, spans);
