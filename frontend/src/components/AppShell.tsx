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
import LandscapeFooter from './LandscapeFooter';
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
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#131b26] flex flex-col pb-20 md:pb-0 text-[#304D70] dark:text-[#d3e3f8] antialiased">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#F8F7F2]/95 dark:bg-[#131b26]/90 backdrop-blur-md border-b border-[#E4E8ED] dark:border-[#223044] px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          {/* Logo on Left */}
          <NavLink
            to={teacher ? '/teacher' : '/student'}
            onClick={() => sound.playPop()}
            className="flex items-center gap-2.5 group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1e2e42] border border-[#E4E8ED] dark:border-[#2b415e] overflow-hidden flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105 group-active:scale-95">
              <MascotIcon size={34} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#304D70] dark:text-[#e8f2ff] block leading-none">
                TemuKata
              </span>
            </div>
          </NavLink>

          {/* Gamified HUD: Streak, Diamonds, Theme & Sound */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {!teacher && (
              <>
                {/* Streak Counter Capsule */}
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
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#1a2533] border border-[#E4E8ED] dark:border-[#2b3d54] shadow-2xs hover:bg-[#FAF8F5] transition-all cursor-pointer select-none active:scale-95"
                    >
                      <StreakFlame active={streakActive} size={22} />
                      <span className="font-bold text-sm sm:text-base text-[#304D70] dark:text-[#e8f2ff] leading-none">
                        {progress.streak.count}
                      </span>
                    </button>
                  );
                })()}

                {/* Diamonds Counter Capsule */}
                <div
                  title={`${progress.diamonds} Permata Membaca`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#1a2533] border border-[#E4E8ED] dark:border-[#2b3d54] shadow-2xs select-none"
                >
                  <img
                    src="/gem-diamond.svg"
                    alt="Permata"
                    style={{ width: 20, height: 20 }}
                    className="object-contain inline-block shrink-0 select-none"
                    draggable={false}
                  />
                  <span className="font-bold text-sm sm:text-base text-[#304D70] dark:text-[#e8f2ff] leading-none">
                    {progress.diamonds}
                  </span>
                </div>
              </>
            )}

            {/* Dark / Light Mode Circle Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#1a2533] border border-[#E4E8ED] dark:border-[#2b3d54] text-[#304D70] dark:text-[#a5c7f2] shadow-2xs hover:bg-[#FAF8F5] dark:hover:bg-[#202f42] transition-transform active:scale-90 flex items-center justify-center cursor-pointer"
            >
              {darkMode ? <Sun size={16} className="text-amber-400 fill-amber-400" /> : <Moon size={16} className="text-[#304D70] fill-[#304D70]" />}
            </button>

            {/* Sound Circle Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              title={soundOn ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="hidden sm:flex w-9 h-9 rounded-full bg-white dark:bg-[#1a2533] border border-[#E4E8ED] dark:border-[#2b3d54] text-[#304D70] dark:text-slate-400 shadow-2xs hover:bg-[#FAF8F5] dark:hover:bg-[#202f42] transition-transform active:scale-90 items-center justify-center cursor-pointer"
            >
              {soundOn ? <Volume2 size={16} className="text-[#304D70] dark:text-[#a5c7f2]" /> : <VolumeX size={16} />}
            </button>

            {/* User Profile Initial (Mobile) / Logout */}
            {profile && (
              <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l border-[#E4E8ED] dark:border-[#26374d]">
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
      <div className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-8 pt-6 grid md:grid-cols-[230px_minmax(0,1fr)] gap-7 items-start">
        {/* Left Sidebar (Desktop Only) */}
        <aside className="hidden md:flex flex-col gap-3 sticky top-22">
          <div className="bg-[#FFF8ED] dark:bg-[#182332] border border-[#EFE8DC] dark:border-[#24354a] rounded-3xl p-3.5 space-y-1.5 shadow-[0_4px_16px_rgba(48,77,112,0.03)] relative overflow-hidden">
            {nav.map(item => {
              const active = isItemActive(item.to, item.end);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => sound.playPop()}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-sm transition-all select-none ${
                    active
                      ? 'bg-[#DCEBFA] dark:bg-[#1e2e42] text-[#304D70] dark:text-[#a5c7f2] font-bold shadow-2xs'
                      : 'text-[#526F92] dark:text-slate-400 hover:bg-[#FFF3DF] dark:hover:bg-[#1c293c] hover:text-[#304D70]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={active ? 'text-[#304D70] dark:text-[#a5c7f2]' : 'text-[#526F92] dark:text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {'badge' in item && (item as any).badge && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F5B9C4] text-[#832637] font-bold text-[10px] uppercase tracking-wider">
                      {(item as any).badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Botanical Leaf Sprig Framing Bottom of Sidebar */}
            <div className="pt-6 pb-1 pointer-events-none select-none flex justify-start pl-2 opacity-85">
              <svg width="45" height="50" viewBox="0 0 45 50" fill="none">
                <path d="M5,48 C10,32 18,18 36,8" stroke="#7BAA6D" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M14,35 C11,26 17,20 25,18 C27,26 21,33 14,35 Z" fill="#8DB97F" />
                <path d="M22,22 C30,14 39,12 43,18 C40,25 31,27 22,22 Z" fill="#A0C992" />
                <path d="M35,8 C33,2 40,-2 46,2 C46,9 41,12 35,8 Z" fill="#7BAA6D" />
              </svg>
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="min-w-0 w-full">{children}</main>
      </div>

      {/* Landscape Vector Framing Bottom of Page */}
      <LandscapeFooter />

      {/* Mobile Bottom Navigation Bar (5 Main Tabs) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFF8ED]/95 dark:bg-[#131b26]/95 backdrop-blur-lg border-t border-[#EFE8DC] dark:border-[#223044] px-3 py-2 flex items-center justify-around shadow-lg">
        {nav.map(item => {
          const active = isItemActive(item.to, item.end);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => sound.playPop()}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-transform active:scale-95 ${
                active ? 'text-[#304D70] dark:text-[#a5c7f2]' : 'text-[#8FA6C1] hover:text-[#304D70]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  active ? 'bg-[#DCEBFA] dark:bg-[#1e2e42] text-[#304D70] dark:text-[#a5c7f2]' : 'bg-transparent text-[#8FA6C1]'
                }`}
              >
                {item.icon}
              </div>
              <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>
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
