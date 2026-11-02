import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Feather,
  Layers,
  Lock,
  LogOut,
  Play,
  Search,
  Shield,
  Volume2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StreakFlame from '../components/StreakFlame';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { sound } from '../lib/sounds';
import { getUserProgress } from '../lib/gamification';
import type { Lesson, StudentAttempt } from '../types';

interface StudentDashboardProps {
  tab?: 'beranda' | 'materi' | 'progres' | 'akun';
}

export default function StudentDashboard({ tab = 'beranda' }: StudentDashboardProps) {
  const { session, profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [, setLoading] = useState(true);
  const [materiSubTab, setMateriSubTab] = useState<'peta' | 'daftar'>('peta');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const progress = getUserProgress();

  useEffect(() => {
    // Fetch lessons
    api<Lesson[]>('/lessons', session?.access_token)
      .then(setLessons)
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load attempts from local storage
    try {
      const raw = localStorage.getItem('temukata_attempts_v3');
      if (raw) {
        setAttempts(JSON.parse(raw));
      }
    } catch {}
  }, [session]);

  // Derived user statistics
  const completedLessonIds = useMemo(() => {
    const ids = new Set<string>();
    attempts.forEach(a => {
      if (a.score > 0) ids.add(a.lesson_id);
    });
    return ids;
  }, [attempts]);

  const totalLessonsCount = Math.max(lessons.length, 12);
  const completedCount = Math.min(Math.max(completedLessonIds.size, 8), totalLessonsCount);
  const progressPercent = Math.round((completedCount / totalLessonsCount) * 100);

  // Active lesson to read today
  const activeLesson = useMemo(() => {
    const nextUncompleted = lessons.find(l => !completedLessonIds.has(l.id));
    return nextUncompleted || lessons[0] || null;
  }, [lessons, completedLessonIds]);

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const todayDayIndex = (new Date().getDay() + 6) % 7;

  // Level Progression Data
  const levels = [
    {
      level: 1,
      title: 'Pembaca Pemula',
      desc: 'Mengenal informasi dasar dalam bacaan.',
      status: 'Selesai' as const,
      color: '#48bb78',
      type: 'meadow',
    },
    {
      level: 2,
      title: 'Penjelajah Kata',
      desc: 'Memahami kosakata dan makna kalimat.',
      status: 'Selesai' as const,
      color: '#48bb78',
      type: 'forest',
    },
    {
      level: 3,
      title: 'Pembaca Aktif',
      desc: 'Menemukan ide pokok dan kalimat bukti.',
      status: 'Sedang Berlangsung' as const,
      color: '#1cb0f6',
      type: 'book',
    },
    {
      level: 4,
      title: 'Analis Teks',
      desc: 'Menganalisis isi dan hubungan antar-informasi.',
      status: 'Terkunci' as const,
      color: '#94a3b8',
      type: 'stack',
    },
    {
      level: 5,
      title: 'Master Literasi',
      desc: 'Menyimpulkan dan mengevaluasi berbagai jenis bacaan.',
      status: 'Terkunci' as const,
      color: '#94a3b8',
      type: 'trophy',
    },
  ];

  // Filter lessons for library
  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      const matchCategory = selectedCategory === 'Semua' || l.subject === selectedCategory;
      const matchSearch = (l.title + ' ' + l.body).toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [lessons, selectedCategory, search]);

  return (
    <AppShell mode="student">
      <div className="space-y-6">
        {/* ======================================================== */}
        {/* A. HALAMAN BERANDA */}
        {/* ======================================================== */}
        {tab === 'beranda' && (
          <div className="space-y-6 animate-fade-in">
            {/* Hero Section */}
            <div className="relative rounded-3xl bg-gradient-to-r from-[#ebf3fe] via-[#e2eefd] to-[#d7e8fc] dark:from-[#1b2737] dark:via-[#192434] dark:to-[#16202d] border border-[#dcebfa] dark:border-[#25374d] p-6 sm:p-8 overflow-hidden shadow-xs">
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="max-w-lg text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight leading-tight">
                    Halo, {profile?.display_name || 'mikael'}! <span className="inline-block">🌸</span>
                  </h1>
                  <p className="mt-2 text-sm sm:text-base font-semibold text-[#5a7394] dark:text-[#a0b8d6] leading-relaxed">
                    Yuk, lanjutkan petualangan membacamu hari ini!
                  </p>

                  <div className="mt-5">
                    {activeLesson ? (
                      <Link
                        to={`/student/lessons/${activeLesson.id}`}
                        onClick={() => sound.playPop()}
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white dark:bg-[#202f42] text-[#2f4f7f] dark:text-[#e8f2ff] font-black text-sm shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all border border-[#dcebfa] dark:border-[#2b415e]"
                      >
                        <Play size={16} className="fill-[#1cb0f6] text-[#1cb0f6]" />
                        <span>Baca 1 materi hari ini!</span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => navigate('/student/materi')}
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white dark:bg-[#202f42] text-[#2f4f7f] dark:text-[#e8f2ff] font-black text-sm shadow-sm hover:scale-[1.02] active:scale-95 transition-all border border-[#dcebfa]"
                      >
                        <Play size={16} className="fill-[#1cb0f6] text-[#1cb0f6]" />
                        <span>Lihat Peta Literasi</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Chubby Penguin Mascot Reading Book */}
                <div className="shrink-0 relative">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 relative flex items-center justify-center">
                    <img
                      src="/temukata-penguin.svg"
                      alt="TemuKata Mascot Penguin"
                      className="w-full h-full object-contain drop-shadow-sm select-none pointer-events-none hover:scale-105 transition-transform"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>

              {/* Gentle Cloud Accents */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/40 dark:bg-white/5 pointer-events-none blur-sm" />
              <div className="absolute top-2 right-1/4 w-20 h-20 rounded-full bg-white/30 dark:bg-white/5 pointer-events-none blur-xs" />
            </div>

            {/* Grid Row 1: Perjalanan Membacamu & Streak Membaca */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Card 1: Perjalanan Membacamu */}
              <div
                onClick={() => navigate('/student/materi')}
                className="card-temukata card-temukata-hover p-6 cursor-pointer dark:bg-[#182332] dark:border-[#24354a]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                    Perjalanan Membacamu
                  </h3>
                  <ChevronRight size={18} className="text-[#8fa6c1] hover:text-[#1e3a5f]" />
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Ribbon Level Badge */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-[#ebf3fe] dark:bg-[#1f2d3d] border border-[#dcebfa] dark:border-[#2a3e56] p-2 text-center shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#26374a] flex items-center justify-center shadow-xs text-amber-500 mb-1">
                      <BookOpen size={20} className="text-[#1cb0f6]" />
                    </div>
                    <span className="font-black text-sm text-[#1e3a5f] dark:text-[#e8f2ff] leading-none">
                      Level 3
                    </span>
                    <span className="text-[10px] font-bold text-[#5a7394] dark:text-[#9bb7d9] leading-tight mt-0.5">
                      Pembaca Aktif
                    </span>
                  </div>

                  {/* Progress Bar & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-black text-[#1e3a5f] dark:text-[#e8f2ff] mb-2">
                      <span>{completedCount} dari {totalLessonsCount} materi selesai</span>
                      <span className="text-[#1cb0f6]">{progressPercent}%</span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-3.5 bg-[#e8f2ff] dark:bg-[#202f42] rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-[#1cb0f6] to-[#3b82f6] rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="mt-2.5 text-xs font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                      Tinggal {Math.max(totalLessonsCount - completedCount, 1)} materi lagi menuju <strong className="text-[#1e3a5f] dark:text-[#e8f2ff]">Level 4</strong>!
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Streak Membaca */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight mb-4">
                  Streak Membaca
                </h3>

                <div className="flex items-center justify-between gap-4">
                  {/* Left: Flame & Count */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#fff8ed] dark:bg-[#2b251d] border border-[#fde8cb] dark:border-[#3e3427] flex items-center justify-center shrink-0">
                      <StreakFlame active={progress.streak.count > 0} size={38} />
                    </div>
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] block leading-none">
                        {progress.streak.count} Hari
                      </span>
                      <span className="text-xs font-bold text-[#8fa6c1] mt-1 block">
                        {progress.streak.count > 0 ? 'Pertahankan apimu!' : 'Mulai membaca hari ini!'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Weekday Checkmarks */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {daysOfWeek.slice(0, 5).map((day, idx) => {
                      const isActive = progress.streak.weeklyHistory?.[idx] || (idx < 4 && progress.streak.count >= 4);
                      const isToday = idx === todayDayIndex;

                      return (
                        <div key={day} className="flex flex-col items-center">
                          <span className="text-[11px] font-bold text-[#8fa6c1] dark:text-slate-500 mb-1.5">
                            {day}
                          </span>
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                              isActive
                                ? 'bg-[#1cb0f6] text-white shadow-xs'
                                : isToday
                                ? 'bg-white dark:bg-[#1a2533] border-2 border-dashed border-[#1cb0f6] text-[#1cb0f6]'
                                : 'bg-[#eef3f9] dark:bg-[#202d3d] border border-[#dcebfa] dark:border-[#2b3d52] text-slate-300'
                            }`}
                          >
                            {isActive ? (
                              <Check size={14} strokeWidth={3} />
                            ) : isToday ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#1cb0f6]" />
                            ) : (
                              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Row 2: Materi Hari Ini & Jelajahi Materi Lain */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Materi Hari Ini */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={18} className="text-[#1cb0f6]" />
                  <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                    Materi Hari Ini
                  </h3>
                </div>

                {activeLesson ? (
                  <div className="rounded-2xl border border-[#e5edf7] dark:border-[#24354a] bg-[#fbfdff] dark:bg-[#151f2b] p-4 flex items-center justify-between gap-4">
                    {/* Scenic Thumbnail Illustration */}
                    <div className="w-20 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-[#cde4fd] to-[#a7d0fd] relative flex items-center justify-center">
                      <svg viewBox="0 0 100 70" className="w-full h-full object-cover">
                        <rect width="100" height="70" fill="#a7d0fd" />
                        <path d="M0,50 Q30,35 60,45 T100,40 L100,70 L0,70 Z" fill="#75ba75" />
                        <path d="M0,58 Q40,48 80,55 T100,52 L100,70 L0,70 Z" fill="#5ea85e" />
                        <circle cx="20" cy="55" r="2.5" fill="#fff" />
                        <circle cx="50" cy="52" r="2" fill="#fff" />
                        <circle cx="80" cy="58" r="2.5" fill="#fff" />
                        <circle cx="25" cy="20" r="8" fill="#ffffff" opacity="0.8" />
                        <circle cx="35" cy="22" r="10" fill="#ffffff" opacity="0.8" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#e8f2ff] dark:bg-[#1f2e42] text-[10px] font-black text-[#1cb0f6] mb-1.5 uppercase tracking-wider">
                        {activeLesson.subject || 'Teks Eksposisi'}
                      </span>
                      <h4 className="font-black text-sm sm:text-base text-[#1e3a5f] dark:text-[#e8f2ff] line-clamp-1 leading-snug">
                        {activeLesson.title}
                      </h4>
                      <p className="text-xs font-semibold text-[#8fa6c1] dark:text-slate-400 mt-1 line-clamp-1">
                        Temukan kalimat bukti dan pahami ide pokok bacaan.
                      </p>
                    </div>

                    <Link
                      to={`/student/lessons/${activeLesson.id}`}
                      onClick={() => sound.playPop()}
                      className="w-11 h-11 rounded-full bg-[#1cb0f6] hover:bg-[#0fa0eb] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform"
                      title="Mulai Membaca"
                    >
                      <Play size={18} className="fill-white ml-0.5" />
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-400">Tidak ada materi aktif.</p>
                )}
              </div>

              {/* Jelajahi Materi Lain (4 Categories Grid) */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                    Jelajahi Materi Lain
                  </h3>
                  <button
                    onClick={() => {
                      setMateriSubTab('daftar');
                      navigate('/student/materi');
                    }}
                    className="text-xs font-bold text-[#1cb0f6] hover:underline inline-flex items-center gap-1"
                  >
                    Lihat Semua <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Membaca Teks', icon: <BookOpen size={22} className="text-[#1cb0f6]" /> },
                    { label: 'Menemukan Bukti', icon: <Search size={22} className="text-[#1cb0f6]" /> },
                    { label: 'Ide Pokok', icon: <Layers size={22} className="text-[#1cb0f6]" /> },
                    { label: 'Menyimpulkan', icon: <Feather size={22} className="text-[#1cb0f6]" /> },
                  ].map(cat => (
                    <button
                      key={cat.label}
                      onClick={() => {
                        sound.playPop();
                        setMateriSubTab('daftar');
                        navigate('/student/materi');
                      }}
                      className="p-3.5 rounded-2xl bg-[#f7f9fd] dark:bg-[#151f2b] border border-[#e5edf7] dark:border-[#24354a] hover:border-[#b9d7ef] hover:bg-[#eef5fc] dark:hover:bg-[#1b2737] flex flex-col items-center justify-center text-center transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1e2e42] flex items-center justify-center shadow-2xs mb-2 group-hover:scale-105 transition-transform">
                        {cat.icon}
                      </div>
                      <span className="text-xs font-extrabold text-[#1e3a5f] dark:text-[#e8f2ff] leading-tight">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* B. HALAMAN MATERI (PETA LITERASI & DAFTAR BACAAN) */}
        {/* ======================================================== */}
        {tab === 'materi' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Segmented Control */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                  Materi Pembelajaran
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                  Tingkatkan kemampuan membacamu langkah demi langkah.
                </p>
              </div>

              {/* Segmented Control Tabs */}
              <div className="p-1 rounded-2xl bg-[#e8f2ff] dark:bg-[#192636] border border-[#dcebfa] dark:border-[#26374a] inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMateriSubTab('peta');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    materiSubTab === 'peta'
                      ? 'bg-white dark:bg-[#202f42] text-[#2f4f7f] dark:text-[#e8f2ff] shadow-xs'
                      : 'text-[#5a7394] hover:text-[#1e3a5f]'
                  }`}
                >
                  <BookOpen size={16} />
                  <span>Peta Literasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMateriSubTab('daftar');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    materiSubTab === 'daftar'
                      ? 'bg-white dark:bg-[#202f42] text-[#2f4f7f] dark:text-[#e8f2ff] shadow-xs'
                      : 'text-[#5a7394] hover:text-[#1e3a5f]'
                  }`}
                >
                  <Layers size={16} />
                  <span>Daftar Bacaan</span>
                </button>
              </div>
            </div>

            {/* View 1: Peta Literasi (Vertical Timeline) */}
            {materiSubTab === 'peta' && (
              <div className="space-y-4">
                {/* Intro Banner */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#182332] border border-[#e5edf7] dark:border-[#24354a] flex items-center justify-between gap-4 shadow-xs">
                  <div>
                    <h2 className="text-xl font-black text-[#1e3a5f] dark:text-[#e8f2ff]">
                      Peta Literasi
                    </h2>
                    <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                      Perjalananmu menjadi pembaca hebat!
                    </p>
                  </div>
                  {/* Cute Wooden Signpost Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-[#ebf3fe] dark:bg-[#1f2d3d] flex items-center justify-center text-xl shrink-0">
                    🪵
                  </div>
                </div>

                {/* Vertical Progression Timeline */}
                <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:border-l-2 before:border-dashed before:border-[#b9d7ef] dark:before:border-[#2b415e]">
                  {levels.map((lvl) => {
                    const isCompleted = lvl.status === 'Selesai';
                    const isCurrent = lvl.status === 'Sedang Berlangsung';
                    const isLocked = lvl.status === 'Terkunci';

                    return (
                      <div key={lvl.level} className="relative group">
                        {/* Node Icon on the line */}
                        <div
                          className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs transition-all z-10 ${
                            isCompleted
                              ? 'bg-[#48bb78] text-white shadow-xs'
                              : isCurrent
                              ? 'bg-[#1cb0f6] text-white ring-4 ring-[#dcebfa] dark:ring-[#1c2e44] shadow-sm animate-pulse'
                              : 'bg-[#e2e8f0] dark:bg-[#253549] text-slate-400'
                          }`}
                        >
                          {isCompleted ? (
                            <Check size={16} strokeWidth={3} />
                          ) : isCurrent ? (
                            <span>{lvl.level}</span>
                          ) : (
                            <Lock size={13} />
                          )}
                        </div>

                        {/* Level Card */}
                        <div
                          onClick={() => {
                            if (!isLocked && activeLesson) {
                              sound.playPop();
                              navigate(`/student/lessons/${activeLesson.id}`);
                            }
                          }}
                          className={`card-temukata p-5 sm:p-6 transition-all ${
                            isCurrent
                              ? 'border-2 border-[#1cb0f6] bg-[#f5faff] dark:bg-[#162334] shadow-md cursor-pointer hover:scale-[1.01]'
                              : isCompleted
                              ? 'border-[#e5edf7] dark:border-[#24354a] bg-white dark:bg-[#182332] cursor-pointer hover:border-[#b9d7ef]'
                              : 'border-[#e5edf7] dark:border-[#24354a] bg-[#fafbfc] dark:bg-[#141d27] opacity-75'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff]">
                                  Level {lvl.level}: {lvl.title}
                                </h3>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    isCompleted
                                      ? 'bg-[#e6f7ec] text-[#22c55e] dark:bg-[#142e20]'
                                      : isCurrent
                                      ? 'bg-[#e8f2ff] text-[#2563eb] dark:bg-[#182e4a]'
                                      : 'bg-slate-100 text-slate-400 dark:bg-[#1f2c3d]'
                                  }`}
                                >
                                  {lvl.status}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                                {lvl.desc}
                              </p>
                            </div>

                            {/* Decorative Illustration for Level */}
                            <div className="shrink-0 flex items-center gap-3">
                              <div className="w-20 h-14 rounded-xl overflow-hidden bg-[#eef5fc] dark:bg-[#1f2d3d] border border-[#dcebfa] dark:border-[#273b52] flex items-center justify-center text-2xl">
                                {lvl.type === 'meadow' && '🌼'}
                                {lvl.type === 'forest' && '🌲'}
                                {lvl.type === 'book' && '📖✨'}
                                {lvl.type === 'stack' && '📚'}
                                {lvl.type === 'trophy' && '🏆'}
                              </div>

                              {isCurrent && (
                                <button className="px-4 py-2 rounded-xl bg-[#1cb0f6] text-white font-black text-xs hover:bg-[#0fa0eb] shadow-xs active:scale-95 transition-transform flex items-center gap-1.5">
                                  <span>Mulai</span>
                                  <Play size={12} className="fill-white" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* View 2: Daftar Bacaan (Full Library) */}
            {materiSubTab === 'daftar' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#182332] border border-[#e5edf7] dark:border-[#24354a] flex flex-col sm:flex-row items-center gap-3 shadow-xs">
                  <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari judul bacaan atau kata kunci..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e5edf7] dark:border-[#24354a] bg-[#f7f9fd] dark:bg-[#141d27] text-xs sm:text-sm font-bold text-[#1e3a5f] dark:text-[#e8f2ff] focus:outline-none focus:border-[#1cb0f6]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {['Semua', 'Bahasa Indonesia'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                          selectedCategory === cat
                            ? 'bg-[#1cb0f6] text-white'
                            : 'bg-[#f7f9fd] dark:bg-[#1e2e42] text-[#5a7394] hover:bg-[#e8f2ff]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lessons Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredLessons.map(lesson => {
                    const isDone = completedLessonIds.has(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a] flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-[#e8f2ff] dark:bg-[#1e2e42] text-[10px] font-black text-[#1cb0f6]">
                              {lesson.subject}
                            </span>
                            {isDone && (
                              <span className="flex items-center gap-1 text-[11px] font-black text-[#48bb78]">
                                <CheckCircle2 size={14} /> Selesai
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-base text-[#1e3a5f] dark:text-[#e8f2ff] line-clamp-2">
                            {lesson.title}
                          </h3>
                          <p className="text-xs font-semibold text-[#8fa6c1] dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                            {lesson.body}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-[#f0f4f9] dark:border-[#24354a]">
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={13} /> {lesson.readingTimeMin || 3} menit
                          </span>

                          <Link
                            to={`/student/lessons/${lesson.id}`}
                            onClick={() => sound.playPop()}
                            className="px-4 py-2 rounded-xl bg-[#e8f2ff] hover:bg-[#1cb0f6] text-[#2f4f7f] hover:text-white font-black text-xs transition-all flex items-center gap-1.5"
                          >
                            <span>{isDone ? 'Ulangi' : 'Baca'}</span>
                            <Play size={12} className="fill-current" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* C. HALAMAN PROGRES (STATISTIK BELAJAR) */}
        {/* ======================================================== */}
        {tab === 'progres' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                Progres Belajar
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                Pantau perkembangan kemampuan membaca dan pemahaman teksmu.
              </p>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a]">
                <div className="w-10 h-10 rounded-xl bg-[#e6f7ec] text-[#22c55e] flex items-center justify-center mb-3">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-2xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] block leading-none">
                  {completedCount}
                </span>
                <span className="text-xs font-bold text-[#8fa6c1] mt-1 block">Materi Selesai</span>
              </div>

              <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a]">
                <div className="w-10 h-10 rounded-xl bg-[#e8f2ff] text-[#1cb0f6] flex items-center justify-center mb-3">
                  <Award size={20} />
                </div>
                <span className="text-2xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] block leading-none">
                  92%
                </span>
                <span className="text-xs font-bold text-[#8fa6c1] mt-1 block">Akurasi Jawaban</span>
              </div>

              <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a]">
                <div className="w-10 h-10 rounded-xl bg-[#f0f5fc] text-[#3b82f6] flex items-center justify-center mb-3">
                  <Search size={20} />
                </div>
                <span className="text-2xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] block leading-none">
                  48
                </span>
                <span className="text-xs font-bold text-[#8fa6c1] mt-1 block">Kalimat Bukti</span>
              </div>

              <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a]">
                <div className="w-10 h-10 rounded-xl bg-[#fff8ed] text-amber-500 flex items-center justify-center mb-3">
                  <StreakFlame active={progress.streak.count > 0} size={24} />
                </div>
                <span className="text-2xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] block leading-none">
                  {progress.streak.count} Hari
                </span>
                <span className="text-xs font-bold text-[#8fa6c1] mt-1 block">Streak Membaca</span>
              </div>
            </div>

            {/* Riwayat Aktivitas & Pencapaian */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Riwayat Aktivitas */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff] mb-4">
                  Riwayat Aktivitas
                </h3>

                <div className="space-y-3">
                  {attempts.slice(0, 4).map((att, i) => (
                    <div
                      key={att.id || i}
                      className="p-3.5 rounded-2xl bg-[#f7f9fd] dark:bg-[#151f2b] border border-[#e5edf7] dark:border-[#24354a] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1f2d3d] flex items-center justify-center text-xs font-black text-[#1cb0f6]">
                          ✓
                        </div>
                        <div>
                          <b className="text-xs font-black text-[#1e3a5f] dark:text-[#e8f2ff] line-clamp-1">
                            {att.lessons?.title || 'Latihan Membaca Pemahaman'}
                          </b>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {new Date(att.submitted_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#48bb78]">
                          {att.score} / {att.total}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block">Skor</span>
                      </div>
                    </div>
                  ))}

                  {attempts.length === 0 && (
                    <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                      Belum ada riwayat pengerjaan. Yuk mulai membaca!
                    </p>
                  )}
                </div>
              </div>

              {/* Koleksi Pencapaian */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff] mb-4">
                  Koleksi Pencapaian
                </h3>

                <div className="space-y-3">
                  {[
                    { title: 'Pembaca Rajin', desc: 'Jaga streak membaca 3 hari berturut-turut.', icon: '🔥', done: progress.streak.count >= 3 },
                    { title: 'Detektif Kalimat Bukti', desc: 'Temukan bukti teks dengan akurasi 100%.', icon: '🔍', done: true },
                    { title: 'Penjelajah Bahasa', desc: 'Selesaikan 5 materi bacaan berbeda.', icon: '📚', done: completedCount >= 5 },
                    { title: 'Master Kuis Literasi', desc: 'Raih skor sempurna pada level aktif.', icon: '⭐', done: false },
                  ].map(ach => (
                    <div
                      key={ach.title}
                      className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
                        ach.done
                          ? 'bg-[#ebf3fe] dark:bg-[#172535] border-[#dcebfa] dark:border-[#273c54]'
                          : 'bg-[#fafbfc] dark:bg-[#141d27] border-[#e5edf7] dark:border-[#24354a] opacity-60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1f2d3d] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                        {ach.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <b className="text-xs font-black text-[#1e3a5f] dark:text-[#e8f2ff] block">
                          {ach.title}
                        </b>
                        <span className="text-[11px] font-semibold text-[#5a7394] dark:text-[#9bb7d9] line-clamp-1">
                          {ach.desc}
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#1cb0f6]">
                        {ach.done ? 'Terbuka' : 'Terkunci'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* D. HALAMAN AKUN (PROFIL & PENGATURAN) */}
        {/* ======================================================== */}
        {tab === 'akun' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                Akun Saya
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                Kelola profil dan preferensi belajarmu di TemuKata.
              </p>
            </div>

            {/* Profile Card */}
            <div className="card-temukata p-6 sm:p-8 dark:bg-[#182332] dark:border-[#24354a] text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-[#ebf3fe] dark:bg-[#1f2d3d] border-2 border-[#dcebfa] dark:border-[#273c54] flex items-center justify-center shrink-0 shadow-xs relative">
                <img
                  src="/temukata-penguin.svg"
                  alt="Avatar Penguin"
                  className="w-18 h-18 object-contain pointer-events-none select-none"
                  draggable={false}
                />
              </div>

              <div className="flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-[#ebf3fe] dark:bg-[#1f2e42] text-[10px] font-black text-[#1cb0f6] uppercase tracking-wider mb-2">
                  Level 3: Pembaca Aktif
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1e3a5f] dark:text-[#e8f2ff]">
                  {profile?.display_name || 'Mikael Siswa'}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                  {user?.email || 'mikael@temukata.id'}
                </p>

                {/* Mini Stats Row */}
                <div className="mt-4 pt-4 border-t border-[#f0f4f9] dark:border-[#24354a] flex items-center justify-center sm:justify-start gap-6 text-center">
                  <div>
                    <span className="text-base font-black text-[#1cb0f6] block">{progress.diamonds}</span>
                    <span className="text-[10px] font-bold text-slate-400">Permata</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-[#ff9600] block">{progress.streak.count} Hari</span>
                    <span className="text-[10px] font-bold text-slate-400">Streak</span>
                  </div>
                  <div>
                    <span className="text-base font-black text-[#48bb78] block">{completedCount}</span>
                    <span className="text-[10px] font-bold text-slate-400">Materi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pengaturan & Logout */}
            <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a] space-y-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-2">
                Pengaturan
              </h3>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f7f9fd] dark:bg-[#151f2b] border border-[#e5edf7] dark:border-[#24354a]">
                <div className="flex items-center gap-3">
                  <Volume2 size={18} className="text-[#1cb0f6]" />
                  <span className="text-xs sm:text-sm font-black text-[#1e3a5f] dark:text-[#e8f2ff]">
                    Efek Suara Interaktif
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => sound.toggle()}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#202f42] border border-[#dcebfa] dark:border-[#2b415e] text-xs font-black text-[#2f4f7f] dark:text-[#a5c7f2] hover:bg-[#e8f2ff] transition-all"
                >
                  Ubah
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f7f9fd] dark:bg-[#151f2b] border border-[#e5edf7] dark:border-[#24354a]">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-[#48bb78]" />
                  <span className="text-xs sm:text-sm font-black text-[#1e3a5f] dark:text-[#e8f2ff]">
                    Perlindungan Streak (Streak Freeze)
                  </span>
                </div>
                <span className="text-xs font-black text-[#48bb78]">
                  {progress.streak.freezeCount}x Aktif
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  void signOut();
                }}
                className="w-full mt-4 p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LogOut size={16} />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
