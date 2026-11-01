import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, CirclePlus, FileQuestion, Users, Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { sound } from '../lib/sounds';
import type { Lesson } from '../types';
import type { ReactNode } from 'react';

export default function TeacherDashboard() {
  const { session, profile } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      api<Lesson[]>('/lessons', session.access_token)
        .then(setLessons)
        .catch(e => setError(e instanceof Error ? e.message : 'Gagal memuat materi.'));
    }
  }, [session]);

  return (
    <AppShell mode="teacher">
      {/* Top Banner */}
      <div className="card-duo p-6 bg-gradient-to-r from-[#92b4d2] to-[#80a4c4] text-white border-[#7396b5] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black text-white mb-2">
            <Sparkles size={14} className="text-yellow-200" />
            <span>TEACHER WORKSPACE</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Selamat Datang, {profile?.display_name || 'Bapak/Ibu Guru'} ✨
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-white/90">
            Kelola bacaan, kunci jawaban stabilo, dan pantau progres evaluasi murid secara real-time.
          </p>
        </div>

        <Link
          to="/teacher/lessons/new"
          onClick={() => sound.playPop()}
          className="btn-3d-cream px-5 py-3 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shrink-0 text-[#2c3848]"
        >
          <CirclePlus size={18} className="text-[#92b4d2]" />
          <span>Buat Materi Baru</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Total Materi Terbit" value={String(lessons.length).padStart(2, '0')} icon={<BookOpen size={24} />} color="blue" />
        <Stat label="Target Soal per Bacaan" value="05 Soal" icon={<FileQuestion size={24} />} color="green" />
        <Stat label="Pemantauan Otomatis" value="Aktif" icon={<Users size={24} />} color="amber" />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <section className="card-duo p-6 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-[#2c3848]">Daftar Bacaan & Soal</h2>
              <p className="text-xs font-bold text-slate-400">Semua materi yang siap dikerjakan oleh murid.</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-[#edf5fc] text-[#4a6b8c] text-xs font-black">
              {lessons.length} Bacaan
            </span>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold mb-4">
              {error}
            </div>
          )}

          {lessons.length === 0 && !error ? (
            <div className="p-8 text-center bg-[#faf8f4] rounded-2xl border-2 border-dashed border-[#e7e2d8]">
              <p className="text-sm font-bold text-slate-500">Belum ada materi yang dibuat.</p>
              <Link
                to="/teacher/lessons/new"
                className="btn-3d-pastel mt-4 px-4 py-2 rounded-xl text-xs font-black inline-block"
              >
                Mulai Buat Materi
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map(lesson => (
                <div
                  key={lesson.id}
                  className="p-4 rounded-2xl border-2 border-[#e7e2d8] bg-white hover:border-[#92b4d2] transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#edf5fc] text-[#4a6b8c] flex items-center justify-center shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#2c3848] truncate">{lesson.title}</h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                        {lesson.subject} · {lesson.questions?.length ?? 5} Soal · {lesson.published ? '🟢 Terbit' : 'Draft'}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/student/lessons/${lesson.id}`}
                    onClick={() => sound.playPop()}
                    className="p-2 rounded-xl text-[#92b4d2] hover:bg-[#edf5fc] transition-colors shrink-0"
                    title="Pratinjau seperti Murid"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sidebar Info */}
        <aside className="space-y-6">
          <div className="card-duo p-6 bg-[#fdfcf9] border-[#e7e2d8]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#92b4d2]">
                PANDUAN PEMBUATAN SOAL
              </span>
              <TrendingUp size={18} className="text-[#8bcfa4]" />
            </div>
            <h3 className="text-base font-black text-[#2c3848]">Bagaimana Kunci Jawaban Bekerja?</h3>
            <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
              Saat guru memasukkan frasa jawaban di editor, server secara otomatis menghitung indeks awal dan akhir teks. Murid tidak dapat membocorkan kunci jawaban dari inspect element/network request!
            </p>
          </div>

          <div className="card-duo p-5 bg-white flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#2c3848]">Tinjau Nilai Murid</h3>
              <p className="text-xs font-bold text-slate-400">Periksa detail jawaban benar/salah tiap soal.</p>
            </div>
            <Link
              to="/teacher/results"
              onClick={() => sound.playPop()}
              className="btn-3d-pastel px-4 py-2.5 rounded-xl text-xs font-black shrink-0"
            >
              Lihat Nilai
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: ReactNode; color: 'amber' | 'green' | 'blue' }) {
  const styles = {
    blue: 'bg-[#edf5fc] text-[#4a6b8c] border-[#d3e5f5]',
    green: 'bg-[#e5f5eb] text-[#215934] border-[#c0e6ce]',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <div className="card-duo p-5 bg-white flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${styles[color]}`}>
        {icon}
      </div>
      <div>
        <strong className="text-2xl font-black text-[#2c3848] block leading-tight">{value}</strong>
        <span className="text-xs font-bold text-slate-400">{label}</span>
      </div>
    </div>
  );
}
