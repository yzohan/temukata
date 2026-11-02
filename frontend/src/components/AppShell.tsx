import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  LogOut,
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
import AvatarFrame from './AvatarFrame';
import LandscapeFooter from './LandscapeFooter';
import { useAuth } from '../auth/AuthProvider';
import { getUserProgress, subscribeProgress } from '../lib/gamification';
import { sound } from '../lib/sounds';
import type { ReactNode } from 'react';

// ============================================================================
// DUOLINGO-STYLE VIBRANT 3D ICONS
// ============================================================================

// 1. Birdhouse (Beranda / Learn)
function DuolingoBirdhouseIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0 transition-transform group-hover:scale-105`} viewBox="0 0 36 36" fill="none">
      {/* Gable Roof */}
      <path d="M18 3L2 16H34L18 3Z" fill="#FF4B4B" />
      <path d="M18 5.5L5.5 15.5H30.5L18 5.5Z" fill="#FF6B6B" />
      {/* House Body */}
      <rect x="6" y="16" width="24" height="16" rx="3" fill="#E5A500" />
      <rect x="7.5" y="16" width="21" height="14.5" rx="2" fill="#FFC800" />
      {/* Entrance Hole */}
      <circle cx="18" cy="22.5" r="4.2" fill="#3C2A1E" />
      <circle cx="18" cy="22.5" r="3.2" fill="#20150F" />
      {/* Perch Peg */}
      <rect x="16.5" y="27.5" width="3" height="2.5" rx="1" fill="#FF9600" />
    </svg>
  );
}

// 2. Cyan Dumbbell (Materi / Practice)
function DuolingoDumbbellIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0 transition-transform group-hover:scale-105`} viewBox="0 0 36 36" fill="none">
      <g transform="rotate(-35 18 18)">
        {/* Central Bar */}
        <rect x="11" y="15.5" width="14" height="5" rx="2" fill="#0284C7" />
        <rect x="12" y="16.5" width="12" height="2" rx="1" fill="#7DD3FC" />
        {/* Left Big Disc */}
        <rect x="7" y="10" width="5" height="16" rx="2.5" fill="#0284C7" />
        <rect x="8" y="11" width="3.5" height="14" rx="1.5" fill="#0EA5E9" />
        {/* Left Small Outer Cap */}
        <rect x="3.5" y="12.5" width="3.5" height="11" rx="1.5" fill="#0284C7" />
        <rect x="4.5" y="13.5" width="2" height="9" rx="1" fill="#38BDF8" />
        {/* Right Big Disc */}
        <rect x="24" y="10" width="5" height="16" rx="2.5" fill="#0284C7" />
        <rect x="24.5" y="11" width="3.5" height="14" rx="1.5" fill="#0EA5E9" />
        {/* Right Small Outer Cap */}
        <rect x="29" y="12.5" width="3.5" height="11" rx="1.5" fill="#0284C7" />
        <rect x="29.5" y="13.5" width="2" height="9" rx="1" fill="#38BDF8" />
      </g>
    </svg>
  );
}

