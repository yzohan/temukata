import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Lock,
  Search,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import Mascot from '../components/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { sound } from '../lib/sounds';
import type { Lesson } from '../types';

export default function StudentDashboard() {
  const { session, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'map'; // 'map' | 'library' | 'leaderboard'

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    api<Lesson[]>('/lessons', session.access_token)
      .then(setLessons)
      .catch(e => setError(e instanceof Error ? e.message : 'Materi gagal dimuat.'))
      .finally(() => setLoading(false));
  }, [session]);

  const subjects = ['Semua', ...Array.from(new Set(lessons.map(l => l.subject)))];

  const filteredLessons = lessons.filter(l => {
    const matchesSubject = subjectFilter === 'Semua' || l.subject === subjectFilter;
    const matchesSearch = (l.title + ' ' + l.subject + ' ' + l.body).toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <AppShell mode="student">
      {/* Top Banner Greeting - Soft Pastel Blue & Cream (Pinterest Aesthetic) */}
      <div className="card-duo p-6 sm:p-8 bg-gradient-to-r from-[#92b4d2] via-[#85a9cb] to-[#789ec3] text-white border-[#6c93b7] relative overflow-hidden mb-6 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black text-white mb-3">
              <Sparkles size={15} className="text-yellow-200" />
              <span>LABORATORIUM MEMBACA INTERAKTIF</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Halo, {profile?.display_name || 'Pembaca Cerdas'}! 🌸
            </h1>
            <p className="mt-2.5 text-xs sm:text-sm md:text-base font-semibold text-white/95 leading-relaxed">
              Jelajahi bacaan menarik, temukan kalimat bukti dengan stabilo, dan jaga streak harianmu!
            </p>
          </div>

          {/* Gembul Chubby Mascot with Prominent Speech Bubble */}
          <div className="shrink-0 flex items-center justify-center pt-2 md:pt-0">
            <Mascot
              mood="happy"
              message={
                <span className="text-xs sm:text-sm font-black text-[#2c3848]">
                  Yuk baca 1 materi hari ini! 🐧
                </span>
              }
              size={108}
              className="drop-shadow-sm"
            />
          </div>
        </div>

        {/* Ambient aesthetic circular accents */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-2 right-1/3 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* Back button when viewing library or leaderboard */}
      {activeTab !== 'map' && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setSearchParams({});
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border-2 border-[#e7e2d8] text-xs font-black text-[#2c3848] hover:border-[#92b4d2] hover:text-[#92b4d2] shadow-xs transition-all active:scale-95"
          >
            ← Kembali ke Peta Petualangan
          </button>
        </div>
      )}

      {/* TAB 1: PETA PETUALANGAN (ROADMAP) */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          <div className="card-duo p-6 sm:p-8 bg-white relative">
            <div className="text-center max-w-md mx-auto mb-8">
              <span className="px-3 py-1 rounded-full bg-[#edf5fc] text-[#4a6b8c] text-xs font-black uppercase tracking-wider">
                Modul Literasi Bahasa Indonesia 📚
              </span>
              <h2 className="mt-2 text-xl sm:text-2xl font-black text-[#2c3848]">
                Pilih Titik Bacaanmu! 🗺️
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-bold text-slate-400">
                Pilih modul membaca dan temukan kalimat bukti dalam teks bacaan.
              </p>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#e7e2d8] border-t-[#92b4d2] animate-spin mb-3" />
                <p className="text-sm font-black text-slate-400">Menyiapkan peta petualangan...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-sm font-bold text-center">
                {error}
              </div>
            ) : (
              /* Winding Roadmap with Connected Pastel Nodes */
              <div className="relative py-6 max-w-sm mx-auto flex flex-col items-center">
                {lessons.map((lesson, idx) => {
                  const getOffsetPx = (i: number) => {
                    const mod = i % 3;
                    if (mod === 0) return 0;
                    if (mod === 1) return -48;
                    return 48;
                  };

                  const off = getOffsetPx(idx);
                  const colors = [
                    { bg: 'bg-[#92b4d2]', border: 'border-[#7396b5]', badge: 'text-[#4a6b8c]' },
                    { bg: 'bg-[#8bcfa4]', border: 'border-[#6eb388]', badge: 'text-[#215934]' },
                    { bg: 'bg-[#f5a65b]', border: 'border-[#db8a3d]', badge: 'text-amber-700' },
                    { bg: 'bg-[#a394d6]', border: 'border-[#8172b8]', badge: 'text-purple-700' },
                    { bg: 'bg-[#e58ba0]', border: 'border-[#c96e83]', badge: 'text-rose-700' },
                    { bg: 'bg-[#4db6ac]', border: 'border-[#37968b]', badge: 'text-teal-700' },
                  ];
                  const c = colors[idx % colors.length];

                  return (
                    <div key={lesson.id} className="w-full flex flex-col items-center">
                      {/* Node Element with Calculated Horizontal Translation */}
                      <div
                        className="relative flex flex-col items-center group z-10 transition-transform duration-300"
                        style={{ transform: `translateX(${off}px)` }}
                      >
                        {/* Friendly Pobi Companion floating nicely to the right of Level 1 */}
                        {idx === 0 && (
                          <div className="absolute top-0 -right-28 sm:-right-36 z-20 pointer-events-none hidden sm:block animate-float">
                            <Mascot mood="cheering" message="Mulai dari sini ya!" size={80} />
                          </div>
                        )}

                        {/* Stepping Stone Node Button */}
                        <Link
                          to={`/student/lessons/${lesson.id}`}
                          onClick={() => sound.playPop()}
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl ${c.bg} border-b-[6px] ${c.border} flex flex-col items-center justify-center text-white shadow-md transition-all transform hover:scale-110 active:translate-y-2 active:border-b-2`}
                        >
                          <BookOpen size={28} className="drop-shadow-sm" />
                          <span className="text-[11px] font-black uppercase mt-1 tracking-wider">
                            Materi {idx + 1}
                          </span>
                        </Link>

                        {/* Lesson Title Pill */}
                        <div className="mt-2.5 px-3 py-1.5 rounded-2xl bg-white border-2 border-[#e7e2d8] shadow-xs max-w-[170px] text-center">
                          <span className={`text-[10px] font-black ${c.badge} uppercase tracking-wider block`}>
                            {lesson.subject}
                          </span>
                          <span className="text-xs font-black text-[#2c3848] line-clamp-1">
                            {lesson.title}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-1 mt-1 text-amber-400">
                          <Star size={14} className="fill-amber-400" />
                          <Star size={14} className="fill-amber-400" />
                          <Star size={14} className="fill-amber-400" />
                        </div>
                      </div>

                      {/* Smooth Connecting Road Curve to Next Node */}
                      {idx < lessons.length - 1 && (() => {
                        const nextOff = getOffsetPx(idx + 1);
                        const startX = 100 + off;
                        const endX = 100 + nextOff;
                        return (
                          <div className="w-[200px] h-20 my-2 pointer-events-none relative z-0 flex items-center justify-center">
                            <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
                              <path
                                d={`M ${startX} 4 C ${startX} 40, ${endX} 40, ${endX} 76`}
                                stroke="#d5cec2"
                                strokeWidth="4"
                                strokeDasharray="6 6"
                                strokeLinecap="round"
                                fill="none"
                              />
                            </svg>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}

                {/* Road Connector to Locked Mystery Level */}
                {lessons.length > 0 && (() => {
                  const lastOff = (lessons.length - 1) % 3 === 0 ? 0 : (lessons.length - 1) % 3 === 1 ? -48 : 48;
                  const startX = 100 + lastOff;
                  const endX = 100;
                  return (
                    <div className="w-[200px] h-20 my-2 pointer-events-none relative z-0 flex items-center justify-center">
                      <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
                        <path
                          d={`M ${startX} 4 C ${startX} 40, ${endX} 40, ${endX} 76`}
                          stroke="#d5cec2"
                          strokeWidth="4"
                          strokeDasharray="6 6"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                    </div>
                  );
                })()}

                {/* Locked Mystery Level */}
                <div className="flex flex-col items-center mt-2 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#e7e2d8] border-b-4 border-[#d5cec2] flex items-center justify-center text-slate-400">
                    <Lock size={22} />
                  </div>
                  <span className="mt-2 text-xs font-black text-slate-400">
                    Tantangan Bonus (Tuntaskan 6 Materi)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SEMUA BACAAN (LIBRARY VIEW) */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          <div className="card-duo p-4 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari topik bacaan..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-[#e7e2d8] focus:border-[#92b4d2] font-bold text-xs sm:text-sm outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {subjects.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    sound.playPop();
                    setSubjectFilter(s);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all whitespace-nowrap ${
                    subjectFilter === s
                      ? 'bg-[#92b4d2] text-white shadow-sm'
                      : 'bg-[#f6f3ed] text-slate-600 hover:bg-[#eae5dd]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold">Memuat daftar bacaan...</div>
          ) : filteredLessons.length === 0 ? (
            <div className="card-duo p-8 text-center bg-white">
              <p className="text-sm font-bold text-slate-500">Tidak ada materi yang cocok.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filteredLessons.map((lesson, i) => {
                const colors = [
                  { accent: 'border-l-[#92b4d2]', tag: 'bg-[#edf5fc] text-[#4a6b8c]' },
                  { accent: 'border-l-[#8bcfa4]', tag: 'bg-[#e5f5eb] text-[#215934]' },
                  { accent: 'border-l-[#f5a65b]', tag: 'bg-amber-50 text-amber-700' },
                  { accent: 'border-l-[#a394d6]', tag: 'bg-purple-50 text-purple-700' },
                ];
                const theme = colors[i % colors.length];

                return (
                  <div
                    key={lesson.id}
                    className={`card-duo card-duo-hover p-5 bg-white border-l-[6px] ${theme.accent} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${theme.tag}`}>
                          {lesson.subject}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <CheckCircle size={14} className="text-[#8bcfa4]" />
                          5 Soal Stabilo
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-[#2c3848] leading-snug">
                        {lesson.title}
                      </h3>

                      <p className="mt-2 text-xs font-semibold text-slate-500 line-clamp-3 leading-relaxed">
                        {lesson.body}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t-2 border-[#f1ede5] flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">
                        ⏱️ ~4 menit membaca
                      </span>
                      <Link
                        to={`/student/lessons/${lesson.id}`}
                        onClick={() => sound.playPop()}
                        className="btn-3d-pastel px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5"
                      >
                        <span>Mulai Baca</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAPAN JUARA */}
      {activeTab === 'leaderboard' && (
        <div className="card-duo p-6 bg-white max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border-b-4 border-amber-200 flex items-center justify-center text-amber-600 mb-2">
              <Trophy size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#2c3848]">Papan Juara Literasi 🏆</h2>
            <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">
              Raih poin pemahaman dan jaga streak membaca untuk memuncaki klasemen!
            </p>
          </div>

          <div className="space-y-3">
            {[
              { rank: 1, name: 'Ayam Betutu (Kamu)', xp: '1,250 XP', avatar: '🥇', you: true },
              { rank: 2, name: 'Budi Santoso', xp: '1,120 XP', avatar: '🥈' },
              { rank: 3, name: 'Siti Rahma', xp: '980 XP', avatar: '🥉' },
              { rank: 4, name: 'Dimas Anggara', xp: '850 XP', avatar: '⭐' },
              { rank: 5, name: 'Nadia Putri', xp: '740 XP', avatar: '⭐' },
            ].map(item => (
              <div
                key={item.rank}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-between ${
                  item.you
                    ? 'border-[#92b4d2] bg-[#edf5fc] shadow-sm'
                    : 'border-[#e7e2d8] bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.avatar}</span>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-[#2c3848]">
                      {item.name}
                    </span>
                    {item.you && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-[#92b4d2] text-white text-[9px] font-black">
                        Kamu
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs sm:text-sm font-black text-slate-600 bg-[#f6f3ed] px-3 py-1 rounded-xl">
                  {item.xp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
