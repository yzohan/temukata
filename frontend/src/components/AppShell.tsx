import { useEffect, useState } from 'react';
import {
  BarChart2,
  BookOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  ShoppingBag,
  Sun,
  User,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import StreakModal from './StreakModal';
import StreakFlame, { isStreakActiveToday } from './StreakFlame';
import { MascotIcon } from './Mascot';
import AvatarFrame from './AvatarFrame';
import { useAuth } from '../auth/AuthProvider';
import { getUserProgress, subscribeProgress } from '../lib/gamification';
import { sound } from '../lib/sounds';
import type { ReactNode } from 'react';

export default function AppShell({
  mode,
  children,
}: {
  mode: 'student' | 'teacher';
  children: ReactNode;
}) {
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
    { to: '/teacher', label: 'Dashboard Admin', icon: <LayoutDashboard size={20} strokeWidth={2.2} />, end: true },
    { to: '/teacher/lessons/new', label: 'Buat Bacaan & Soal', icon: <Plus size={20} strokeWidth={2.2} /> },
    { to: '/teacher/results', label: 'Nilai & Evaluasi Murid', icon: <Users size={20} strokeWidth={2.2} /> },
  ];

  const studentNav = [
    { to: '/student', label: 'Beranda', icon: <Home size={20} strokeWidth={2.2} />, end: true },
    { to: '/student/materi', label: 'Materi', icon: <BookOpen size={20} strokeWidth={2.2} /> },
    { to: '/student/toko', label: 'Toko', icon: <ShoppingBag size={20} strokeWidth={2.2} />, badge: 'Baru' },
    { to: '/student/progres', label: 'Progres', icon: <BarChart2 size={20} strokeWidth={2.2} /> },
    { to: '/student/akun', label: 'Akun', icon: <User size={20} strokeWidth={2.2} /> },
  ];

  const nav = teacher ? teacherNav : studentNav;

  // Active check helper
  function isItemActive(itemTo: string, isEnd?: boolean) {
    if (isEnd) {
      return location.pathname === itemTo && !location.search;
    }
    return location.pathname.startsWith(itemTo);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fd] dark:bg-[#131b26] flex flex-col pb-24 md:pb-8 text-[#2f4f7f] dark:text-[#d3e3f8] antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#f7f9fd]/90 dark:bg-[#131b26]/90 backdrop-blur-md border-b border-[#e5edf7] dark:border-[#223044] px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          {/* Logo on Mobile or Teacher (On desktop, sidebar also has it) */}
          <NavLink
            to={teacher ? '/teacher' : '/student'}
            onClick={() => sound.playPop()}
            className="flex items-center gap-2.5 group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#e8f2ff] dark:bg-[#1e2e42] border border-[#dcebfa] dark:border-[#2b415e] overflow-hidden flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 group-active:scale-95">
              <MascotIcon size={34} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#1e3a5f] dark:text-[#e8f2ff] block leading-none">
                TemuKata
              </span>
            </div>
          </NavLink>

          {/* Gamified HUD: Streak, Diamonds, & Theme Toggle */}
          <div className="flex items-center gap-4 sm:gap-6">
            {!teacher && (
              <>
                {/* Streak Counter Button */}
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

                {/* Diamonds Counter */}
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
              </>
            )}

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className="w-9 h-9 rounded-2xl bg-white dark:bg-[#1a2533] border border-[#e5edf7] dark:border-[#26374d] text-[#2f4f7f] dark:text-[#a5c7f2] shadow-xs hover:bg-[#f0f5fc] dark:hover:bg-[#202f42] transition-transform active:scale-90 flex items-center justify-center"
            >
              {darkMode ? <Sun size={17} className="text-amber-400 fill-amber-400" /> : <Moon size={17} className="text-[#2f4f7f] fill-[#2f4f7f]" />}
            </button>

            {/* Sound Toggle (Icon) */}
            <button
              type="button"
              onClick={toggleSound}
              title={soundOn ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="hidden sm:flex w-9 h-9 rounded-2xl bg-white dark:bg-[#1a2533] border border-[#e5edf7] dark:border-[#26374d] text-[#5a7394] dark:text-slate-400 shadow-xs hover:bg-[#f0f5fc] dark:hover:bg-[#202f42] transition-transform active:scale-90 items-center justify-center"
            >
              {soundOn ? <Volume2 size={17} className="text-[#2f4f7f] dark:text-[#a5c7f2]" /> : <VolumeX size={17} />}
            </button>

            {/* User Profile Initial (Mobile) / Logout */}
            {profile && (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l border-[#e5edf7] dark:border-[#26374d]">
                <NavLink
                  to={teacher ? '/teacher' : '/student/akun'}
                  title={profile?.display_name || 'Akun'}
                  className="hover:scale-105 active:scale-95 transition-transform"
                >
                  <AvatarFrame
                    borderId={progress.equippedBorder || 'ice-dream'}
                    size={38}
                    initial={(profile?.display_name || 'U').slice(0, 1).toUpperCase()}
                  />
                </NavLink>

                {teacher && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      void signOut();
                    }}
                    title="Keluar"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container with Permanent Left Sidebar for Desktop */}
      <div className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-8 pt-6 grid md:grid-cols-[240px_minmax(0,1fr)] gap-8 items-start">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden md:flex flex-col gap-3 sticky top-24">
          <div className="card-temukata p-3 space-y-1.5 dark:bg-[#182332] dark:border-[#24354a]">
            {nav.map(item => {
              const active = isItemActive(item.to, item.end);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => sound.playPop()}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all select-none ${
                    active
                      ? 'bg-[#e8f2ff] dark:bg-[#1e2e42] text-[#2f4f7f] dark:text-[#a5c7f2] font-black'
                      : 'text-[#5a7394] dark:text-slate-400 hover:bg-[#f7f9fd] dark:hover:bg-[#1c293c] hover:text-[#2f4f7f]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={active ? 'text-[#2f4f7f] dark:text-[#a5c7f2]' : 'text-[#8fa6c1] dark:text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {'badge' in item && (item as any).badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[#f5b9c4] text-[#832637] font-black text-[10px] uppercase tracking-wider">
                      {(item as any).badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </aside>

        {/* Page Content */}
        <main className="min-w-0 w-full">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar (4 Main Tabs) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#131b26]/95 backdrop-blur-lg border-t border-[#e5edf7] dark:border-[#223044] px-4 py-2 flex items-center justify-around shadow-lg">
        {nav.map(item => {
          const active = isItemActive(item.to, item.end);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => sound.playPop()}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-transform active:scale-95 ${
                active ? 'text-[#2f4f7f] dark:text-[#a5c7f2]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  active ? 'bg-[#e8f2ff] dark:bg-[#1e2e42] text-[#2f4f7f] dark:text-[#a5c7f2]' : 'bg-transparent text-slate-400'
                }`}
              >
                {item.icon}
              </div>
              <span className={`text-[11px] ${active ? 'font-black' : 'font-bold'}`}>
                {item.label}
              </span>
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
