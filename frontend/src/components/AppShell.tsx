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

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  badge?: string;
}

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
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('temukata_theme') === 'dark';
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
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('temukata_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('temukata_theme', 'light');
    }
  }

  function toggleSound() {
    const next = sound.toggle();
    setSoundOn(next);
  }

  const teacherNav: NavItem[] = [
    { to: '/teacher', label: 'Dashboard Admin', icon: <LayoutDashboard size={20} strokeWidth={2.2} />, end: true },
    { to: '/teacher/lessons/new', label: 'Buat Bacaan & Soal', icon: <Plus size={20} strokeWidth={2.2} /> },
    { to: '/teacher/results', label: 'Nilai & Evaluasi Murid', icon: <Users size={20} strokeWidth={2.2} /> },
  ];

  const studentNav: NavItem[] = [
    { to: '/student', label: 'Beranda', icon: <Home size={20} strokeWidth={2.2} />, end: true },
    { to: '/student/materi', label: 'Materi', icon: <BookOpen size={20} strokeWidth={2.2} /> },
    { to: '/student/toko', label: 'Toko', icon: <ShoppingBag size={20} strokeWidth={2.2} />, badge: 'Baru' },
    { to: '/student/progres', label: 'Progres', icon: <BarChart2 size={20} strokeWidth={2.2} /> },
    { to: '/student/akun', label: 'Akun', icon: <User size={20} strokeWidth={2.2} /> },
  ];

  const nav: NavItem[] = teacher ? teacherNav : studentNav;

  // Active check helper
  function isItemActive(itemTo: string, isEnd?: boolean) {
    if (isEnd) {
      return location.pathname === itemTo && !location.search;
    }
    return location.pathname.startsWith(itemTo);
  }

  return (
    <div className="min-h-screen bg-transparent dark:bg-[#111C2B] flex flex-col pb-24 md:pb-8 text-[#304D70] dark:text-[#F0F6FF] antialiased transition-colors duration-250 relative">

      {/* Top Floating Header Bar */}
      <header className="sticky top-0 z-40 bg-transparent px-4 py-3 sm:px-8 transition-colors duration-250">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          {/* Logo on Mobile (On desktop, logo is at top of the clean sidebar) */}
          <NavLink
            to={teacher ? '/teacher' : '/student'}
            onClick={() => sound.playPop()}
            className="flex md:hidden items-center gap-2.5 p-1.5 px-3 rounded-2xl bg-white/90 dark:bg-[#1C2A3C]/90 backdrop-blur-md border border-[#E2EDF8] dark:border-[#34475E] shadow-2xs group select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E8F2FC] dark:bg-[#21334A] overflow-hidden flex items-center justify-center">
              <MascotIcon size={28} />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#304D70] dark:text-[#F0F6FF] block leading-none">
                TemuKata
              </span>
            </div>
          </NavLink>
          <div className="hidden md:block" />

          {/* Gamified HUD: Floating Clean Badges for Streak, Diamonds, & Theme Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 ml-auto">
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1C2A3C]/95 backdrop-blur-sm border border-[#E2EDF8] dark:border-[#34475E] shadow-2xs hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none"
                    >
                      <StreakFlame active={streakActive} size={20} />
                      <span
                        className={`font-black text-sm sm:text-base leading-none tracking-tight ${
                          streakActive ? 'text-[#ff9600]' : 'text-[#526F92] dark:text-[#C0D1E5]'
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1C2A3C]/95 backdrop-blur-sm border border-[#E2EDF8] dark:border-[#34475E] shadow-2xs select-none"
                >
                  <img
                    src="/gem-diamond.svg"
                    alt="Permata"
                    style={{ width: 19, height: 19 }}
                    className="object-contain inline-block shrink-0 select-none"
                    draggable={false}
                  />
                  <span className="font-black text-sm sm:text-base leading-none tracking-tight text-[#0284C7] dark:text-[#8DBBE8]">
                    {progress.diamonds}
                  </span>
                </div>
              </>
            )}

            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={darkMode ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
              className="w-9 h-9 rounded-full bg-white/95 dark:bg-[#1C2A3C]/95 backdrop-blur-sm border border-[#E2EDF8] dark:border-[#34475E] text-[#304D70] dark:text-[#F8DF9B] shadow-2xs hover:scale-105 transition-all active:scale-90 flex items-center justify-center cursor-pointer"
            >
              {darkMode ? (
                <Sun size={17} className="text-[#F8DF9B] fill-[#F8DF9B] transition-transform duration-200" />
              ) : (
                <Moon size={17} className="text-[#304D70] fill-[#304D70] transition-transform duration-200" />
              )}
            </button>

            {/* Sound Toggle (Icon) */}
            <button
              type="button"
              onClick={toggleSound}
              title={soundOn ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="hidden sm:flex w-9 h-9 rounded-full bg-white/95 dark:bg-[#1C2A3C]/95 backdrop-blur-sm border border-[#E2EDF8] dark:border-[#34475E] text-[#526F92] dark:text-[#C0D1E5] shadow-2xs hover:bg-[#FFF8ED] dark:hover:bg-[#21334A] transition-transform active:scale-90 items-center justify-center cursor-pointer"
            >
              {soundOn ? <Volume2 size={16} className="text-[#304D70] dark:text-[#8DBBE8]" /> : <VolumeX size={16} />}
            </button>

            {/* User Profile Avatar with Equipped Border / Logout */}
            {profile && (
              <div className="flex items-center gap-2 pl-1 sm:pl-2">
                <NavLink
                  to={teacher ? '/teacher' : '/student/akun'}
                  title={profile?.display_name || 'Akun'}
                  className="hover:scale-105 active:scale-95 transition-transform inline-block drop-shadow-xs"
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
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container with Permanent Clean Left Sidebar for Desktop */}
      <div className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-8 pt-6 grid md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
        {/* Left Sidebar (Desktop Only) - Clean Card as in Reference */}
        <aside className="hidden md:flex flex-col sticky top-20 w-full shrink-0">
          <div className="bg-[#FFFFFF] dark:bg-[#1C2A3C] border border-[#E2EDF8] dark:border-[#34475E] rounded-3xl p-4 shadow-sm flex flex-col justify-between overflow-hidden transition-colors duration-250">
            {/* Top Section: Logo & Nav items */}
            <div>
              {/* Logo TemuKata at top of Sidebar */}
              <NavLink
                to={teacher ? '/teacher' : '/student'}
                onClick={() => sound.playPop()}
                className="flex items-center gap-2.5 px-2 pt-1 pb-4 group select-none"
              >
                <img
                  src="/temukata-penguin.svg"
                  alt="TemuKata Mascot"
                  className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
                />
                <span className="text-xl font-black tracking-tight text-[#304D70] dark:text-[#F0F6FF] leading-none">
                  TemuKata
                </span>
              </NavLink>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {nav.map(item => {
                  const active = isItemActive(item.to, item.end);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => sound.playPop()}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-sm transition-all select-none ${
                        active
                          ? 'bg-[#E8F2FC] dark:bg-[#21334A] text-[#304D70] dark:text-[#8DBBE8] font-black'
                          : 'text-[#526F92] dark:text-[#C0D1E5] hover:bg-[#F0F7FD] dark:hover:bg-[#21334A]/50 hover:text-[#304D70] dark:hover:text-[#F0F6FF]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={active ? 'text-[#304D70] dark:text-[#8DBBE8]' : 'text-[#8DB4D8] dark:text-[#C0D1E5]'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#FF8FB1] dark:bg-[#ECAAB9] text-white dark:text-[#111C2B] text-[10px] font-black tracking-wider">
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Section: Integrated Nature Meadow & Daisies */}
            <div className="relative w-full h-28 -mx-4 -mb-4 pointer-events-none select-none overflow-hidden mt-6">
              <svg viewBox="0 0 240 120" className="w-full h-full" preserveAspectRatio="none">
                {/* Soft pastel blue rolling hill/cloud backdrop */}
                <path d="M0,120 L0,68 Q60,48 130,60 Q190,46 240,74 L240,120 Z" fill="#DCEBFA" />
                {/* Back green hill */}
                <path d="M0,120 L0,84 Q60,68 130,76 Q190,64 240,92 L240,120 Z" fill="#9CD872" />
                {/* Front lush green hill */}
                <path d="M0,120 L0,98 Q70,84 150,92 Q200,84 240,106 L240,120 Z" fill="#7EC44F" />

                {/* Left Daisy with 5 rounded white petals */}
                <g transform="translate(76, 78)">
                  {[0, 72, 144, 216, 288].map(deg => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <ellipse
                        key={deg}
                        cx={8.5 * Math.cos(rad)}
                        cy={8.5 * Math.sin(rad)}
                        rx="6.5"
                        ry="5.5"
                        transform={`rotate(${deg}, ${8.5 * Math.cos(rad)}, ${8.5 * Math.sin(rad)})`}
                        fill="#FFFFFF"
                      />
                    );
                  })}
                  <circle cx="0" cy="0" r="5.5" fill="#F59E0B" />
                  <circle cx="0" cy="0" r="4.5" fill="#FBBF24" />
                </g>

                {/* Right Daisy */}
                <g transform="translate(150, 88)">
                  {[0, 72, 144, 216, 288].map(deg => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <ellipse
                        key={deg}
                        cx={7 * Math.cos(rad)}
                        cy={7 * Math.sin(rad)}
                        rx="5.5"
                        ry="4.5"
                        transform={`rotate(${deg}, ${7 * Math.cos(rad)}, ${7 * Math.sin(rad)})`}
                        fill="#FFFFFF"
                      />
                    );
                  })}
                  <circle cx="0" cy="0" r="4.5" fill="#F59E0B" />
                  <circle cx="0" cy="0" r="3.5" fill="#FBBF24" />
                </g>
              </svg>
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="min-w-0 w-full">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar (4 Main Tabs + Toko) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF]/95 dark:bg-[#1C2A3C]/95 backdrop-blur-lg border-t border-[#E4E8ED] dark:border-[#34475E] px-3 py-2 flex items-center justify-around shadow-lg transition-colors duration-250">
        {nav.map(item => {
          const active = isItemActive(item.to, item.end);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => sound.playPop()}
              className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-2xl transition-transform active:scale-95 ${
                active ? 'text-[#304D70] dark:text-[#8DBBE8]' : 'text-[#526F92] dark:text-[#C0D1E5]'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors relative ${
                  active ? 'bg-[#E8F2FC] dark:bg-[#21334A] text-[#304D70] dark:text-[#8DBBE8]' : 'bg-transparent'
                }`}
              >
                {item.icon}
                {item.badge ? (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF8FB1] dark:bg-[#ECAAB9] ring-2 ring-white dark:ring-[#1C2A3C]" />
                ) : null}
              </div>
              <span className={`text-[10px] ${active ? 'font-black' : 'font-bold'}`}>
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