// 3. Canopy Shop Stall (Toko / Shop)
function DuolingoShopIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0 transition-transform group-hover:scale-105`} viewBox="0 0 36 36" fill="none">
      {/* Stall Wall */}
      <rect x="7" y="20" width="22" height="12" rx="2" fill="#92400E" />
      <rect x="8.5" y="21.5" width="19" height="9" rx="1.5" fill="#451A03" />
      {/* Counter Ledge */}
      <rect x="6" y="28" width="24" height="4" rx="2" fill="#B45309" />
      {/* Awning */}
      <path d="M5 8L8 19H28L31 8H5Z" fill="#EF4444" />
      <path d="M10.5 8L12.5 19H16.5L15 8H10.5Z" fill="#FFFFFF" />
      <path d="M21 8L19.5 19H23.5L25.5 8H21Z" fill="#FFFFFF" />
      {/* Scallops */}
      <circle cx="8" cy="19.5" r="2.2" fill="#DC2626" />
      <circle cx="12.5" cy="19.5" r="2.2" fill="#F3F4F6" />
      <circle cx="17" cy="19.5" r="2.2" fill="#DC2626" />
      <circle cx="21.5" cy="19.5" r="2.2" fill="#F3F4F6" />
      <circle cx="26" cy="19.5" r="2.2" fill="#DC2626" />
      <circle cx="29" cy="19.5" r="2" fill="#DC2626" />
    </svg>
  );
}

// 4. Golden Shield (Progres / Leaderboard)
function DuolingoShieldIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg className={`${className} shrink-0 transition-transform group-hover:scale-105`} viewBox="0 0 36 36" fill="none">
      {/* Shield Base */}
      <path d="M6 5C6 5 15 4 18 2C21 4 30 5 30 5V19C30 26.5 18 34 18 34C18 34 6 26.5 6 19V5Z" fill="#D97706" />
      {/* Left Golden Half */}
      <path d="M7.5 6.5C7.5 6.5 15.5 5.5 18 3.5V31.5C18 31.5 7.5 24.5 7.5 18V6.5Z" fill="#F59E0B" />
      {/* Right Golden Half (Shining) */}
      <path d="M28.5 6.5C28.5 6.5 20.5 5.5 18 3.5V31.5C18 31.5 28.5 24.5 28.5 18V6.5Z" fill="#FBBF24" />
      {/* Shimmer Highlight */}
      <path d="M18 6L25 7.5V17C25 22 18 27.5 18 27.5V6Z" fill="#FDE68A" opacity="0.6" />
    </svg>
  );
}

// 5. Profile Mascot Avatar (Akun / Profile)
function DuolingoAvatarNavIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <div className={`${className} shrink-0 flex items-center justify-center transition-transform group-hover:scale-105`}>
      <div className="w-8 h-8 rounded-full bg-[#E8F2FC] dark:bg-[#1E2E42] border-2 border-[#8DB4D8] dark:border-[#38BDF8] flex items-center justify-center overflow-hidden shadow-xs">
        <MascotIcon size={24} />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APPSHELL COMPONENT
// ============================================================================

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

  const teacherNav: NavItem[] = [
    {
      to: '/teacher',
      label: 'DASHBOARD ADMIN',
      icon: <LayoutDashboard size={24} strokeWidth={2.4} className="text-[#38BDF8]" />,
      end: true,
    },
    {
      to: '/teacher/lessons/new',
      label: 'BUAT BACAAN',
      icon: <Plus size={24} strokeWidth={2.4} className="text-[#4ADE80]" />,
    },
    {
      to: '/teacher/results',
      label: 'EVALUASI MURID',
      icon: <Users size={24} strokeWidth={2.4} className="text-[#FBBF24]" />,
    },
  ];

  const studentNav: NavItem[] = [
    {
      to: '/student',
      label: 'BERANDA',
      icon: <DuolingoBirdhouseIcon />,
      end: true,
    },
    {
      to: '/student/materi',
      label: 'MATERI',
      icon: <DuolingoDumbbellIcon />,
    },
    {
      to: '/student/toko',
      label: 'TOKO',
      icon: <DuolingoShopIcon />,
      badge: 'BARU',
    },
    {
      to: '/student/progres',
      label: 'PROGRES',
      icon: <DuolingoShieldIcon />,
    },
    {
      to: '/student/akun',
      label: 'AKUN',
      icon: <DuolingoAvatarNavIcon />,
    },
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
    <div className="min-h-screen bg-[#F8F7F2] dark:bg-[#111C2B] text-[#304D70] dark:text-[#D3E3F8] antialiased">
      {/* ============================================================== */}
      {/* PERMANENT DESKTOP LEFT SIDEBAR (DUOLINGO STYLE)                */}
      {/* ============================================================== */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r-2 border-[#E5E5E5] dark:border-[#223044] bg-white dark:bg-[#111C2B] flex-col justify-between p-4 z-40 overflow-y-auto select-none">
        <div>
          {/* Logo Brand at top: TemuKata */}
          <NavLink
            to={teacher ? '/teacher' : '/student'}
            onClick={() => sound.playPop()}
            className="flex items-center gap-3 px-3 py-3 mb-6 select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#E8F2FC] dark:bg-[#1C2A3C] border-2 border-[#8DB4D8] dark:border-[#38BDF8] flex items-center justify-center overflow-hidden shrink-0 shadow-xs transition-transform group-hover:scale-105">
              <MascotIcon size={32} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#304D70] dark:text-[#E8F2FF] leading-none">
              TemuKata
            </span>
          </NavLink>

          {/* Duolingo-styled Navigation Items */}
          <nav className="flex flex-col gap-2">
            {nav.map(item => {
              const active = isItemActive(item.to, item.end);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => sound.playPop()}
                  className={`group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                    active
                      ? 'border-2 border-[#84D8FF] dark:border-[#38BDF8] bg-[#DDF4FF] dark:bg-[#1A344D] text-[#1CB0F6] dark:text-[#38BDF8] font-black text-sm tracking-wider uppercase shadow-xs'
                      : 'border-2 border-transparent text-[#7790A8] dark:text-[#8EA8C4] hover:bg-[#F7F7F7] dark:hover:bg-[#1C2A3C] hover:text-[#304D70] dark:hover:text-[#F0F6FF] font-black text-sm tracking-wider uppercase'
                  }`}
                >
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-[#FF4B4B] text-white font-black text-[10px] tracking-wider uppercase shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Optional subtle footer inside sidebar */}
        {teacher && (
          <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#223044]">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                void signOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-sm transition-colors"
            >
              <LogOut size={18} />
              <span>KELUAR</span>
            </button>
          </div>
        )}
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA OFFSET BY SIDEBAR ON DESKTOP                 */}
      {/* ============================================================== */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#F8F7F2]/95 dark:bg-[#111C2B]/95 backdrop-blur-md border-b border-[#E4E8ED] dark:border-[#223044] px-4 py-3 sm:px-8">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
            {/* Mobile-only Logo */}
            <div className="md:hidden">
              <NavLink
                to={teacher ? '/teacher' : '/student'}
                onClick={() => sound.playPop()}
                className="flex items-center gap-2.5 group select-none"
              >
                <div className="w-9 h-9 rounded-2xl bg-white dark:bg-[#1E2E42] border border-[#E4E8ED] dark:border-[#2B415E] overflow-hidden flex items-center justify-center shadow-xs">
                  <MascotIcon size={30} />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#304D70] dark:text-[#E8F2FF] leading-none">
                  TemuKata
                </span>
              </NavLink>
            </div>

            {/* Desktop Spacer pushes Gamified HUD to right */}
            <div className="hidden md:block" />

            {/* Gamified HUD: Streak, Diamonds, Theme & Sound */}
            <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
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
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#2B415E] shadow-2xs hover:bg-[#FAF8F5] dark:hover:bg-[#21334A] transition-all cursor-pointer select-none active:scale-95"
                      >
                        <StreakFlame active={streakActive} size={22} />
                        <span className="font-black text-sm sm:text-base text-[#304D70] dark:text-[#E8F2FF] leading-none">
                          {progress.streak.count}
                        </span>
                      </button>
                    );
                  })()}

                  {/* Diamonds Counter Capsule */}
                  <div
                    title={`${progress.diamonds} Permata Membaca`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#2B415E] shadow-2xs select-none"
                  >
                    <img
                      src="/gem-diamond.svg"
                      alt="Permata"
                      style={{ width: 20, height: 20 }}
                      className="object-contain inline-block shrink-0 select-none"
                      draggable={false}
                    />
                    <span className="font-black text-sm sm:text-base text-[#304D70] dark:text-[#E8F2FF] leading-none">
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
                className="w-9 h-9 rounded-full bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#2B415E] text-[#304D70] dark:text-[#A5C7F2] shadow-2xs hover:bg-[#FAF8F5] dark:hover:bg-[#21334A] transition-transform active:scale-90 flex items-center justify-center cursor-pointer"
              >
                {darkMode ? (
                  <Sun size={16} className="text-amber-400 fill-amber-400" />
                ) : (
                  <Moon size={16} className="text-[#304D70] fill-[#304D70]" />
                )}
              </button>

              {/* Sound Circle Toggle */}
              <button
                type="button"
                onClick={toggleSound}
                title={soundOn ? 'Matikan Suara' : 'Aktifkan Suara'}
                className="hidden sm:flex w-9 h-9 rounded-full bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#2B415E] text-[#304D70] dark:text-slate-400 shadow-2xs hover:bg-[#FAF8F5] dark:hover:bg-[#21334A] transition-transform active:scale-90 items-center justify-center cursor-pointer"
              >
                {soundOn ? (
                  <Volume2 size={16} className="text-[#304D70] dark:text-[#A5C7F2]" />
                ) : (
                  <VolumeX size={16} />
                )}
              </button>

              {/* User Profile Initial / Avatar Frame */}
              {profile && (
                <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l border-[#E4E8ED] dark:border-[#2B415E]">
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

        {/* Page Content Body */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 pb-24 md:pb-12">
          {children}
        </main>

        {/* Footer */}
        <LandscapeFooter />
      </div>

      {/* ============================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (DUOLINGO STYLE)                  */}
      {/* ============================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#111C2B]/95 backdrop-blur-lg border-t-2 border-[#E5E5E5] dark:border-[#223044] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {nav.map(item => {
          const active = isItemActive(item.to, item.end);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => sound.playPop()}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-transform active:scale-95 ${
                active ? 'text-[#1CB0F6] dark:text-[#38BDF8]' : 'text-[#7790A8] dark:text-[#8EA8C4]'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-colors ${
                  active ? 'bg-[#DDF4FF] dark:bg-[#1A344D]' : 'bg-transparent'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {item.icon}
                </div>
              </div>
              <span className={`text-[10px] tracking-wider uppercase ${active ? 'font-black' : 'font-bold'}`}>
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
