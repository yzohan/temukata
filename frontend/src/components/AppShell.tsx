import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  Plus,
  Sun,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import StreakModal from './StreakModal';
import StreakFlame, { isStreakActiveToday } from './StreakFlame';
import { MascotIcon } from './Mascot';
import { useAuth } from '../auth/AuthProvider';
import { getUserProgress, subscribeProgress } from '../lib/gamification';
import { sound } from '../lib/sounds';
import type { ReactNode } from 'react';

export default function AppShell({ mode, children }: { mode: 'student' | 'teacher'; children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const teacher = mode === 'teacher';

  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [progress, setProgress] = useState(getUserProgress());
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('temukata_theme') === 'dark';
  });

  useEffect(() => {
    const unsubscribe = subscribeProgress(setProgress);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('temukata_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('temukata_theme', 'light');
    }
  }, [darkMode]);

  function toggleTheme() {
    sound.playPop();
    setDarkMode(prev => !prev);
  }

  function toggleSound() {
    const next = sound.toggle();
    setSoundOn(next);
  }

  const teacherNav = [
    { to: '/teacher', label: 'Dashboard Admin', icon: <LayoutDashboard size={20} />, end: true },
    { to: '/teacher/lessons/new', label: 'Buat Bacaan & Soal', icon: <Plus size={20} /> },
    { to: '/teacher/results', label: 'Nilai & Evaluasi Murid', icon: <Users size={20} /> },
  ];

  const studentNav = [
    { to: '/student', label: 'Peta Belajar', icon: <MapPin size={20} />, end: true },
    { to: '/student?tab=library', label: 'Daftar Bacaan', icon: <BookOpen size={20} /> },
    { to: '/student?tab=leaderboard', label: 'Papan Juara', icon: <Award size={20} /> },
  ];

  const nav = teacher ? teacherNav : studentNav;

  return (
    <div className="min-h-screen bg-[#f6f3ed] flex flex-col pb-20 md:pb-6 text-[#2c3848]">
      {/* Top Navbar in Warm Cream & Pastel Blue Accent */}
      <header className="sticky top-0 z-40 bg-[#fdfcf9]/95 backdrop-blur-md border-b-2 border-[#e7e2d8] px-4 py-2.5 sm:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          {/* Logo & Kawaii Pastel Mascot */}
          <NavLink
            to={teacher ? '/teacher' : '/student'}
            onClick={() => sound.playPop()}
            className="flex items-center gap-2.5 group select-none"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#e7e2d8] overflow-hidden flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 group-active:scale-95">
              <MascotIcon size={42} />
            </div>
            <div>
              <span className="text-lg md:text-xl font-black tracking-tight text-[#2c3848] block leading-none">
                TemuKata
              </span>
            </div>
          </NavLink>

          {/* Gamified HUD: Streak & Diamonds (Duolingo Style: Clean, Borderless, Aligned) */}
          {!teacher && (
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Streak Tracker Button */}
              {(() => {
                const streakActive = isStreakActiveToday(progress.streak);
                return (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setShowStreakModal(true);
                    }}
                    title={
                      streakActive
                        ? `Streak aktif: ${progress.streak.count} hari berturut-turut!`
                        : 'Streak belum aktif hari ini (selesaikan 1 bacaan untuk menyalakan api)'
                    }
                    className="flex items-center gap-2 p-1 rounded-xl transition-transform hover:opacity-85 active:scale-95 cursor-pointer select-none"
                  >
                    <StreakFlame active={streakActive} size={28} />
                    <span
                      className={`font-black text-base sm:text-lg leading-none tracking-tight ${
                        streakActive ? 'text-[#ff9600]' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {progress.streak.count}
                    </span>
                  </button>
                );
              })()}

              {/* Diamonds Balance */}
              <div
                title={`${progress.diamonds} Permata Membaca`}
                className="flex items-center gap-2 p-1 select-none"
              >
                <img
                  src="/gem-diamond.svg"
                  alt="Permata"
                  style={{ width: 28, height: 28 }}
                  className="object-contain inline-block shrink-0 select-none"
                  draggable={false}
                />
                <span className="font-black text-base sm:text-lg leading-none tracking-tight text-[#1cb0f6]">
                  {progress.diamonds}
                </span>
              </div>
            </div>
          )}

          {/* Right Controls: Dark/Light Mode, Sound, & User Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl border-2 border-[#e7e2d8] bg-white hover:bg-[#faf8f4] text-[#2c3848] transition-transform active:scale-90 flex items-center gap-1.5 text-xs font-bold shadow-sm"
            >
              {darkMode ? (
                <>
                  <Sun size={17} className="text-amber-400 fill-amber-400" />
                  <span className="hidden sm:inline">Terang</span>
                </>
              ) : (
                <>
                  <Moon size={17} className="text-[#92b4d2] fill-[#92b4d2]" />
                  <span className="hidden sm:inline">Gelap</span>
                </>
              )}
            </button>

            {/* Sound Toggle (Icon) */}
            <button
              type="button"
              onClick={toggleSound}
              title={soundOn ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="p-2 sm:px-2.5 sm:py-2 rounded-2xl border-2 border-[#e7e2d8] bg-white hover:bg-[#faf8f4] text-slate-600 transition-transform active:scale-90 flex items-center gap-1 text-xs font-bold"
            >
              {soundOn ? <Volume2 size={17} className="text-[#92b4d2]" /> : <VolumeX size={17} className="text-slate-400" />}
              <span className="hidden xl:inline">{soundOn ? 'Suara' : 'Mute'}</span>
            </button>

            {/* Chibi User Initial Badge & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l-2 border-[#e7e2d8]">
              <div
                title={profile?.display_name || 'Pengguna'}
                className="w-9 h-9 rounded-2xl bg-[#edf5fc] border-2 border-[#d3e5f5] text-[#4a6b8c] font-black text-sm flex items-center justify-center shadow-sm select-none"
              >
                {(profile?.display_name || 'E').slice(0, 1).toUpperCase()}
              </div>

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  void signOut();
                }}
                title="Keluar"
                className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 pt-5 grid md:grid-cols-[250px_minmax(0,1fr)] gap-6 items-start">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col gap-4 sticky top-20">
          {/* Navigation Links */}
          <div className="card-duo p-3 space-y-1 bg-white">
            {nav.map(item => {
              const active = location.pathname === item.to || (location.pathname + location.search) === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => sound.playPop()}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-black text-sm transition-all ${
                    active
                      ? 'bg-[#edf5fc] text-[#4a6b8c] border-2 border-[#d3e5f5]'
                      : 'text-slate-600 hover:bg-[#faf8f4] border-2 border-transparent'
                  }`}
                >
                  <span className={active ? 'text-[#92b4d2]' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Daily Streak Card */}
          {!teacher && (() => {
            const streakActive = isStreakActiveToday(progress.streak);
            return (
              <div
                onClick={() => {
                  sound.playPop();
                  setShowStreakModal(true);
                }}
                className={`card-duo p-4 text-white cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${
                  streakActive
                    ? 'bg-gradient-to-br from-[#f8be8c] to-[#f5a65b] border-[#db8a3d]'
                    : 'bg-gradient-to-br from-slate-400 to-slate-500 border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest uppercase text-white/90">
                    {streakActive ? 'STREAK AKTIF HARI INI 🔥' : 'BELUM AKTIF HARI INI ⏳'}
                  </span>
                  <StreakFlame active={streakActive} size={30} />
                </div>
                <p className="mt-2 text-sm font-extrabold leading-snug">
                  {streakActive
                    ? `${progress.streak.count} Hari Beruntun! Target harian tercapai.`
                    : progress.streak.count > 0
                    ? `Pertahankan ${progress.streak.count} hari streakmu! Selesaikan 1 bacaan hari ini.`
                    : 'Mulai streak pertamamu! Selesaikan 1 bacaan hari ini.'}
                </p>
              </div>
            );
          })()}

          {/* Calming Aesthetic Reading Principle */}
          <div className="card-duo p-4 bg-[#fdfcf9] border-[#e7e2d8] text-[#2c3848]">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <span className="text-xs font-black uppercase tracking-wider text-[#92b4d2]">
                Catatan Membaca
              </span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">
              "Kunci jawaban berada di dalam teks. Luangkan waktu untuk memahami konteks dan menemukan kalimat bukti dengan teliti."
            </p>
          </div>
        </aside>

        {/* Page Content */}
        <main className="min-w-0 w-full">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#fdfcf9]/95 backdrop-blur-lg border-t-2 border-[#e7e2d8] px-3 py-2 flex items-center justify-around shadow-lg">
        {nav.map(item => {
          const active = location.pathname === item.to || (location.pathname + location.search) === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => sound.playPop()}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
                active ? 'text-[#92b4d2] scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl ${
                  active ? 'bg-[#edf5fc] border border-[#d3e5f5]' : 'bg-transparent'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] font-black">{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Streak Calendar Modal */}
      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        streak={progress.streak}
      />
    </div>
  );
}
