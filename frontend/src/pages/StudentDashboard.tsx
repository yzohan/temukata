import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Feather,
  HelpCircle,
  Layers,
  Lock,
  LogOut,
  Palette,
  Play,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import StreakFlame from '../components/StreakFlame';
import AvatarFrame from '../components/AvatarFrame';
import StoreStallIcon from '../components/StoreStallIcon';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { sound } from '../lib/sounds';
import {
  STORE_ITEMS,
  buyStoreItem,
  equipBorder,
  getUserProgress,
} from '../lib/gamification';
import type { Lesson, StudentAttempt } from '../types';

interface StudentDashboardProps {
  tab?: 'beranda' | 'materi' | 'toko' | 'koleksi' | 'progres' | 'akun';
}

export default function StudentDashboard({ tab = 'beranda' }: StudentDashboardProps) {
  const { session, profile, user, signOut } = useAuth();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [, setLoading] = useState(true);

  // Local tab sub-states
  const [materiSubTab, setMateriSubTab] = useState<'peta' | 'daftar'>('peta');
  const [storeCategory, setStoreCategory] = useState<'Semua' | 'Border' | 'Lencana' | 'Latar Profil'>('Semua');
  const [koleksiCategory, setKoleksiCategory] = useState<'Border' | 'Lencana' | 'Latar Profil'>('Border');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Preview border in Koleksi
  const [previewBorder, setPreviewBorder] = useState<string>('ice-dream');
  const [purchaseFeedback, setPurchaseFeedback] = useState<string>('');

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

  useEffect(() => {
    if (progress.equippedBorder) {
      setPreviewBorder(progress.equippedBorder);
    }
  }, [progress.equippedBorder]);

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

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'];

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

  // Handle Buy Store Item
  function handleBuy(item: (typeof STORE_ITEMS)[0]) {
    sound.playPop();
    const res = buyStoreItem(item);
    setPurchaseFeedback(res.message);
    setTimeout(() => setPurchaseFeedback(''), 4000);
  }

  // Handle Equip Border
  function handleEquip(borderId: string) {
    sound.playPop();
    equipBorder(borderId);
    setPurchaseFeedback('Berhasil memakai border baru pada profilmu! ✨');
    setTimeout(() => setPurchaseFeedback(''), 4000);
  }

  return (
    <AppShell mode="student">
      <div className="space-y-6">
        {/* Floating Notification Toast */}
        {purchaseFeedback && (
          <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-white dark:bg-[#182332] border-2 border-[#1cb0f6] shadow-xl text-xs sm:text-sm font-black text-[#1e3a5f] dark:text-[#e8f2ff] animate-pop flex items-center gap-2.5">
            <Sparkles size={18} className="text-[#1cb0f6]" />
            <span>{purchaseFeedback}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 01: BERANDA */}
        {/* ======================================================== */}
        {tab === 'beranda' && (
          <div className="space-y-6 animate-fade-in">
            {/* Hero Section */}
            <div className="relative rounded-[28px] bg-[#DCEBFA] dark:bg-[#1a2738] border border-[#D2E4F7] dark:border-[#25374d] p-6 sm:p-8 overflow-hidden min-h-[190px] flex items-center justify-between shadow-xs">
              {/* Left Content */}
              <div className="relative z-10 max-w-md sm:max-w-lg">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#264466] dark:text-[#e8f2ff] tracking-tight leading-tight">
                  Halo, {profile?.display_name || 'Nathania'}!
                </h1>
                <p className="mt-2 text-sm sm:text-base font-medium text-[#526F92] dark:text-[#a0b8d6] leading-relaxed">
                  Yuk, lanjutkan petualangan membacamu hari ini!
                </p>

                <div className="mt-5">
                  {activeLesson ? (
                    <Link
                      to={`/student/lessons/${activeLesson.id}`}
                      onClick={() => sound.playPop()}
                      className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#5B8DB8] hover:bg-[#4D7FA9] text-white font-bold text-sm shadow-xs active:scale-95 transition-all"
                    >
                      <Play size={14} className="fill-white" />
                      <span>Baca 1 materi hari ini</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => navigate('/student/materi')}
                      className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#5B8DB8] hover:bg-[#4D7FA9] text-white font-bold text-sm shadow-xs active:scale-95 transition-all cursor-pointer"
                    >
                      <Play size={14} className="fill-white" />
                      <span>Lihat Peta Literasi</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Hero Illustration */}
              <div className="hidden sm:block absolute right-0 top-0 bottom-0 h-full w-[46%] lg:w-[48%] pointer-events-none select-none overflow-hidden">
                <img
                  src="/temukata-hero-illustration.png"
                  alt="TemuKata Mascot Reading"
                  className="h-full w-full object-contain object-right"
                  draggable={false}
                />
              </div>

              {/* Mobile Mascot Fallback */}
              <div className="sm:hidden mt-4 shrink-0 flex justify-end">
                <img
                  src="/temukata-hero-illustration.png"
                  alt="TemuKata Mascot Reading"
                  className="w-44 h-auto object-contain"
                  draggable={false}
                />
              </div>
            </div>

            {/* Grid Row 1: Perjalanan Membacamu & Streak Membaca */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Card 1: Perjalanan Membacamu */}
              <div
                onClick={() => navigate('/student/materi')}
                className="card-temukata card-temukata-hover p-6 cursor-pointer dark:bg-[#182332] dark:border-[#24354a]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-[#304D70] dark:text-[#e8f2ff] tracking-tight">
                    Perjalanan Membacamu
                  </h3>
                  <ChevronRight size={18} className="text-[#526F92]" />
                </div>

                <div className="flex items-center gap-5">
                  {/* Ribbon Level Badge */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-[#E8F2FC] dark:bg-[#1f2d3d] border border-[#D8E6F5] dark:border-[#2a3e56] p-2 text-center shadow-2xs">
                    <BookOpen size={20} className="text-[#304D70] dark:text-[#e8f2ff] mb-1" />
                    <span className="font-bold text-sm text-[#304D70] dark:text-[#e8f2ff] leading-none">
                      Level 3
                    </span>
                    <span className="text-[10px] font-semibold text-[#526F92] dark:text-[#9bb7d9] leading-tight mt-1">
                      Pembaca Aktif
                    </span>
                  </div>

                  {/* Progress Bar & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#304D70] dark:text-[#e8f2ff] mb-2">
                      <span>{completedCount} dari {totalLessonsCount} materi selesai</span>
                      <span className="text-[#3A7BB8] font-bold">{progressPercent}%</span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-2.5 bg-[#E8EEF5] dark:bg-[#202f42] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#5B9CD8] rounded-full transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="mt-2.5 text-xs font-medium text-[#526F92] dark:text-[#9bb7d9]">
                      Tinggal {Math.max(totalLessonsCount - completedCount, 1)} materi lagi menuju <strong className="text-[#304D70] dark:text-[#e8f2ff]">Level 4</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Streak Membaca */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <h3 className="font-bold text-base text-[#304D70] dark:text-[#e8f2ff] tracking-tight mb-4">
                  Streak Membaca
                </h3>

                <div className="flex items-center justify-between gap-4">
                  {/* Left: Calendar Icon & Count */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1a2533] border border-[#E4E8ED] dark:border-[#2b3d52] flex items-center justify-center shrink-0 shadow-2xs">
                      <Calendar size={24} className="text-[#304D70] dark:text-[#e8f2ff]" strokeWidth={2} />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-[#304D70] dark:text-[#e8f2ff] block leading-none">
                        {progress.streak.count || 4} Hari
                      </span>
                      <span className="text-xs font-medium text-[#526F92] dark:text-slate-400 mt-1.5 block">
                        Pertahankan rutinitamu!
                      </span>
                    </div>
                  </div>

                  {/* Right: Weekday Checkmarks */}
                  <div className="flex items-center gap-2">
                    {daysOfWeek.map((day, idx) => {
                      const isActive = progress.streak.weeklyHistory?.[idx] || (idx < 4 && (progress.streak.count || 4) >= 4);

                      return (
                        <div key={day} className="flex flex-col items-center">
                          <span className="text-[11px] font-bold text-[#526F92] dark:text-slate-400 mb-1.5">
                            {day}
                          </span>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isActive
                                ? 'bg-[#75A5D3] text-white shadow-2xs'
                                : 'bg-white dark:bg-[#1a2533] border border-[#DCE4ED] dark:border-[#2b3d52]'
                            }`}
                          >
                            {isActive && <Check size={14} strokeWidth={3} className="text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Row 2: Materi Hari Ini & Shortcut Toko TemuKata */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Materi Hari Ini */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={18} className="text-[#304D70] dark:text-[#e8f2ff]" />
                  <h3 className="font-bold text-base text-[#304D70] dark:text-[#e8f2ff] tracking-tight">
                    Materi Hari Ini
                  </h3>
                </div>

                <div className="rounded-2xl border border-[#EAEFF5] dark:border-[#24354a] bg-white dark:bg-[#151f2b] p-3.5 sm:p-4 flex items-center justify-between gap-4">
                  {/* Scenic Thumbnail Illustration */}
                  <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden shrink-0 relative shadow-2xs">
                    <svg viewBox="0 0 110 75" className="w-full h-full object-cover">
                      <rect width="110" height="75" fill="#C4E4FD" />
                      <circle cx="25" cy="22" r="14" fill="#FFFFFF" opacity="0.85" />
                      <circle cx="45" cy="25" r="10" fill="#FFFFFF" opacity="0.85" />
                      <circle cx="90" cy="20" r="12" fill="#FFFFFF" opacity="0.8" />
                      <path d="M0,52 Q40,36 80,48 T110,42 L110,75 L0,75 Z" fill="#93C867" />
                      <path d="M0,60 Q50,48 90,56 T110,54 L110,75 L0,75 Z" fill="#78B54D" />
                      <circle cx="20" cy="62" r="2" fill="#FFFFFF" />
                      <circle cx="50" cy="58" r="2.2" fill="#FFFFFF" />
                      <circle cx="82" cy="64" r="2" fill="#FFFFFF" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#E8F2FC] dark:bg-[#1f2e42] text-[10px] font-bold text-[#304D70] dark:text-[#8DB4D8] mb-1 uppercase tracking-wider">
                      Bahasa INDONESIA
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-[#304D70] dark:text-[#e8f2ff] line-clamp-1 leading-snug">
                      {activeLesson?.title || 'Gagasan Pokok'}
                    </h4>
                    <p className="text-xs font-medium text-[#526F92] dark:text-slate-400 mt-1 line-clamp-1">
                      Temukan kalimat bukti dan pahami isi bacaan.
                    </p>
                  </div>

                  {activeLesson && (
                    <Link
                      to={`/student/lessons/${activeLesson.id}`}
                      onClick={() => sound.playPop()}
                      className="w-10 h-10 rounded-full bg-[#6B9CC8] hover:bg-[#5B8DB8] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform"
                      title="Mulai Membaca"
                    >
                      <Play size={16} className="fill-white ml-0.5" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Shortcut Toko TemuKata Banner */}
              <div
                onClick={() => navigate('/student/toko')}
                className="card-temukata card-temukata-hover p-6 cursor-pointer dark:bg-[#182332] dark:border-[#24354a]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag size={18} className="text-[#304D70] dark:text-[#e8f2ff]" />
                  <h3 className="font-bold text-base text-[#304D70] dark:text-[#e8f2ff] tracking-tight">
                    Toko TemuKata
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#F5B9C4] text-[#832637] font-bold text-[10px] ml-2">
                    Baru
                  </span>
                </div>

                <div className="rounded-2xl border border-[#EAEFF5] dark:border-[#24354a] bg-white dark:bg-[#151f2b] p-3.5 sm:p-4 flex items-center justify-between gap-4 group">
                  <StoreStallIcon size={56} />

                  <p className="text-xs sm:text-sm font-medium text-[#526F92] dark:text-[#9bb7d9] leading-relaxed flex-1">
                    Temukan border dan hiasan avatar baru.
                  </p>

                  <ChevronRight size={18} className="text-[#526F92] group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </div>
            </div>

            {/* Jelajahi Aktivitas Literasi (4 Categories Grid) */}
            <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
              <div className="flex items-center gap-2 mb-4">
                <Feather size={18} className="text-[#304D70] dark:text-[#e8f2ff]" />
                <h3 className="font-bold text-base text-[#304D70] dark:text-[#e8f2ff] tracking-tight">
                  Jelajahi Aktivitas Literasi
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Membaca Teks', icon: <BookOpen size={24} className="text-[#457AA9] group-hover:scale-105 transition-transform" strokeWidth={2} /> },
                  { label: 'Menemukan Bukti', icon: <Search size={24} className="text-[#457AA9] group-hover:scale-105 transition-transform" strokeWidth={2} /> },
                  { label: 'Ide Pokok', icon: <Layers size={24} className="text-[#457AA9] group-hover:scale-105 transition-transform" strokeWidth={2} /> },
                  { label: 'Menyimpulkan', icon: <Feather size={24} className="text-[#457AA9] group-hover:scale-105 transition-transform" strokeWidth={2} /> },
                ].map(cat => (
                  <button
                    key={cat.label}
                    onClick={() => {
                      sound.playPop();
                      setMateriSubTab('daftar');
                      navigate('/student/materi');
                    }}
                    className="p-4 rounded-2xl bg-[#FFFDF8] dark:bg-[#151f2b] border border-[#EAEFF5] dark:border-[#24354a] hover:border-[#BFD5EA] hover:bg-[#F4F9FF] dark:hover:bg-[#1b2737] flex flex-col items-center justify-center text-center transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1">
                      {cat.icon}
                    </div>
                    <span className="text-sm font-bold text-[#304D70] dark:text-[#e8f2ff]">
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 02: MATERI / PETA LITERASI */}
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
        {/* PAGE 04: TOKO TEMUKATA */}
        {/* ======================================================== */}
        {tab === 'toko' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#ebf3fe] via-[#e2eefd] to-[#d7e8fc] dark:from-[#1b2737] dark:via-[#192434] dark:to-[#16202d] border border-[#dcebfa] dark:border-[#25374d] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                    Toko TemuKata
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5b9c4] text-[#832637] text-[10px] font-black uppercase">
                    Kosmetik
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                  Gunakan poinmu untuk membeli border dan hiasan avatar favoritmu!
                </p>
              </div>

              {/* Diamonds Balance Pill */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#1f2d3d] border border-[#dcebfa] dark:border-[#2b3e56] shadow-xs shrink-0">
                <span className="text-xs font-bold text-slate-400">Poin Kamu:</span>
                <img src="/gem-diamond.svg" alt="Gem" className="w-5 h-5 object-contain" />
                <span className="font-black text-base text-[#1cb0f6]">{progress.diamonds}</span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['Semua', 'Border', 'Lencana', 'Latar Profil'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    sound.playPop();
                    setStoreCategory(cat);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
                    storeCategory === cat
                      ? 'bg-[#1cb0f6] text-white shadow-xs'
                      : 'bg-white dark:bg-[#182332] border border-[#e5edf7] dark:border-[#24354a] text-[#5a7394] hover:bg-[#e8f2ff]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Store Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {STORE_ITEMS.map(item => {
                const isOwned = progress.inventory?.includes(item.id);
                const isEquipped = progress.equippedBorder === item.id;
                const canAfford = progress.diamonds >= item.price;

                return (
                  <div
                    key={item.id}
                    className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a] flex flex-col items-center text-center justify-between gap-3 group hover:border-[#b9d7ef]"
                  >
                    {/* Item Avatar Frame Preview */}
                    <div className="w-24 h-24 flex items-center justify-center p-2 rounded-2xl bg-[#fbfdff] dark:bg-[#151f2b] border border-[#e5edf7] dark:border-[#24354a]">
                      <AvatarFrame borderId={item.id} size={76} />
                    </div>

                    <div className="w-full">
                      <span className="text-[10px] font-bold text-[#8fa6c1] uppercase tracking-wider block">
                        {item.rarity}
                      </span>
                      <h4 className="font-black text-sm text-[#1e3a5f] dark:text-[#e8f2ff] mt-0.5">
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-[#5a7394] dark:text-[#9bb7d9] line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Price & Action Button */}
                    <div className="w-full pt-2 border-t border-[#f0f4f9] dark:border-[#24354a] flex flex-col items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#1cb0f6]">
                        <img src="/gem-diamond.svg" alt="Gem" className="w-4 h-4 object-contain" />
                        <span>{item.price}</span>
                      </div>

                      {isOwned ? (
                        isEquipped ? (
                          <span className="w-full py-2 rounded-xl bg-[#e6f7ec] text-[#22c55e] text-xs font-black">
                            Dipakai ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEquip(item.id)}
                            className="w-full py-2 rounded-xl bg-[#e8f2ff] hover:bg-[#1cb0f6] text-[#2f4f7f] hover:text-white text-xs font-black transition-all"
                          >
                            Pakai
                          </button>
                        )
                      ) : (
                        <button
                          disabled={!canAfford}
                          onClick={() => handleBuy(item)}
                          className={`w-full py-2 rounded-xl text-xs font-black transition-all ${
                            canAfford
                              ? 'bg-[#1cb0f6] hover:bg-[#0fa0eb] text-white shadow-xs active:scale-95'
                              : 'bg-slate-100 dark:bg-[#202d3d] text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'Beli' : 'Poin Kurang'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 05: KOLEKSI / INVENTORY */}
        {/* ======================================================== */}
        {tab === 'koleksi' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                  Koleksi Saya
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                  Semua border dan hiasan avatar yang sudah kamu miliki.
                </p>
              </div>

              <button
                onClick={() => navigate('/student/toko')}
                className="px-4 py-2 rounded-xl bg-[#1cb0f6] text-white font-black text-xs hover:bg-[#0fa0eb] transition-all flex items-center gap-1.5 shadow-xs"
              >
                <ShoppingBag size={14} />
                <span>Buka Toko</span>
              </button>
            </div>

            {/* Layout 2 Columns: Live Preview on Left + Grid on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
              {/* Left Column: Live Profile Preview Card */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a] flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-[#8fa6c1] tracking-wider mb-4">
                  Pratinjau Profil
                </span>

                <div className="my-3 p-4 rounded-3xl bg-[#f7f9fd] dark:bg-[#151f2b] border border-[#e5edf7] dark:border-[#24354a] flex items-center justify-center">
                  <AvatarFrame borderId={previewBorder} size={130} />
                </div>

                <h3 className="font-black text-lg text-[#1e3a5f] dark:text-[#e8f2ff] mt-2">
                  {profile?.display_name || 'Nathania'}
                </h3>
                <span className="text-xs font-bold text-[#5a7394] dark:text-[#9bb7d9]">
                  Level 3: Pembaca Aktif
                </span>

                <div className="w-full mt-6 pt-4 border-t border-[#f0f4f9] dark:border-[#24354a]">
                  {progress.equippedBorder === previewBorder ? (
                    <div className="w-full py-2.5 rounded-xl bg-[#e6f7ec] text-[#22c55e] font-black text-xs">
                      Sedang Digunakan ✓
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEquip(previewBorder)}
                      className="w-full py-2.5 rounded-xl bg-[#1cb0f6] hover:bg-[#0fa0eb] text-white font-black text-xs shadow-xs active:scale-95 transition-all"
                    >
                      Atur di Profil
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Inventory Items Grid */}
              <div className="space-y-4">
                {/* Category tabs */}
                <div className="p-1 rounded-2xl bg-[#e8f2ff] dark:bg-[#192636] border border-[#dcebfa] dark:border-[#26374a] inline-flex items-center gap-1">
                  {(['Border', 'Lencana', 'Latar Profil'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        sound.playPop();
                        setKoleksiCategory(cat);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        koleksiCategory === cat
                          ? 'bg-white dark:bg-[#202f42] text-[#2f4f7f] dark:text-[#e8f2ff] shadow-xs'
                          : 'text-[#5a7394] hover:text-[#1e3a5f]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid of Items */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {STORE_ITEMS.map(item => {
                    const isOwned = progress.inventory?.includes(item.id);
                    const isEquipped = progress.equippedBorder === item.id;
                    const isSelectedPreview = previewBorder === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isOwned) {
                            sound.playPop();
                            setPreviewBorder(item.id);
                          }
                        }}
                        className={`card-temukata p-4 dark:bg-[#182332] dark:border-[#24354a] flex flex-col items-center text-center justify-between gap-3 transition-all ${
                          isOwned
                            ? 'cursor-pointer hover:border-[#1cb0f6]'
                            : 'opacity-50 cursor-not-allowed'
                        } ${isSelectedPreview ? 'ring-2 ring-[#1cb0f6] bg-[#f5faff] dark:bg-[#162334]' : ''}`}
                      >
                        <div className="w-20 h-20 flex items-center justify-center p-1 rounded-2xl bg-[#fbfdff] dark:bg-[#151f2b] relative">
                          <AvatarFrame borderId={item.id} size={64} />
                          {!isOwned && (
                            <div className="absolute inset-0 bg-slate-900/30 rounded-2xl flex items-center justify-center text-white">
                              <Lock size={18} />
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="font-black text-xs sm:text-sm text-[#1e3a5f] dark:text-[#e8f2ff]">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {isOwned ? (isEquipped ? 'Digunakan' : 'Dimiliki') : 'Terkunci'}
                          </span>
                        </div>

                        <div className="w-full pt-2 border-t border-[#f0f4f9] dark:border-[#24354a]">
                          {isOwned ? (
                            isEquipped ? (
                              <span className="inline-block px-3 py-1 rounded-lg bg-[#e6f7ec] text-[#22c55e] text-[10px] font-black">
                                Aktif
                              </span>
                            ) : (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEquip(item.id);
                                }}
                                className="w-full py-1.5 rounded-lg bg-[#e8f2ff] hover:bg-[#1cb0f6] text-[#2f4f7f] hover:text-white text-[11px] font-black transition-all"
                              >
                                Pakai
                              </button>
                            )
                          ) : (
                            <Link
                              to="/student/toko"
                              onClick={e => e.stopPropagation()}
                              className="text-[11px] font-bold text-[#1cb0f6] hover:underline"
                            >
                              Beli di Toko
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 06: PROGRES BELAJAR & STATISTIK */}
        {/* ======================================================== */}
        {tab === 'progres' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with Penguin Writing */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#ebf3fe] via-[#e2eefd] to-[#d7e8fc] dark:from-[#1b2737] dark:via-[#192434] dark:to-[#16202d] border border-[#dcebfa] dark:border-[#25374d] flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                  Progres Belajar
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                  Lihat perkembangan petualangan membacamu di sini!
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/student/peringkat')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#DCEBFA] text-xs font-bold text-[#304D70] hover:bg-white"
                >
                  Buka Papan Peringkat
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1f2d3d] flex items-center justify-center shrink-0 text-3xl shadow-xs">
                📝
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a] text-center">
                <span className="text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] block leading-none">
                  {completedCount}
                </span>
                <span className="text-xs font-bold text-[#8fa6c1] mt-1.5 block">Materi Selesai</span>
              </div>

              <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a] text-center">
                <span className="text-3xl font-black text-[#1cb0f6] block leading-none">
                  85%
                </span>
                <span className="text-xs font-bold text-[#8fa6c1] mt-1.5 block">Akurasi Jawaban</span>
              </div>

              <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a] text-center">
                <span className="text-3xl font-black text-[#9333ea] block leading-none">
                  26
                </span>
                <span className="text-xs font-bold text-[#8fa6c1] mt-1.5 block">Kalimat Bukti</span>
              </div>

              <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a] text-center">
                <span className="text-3xl font-black text-[#ff9600] block leading-none">
                  {progress.streak.count} Hari
                </span>
                <span className="text-xs font-bold text-[#8fa6c1] mt-1.5 block">Streak Membaca</span>
              </div>
            </div>

            {/* 2-Column: Weekly Activity Chart + Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Weekly Activity Bar Chart */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff] mb-1">
                  Grafik Aktivitas
                </h3>
                <span className="text-xs font-semibold text-[#8fa6c1] block mb-6">
                  Aktivitas membaca 7 hari terakhir
                </span>

                <div className="h-44 flex items-end justify-between gap-3 px-2 pt-6 pb-2 border-b border-[#e5edf7] dark:border-[#24354a]">
                  {[
                    { day: 'Sen', height: '65%' },
                    { day: 'Sel', height: '40%' },
                    { day: 'Rab', height: '80%' },
                    { day: 'Kam', height: '95%' },
                    { day: 'Jum', height: '70%' },
                    { day: 'Sab', height: '30%' },
                    { day: 'Min', height: '85%' },
                  ].map((bar, i) => (
                    <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        style={{ height: bar.height }}
                        className={`w-full max-w-[28px] rounded-t-xl transition-all duration-500 ${
                          i === 3
                            ? 'bg-[#1cb0f6] shadow-sm'
                            : 'bg-[#dcebfa] dark:bg-[#202f42] hover:bg-[#b9d7ef]'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-[#8fa6c1]">{bar.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pencapaian / Achievements List */}
              <div className="card-temukata p-6 dark:bg-[#182332] dark:border-[#24354a]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-base sm:text-lg text-[#1e3a5f] dark:text-[#e8f2ff]">
                    Pencapaian
                  </h3>
                  <span className="text-xs font-bold text-[#1cb0f6]">Lihat Semua &gt;</span>
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Pembaca Konsisten', desc: 'Membaca 3 hari berturut-turut.', icon: '🔥', done: true },
                    { title: 'Penjelajah Materi', desc: 'Menyelesaikan 10 materi bacaan.', icon: '📚', done: completedCount >= 10 },
                    { title: 'Analis Cermat', desc: 'Akurasi jawaban di atas 80%.', icon: '⭐', done: true },
                  ].map(ach => (
                    <div
                      key={ach.title}
                      className="p-3.5 rounded-2xl bg-[#f7f9fd] dark:bg-[#151f2b] border border-[#e5edf7] dark:border-[#24354a] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1f2d3d] flex items-center justify-center text-xl shrink-0 shadow-2xs">
                          {ach.icon}
                        </div>
                        <div>
                          <b className="text-xs font-black text-[#1e3a5f] dark:text-[#e8f2ff] block">
                            {ach.title}
                          </b>
                          <span className="text-[11px] font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                            {ach.desc}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-[#22c55e]">✓ Selesai</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 07: PROFIL / AKUN */}
        {/* ======================================================== */}
        {tab === 'akun' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] tracking-tight">
                Profil Saya
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                Kelola profil, hiasan avatar, dan preferensimu di TemuKata.
              </p>
            </div>

            {/* Profile Card with Equipped Border */}
            <div className="card-temukata p-6 sm:p-8 dark:bg-[#182332] dark:border-[#24354a] text-center sm:text-left flex flex-col sm:flex-row items-center gap-6">
              <div className="p-2 rounded-3xl bg-[#f7f9fd] dark:bg-[#151f2b] border border-[#e5edf7] dark:border-[#24354a] flex items-center justify-center shrink-0 shadow-xs">
                <AvatarFrame borderId={progress.equippedBorder || 'ice-dream'} size={96} />
              </div>

              <div className="flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-[#ebf3fe] dark:bg-[#1f2e42] text-[10px] font-black text-[#1cb0f6] uppercase tracking-wider mb-2">
                  Level 3: Pembaca Aktif
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1e3a5f] dark:text-[#e8f2ff]">
                  {profile?.display_name || 'Nathania'}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#5a7394] dark:text-[#9bb7d9] mt-0.5">
                  {user?.email || 'nathania@temukata.id'}
                </p>

                {/* Mini Stats Row */}
                <div className="mt-4 pt-4 border-t border-[#f0f4f9] dark:border-[#24354a] flex items-center justify-center sm:justify-start gap-6 text-center">
                  <div className="flex items-center gap-1.5">
                    <img src="/gem-diamond.svg" alt="Gem" className="w-5 h-5 object-contain" />
                    <span className="text-base font-black text-[#1cb0f6]">{progress.diamonds} Poin</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={17} className="text-[#3b82f6]" />
                    <span className="text-base font-black text-[#1e3a5f] dark:text-[#e8f2ff]">{completedCount} Materi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StreakFlame active={progress.streak.count > 0} size={20} />
                    <span className="text-base font-black text-[#ff9600]">{progress.streak.count} Streak</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu List */}
            <div className="card-temukata p-4 dark:bg-[#182332] dark:border-[#24354a] space-y-1.5">
              <button
                type="button"
                onClick={() => navigate('/student/koleksi')}
                className="w-full p-4 rounded-2xl hover:bg-[#f7f9fd] dark:hover:bg-[#151f2b] transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#ebf3fe] text-[#1cb0f6] flex items-center justify-center">
                    <Palette size={20} />
                  </div>
                  <div>
                    <b className="text-sm font-black text-[#1e3a5f] dark:text-[#e8f2ff] block">
                      Koleksi Saya
                    </b>
                    <span className="text-xs font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                      Lihat border dan hiasan avatar yang kamu miliki
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-[#1cb0f6]" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/student/toko')}
                className="w-full p-4 rounded-2xl hover:bg-[#f7f9fd] dark:hover:bg-[#151f2b] transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#fff8ed] text-amber-500 flex items-center justify-center">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <b className="text-sm font-black text-[#1e3a5f] dark:text-[#e8f2ff] block">
                      Toko TemuKata
                    </b>
                    <span className="text-xs font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                      Beli border dan kosmetik avatar baru dengan poin
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-[#1cb0f6]" />
              </button>

              <div className="w-full p-4 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#f0f5fc] text-[#3b82f6] flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <div>
                    <b className="text-sm font-black text-[#1e3a5f] dark:text-[#e8f2ff] block">
                      Pengaturan Akun
                    </b>
                    <span className="text-xs font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                      Atur preferensi suara dan profil belajar
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => sound.toggle()}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e2e42] border border-[#e5edf7] text-xs font-black text-[#2f4f7f]"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              <div className="w-full p-4 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#e6f7ec] text-[#22c55e] flex items-center justify-center">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <b className="text-sm font-black text-[#1e3a5f] dark:text-[#e8f2ff] block">
                      Bantuan & Panduan
                    </b>
                    <span className="text-xs font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                      Pusat bantuan dan panduan membaca literasi
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  void signOut();
                }}
                className="w-full p-4 rounded-2xl hover:bg-rose-50 text-rose-600 transition-all flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center">
                    <LogOut size={20} />
                  </div>
                  <div>
                    <b className="text-sm font-black text-rose-600 block">
                      Keluar
                    </b>
                    <span className="text-xs font-semibold text-rose-400">
                      Keluar dari akun TemuKata
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-rose-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
