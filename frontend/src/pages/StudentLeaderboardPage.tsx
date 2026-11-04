import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import AvatarFrame from '../components/AvatarFrame';
import Mascot from '../components/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { buildLocalLeaderboard, overlayCurrentUser } from '../lib/leaderboard';
import { sound } from '../lib/sounds';
import { supabase } from '../lib/supabase';
import type { LeaderboardEntry, LeaderboardPayload } from '../types';

type UiState = 'loading' | 'error' | 'empty' | 'ready';
type PeriodType = 'weekly' | 'monthly' | 'all_time';

// ============================================================================
// BRAND GRAPHIC COMPONENTS (TemuKata Illustrated Game Aesthetic)
// ============================================================================

function StarCoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className="inline-block shrink-0 select-none">
      <circle cx="10" cy="10" r="9.5" fill="#E28906" />
      <circle cx="10" cy="10" r="8.2" fill="#F59E0B" />
      <circle cx="10" cy="10" r="6.8" fill="#FBBF24" />
      <polygon
        points="10,4.2 11.6,7.6 15.3,8 12.5,10.6 13.3,14.4 10,12.4 6.7,14.4 7.5,10.6 4.7,8 8.4,7.6"
        fill="#FFFFFF"
        opacity="0.95"
      />
    </svg>
  );
}

function CrownIcon({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`select-none ${className}`}>
      <path
        d="M4 22L7 9L13 15L16 5L19 15L25 9L28 22H4Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="8.5" r="2" fill="#F59E0B" />
      <circle cx="16" cy="4.5" r="2.5" fill="#EF4444" />
      <circle cx="25" cy="8.5" r="2" fill="#F59E0B" />
      <rect x="5" y="22" width="22" height="4.5" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2" />
      <circle cx="10" cy="24.2" r="1" fill="#FFFFFF" />
      <circle cx="16" cy="24.2" r="1.3" fill="#FFFFFF" />
      <circle cx="22" cy="24.2" r="1" fill="#FFFFFF" />
    </svg>
  );
}

function LaurelWreath({ className = '' }: { className?: string }) {
  return (
    <svg width="128" height="128" viewBox="0 0 120 120" fill="none" className={`pointer-events-none select-none ${className}`}>
      <path d="M26 88 C18 66 22 44 34 26" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
      <ellipse cx="21" cy="74" rx="5.5" ry="2.8" transform="rotate(-30 21 74)" fill="#FBBF24" />
      <ellipse cx="20" cy="58" rx="5.5" ry="2.8" transform="rotate(-15 20 58)" fill="#FBBF24" />
      <ellipse cx="24" cy="42" rx="5.5" ry="2.8" transform="rotate(10 24 42)" fill="#FBBF24" />
      <ellipse cx="32" cy="26" rx="5.5" ry="2.8" transform="rotate(35 32 26)" fill="#FBBF24" />
      <path d="M94 88 C102 66 98 44 86 26" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
      <ellipse cx="99" cy="74" rx="5.5" ry="2.8" transform="rotate(30 99 74)" fill="#FBBF24" />
      <ellipse cx="100" cy="58" rx="5.5" ry="2.8" transform="rotate(15 100 58)" fill="#FBBF24" />
      <ellipse cx="96" cy="42" rx="5.5" ry="2.8" transform="rotate(-10 96 42)" fill="#FBBF24" />
      <ellipse cx="88" cy="26" rx="5.5" ry="2.8" transform="rotate(-35 88 26)" fill="#FBBF24" />
    </svg>
  );
}

function PaperAirplaneIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className={`select-none ${className}`}>
      <path d="M22 2L11 13" stroke="#8DB4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#8DB4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#E8F2FC" />
      <path d="M3 18C5 19.5 8 18 10 16" stroke="#8DB4D8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />
    </svg>
  );
}

function SceneryLandscape() {
  return (
    <svg
      viewBox="0 0 600 320"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <ellipse cx="70" cy="45" rx="42" ry="16" fill="#FFFFFF" opacity="0.75" />
      <ellipse cx="98" cy="43" rx="26" ry="13" fill="#FFFFFF" opacity="0.85" />
      <ellipse cx="500" cy="40" rx="46" ry="16" fill="#FFFFFF" opacity="0.75" />
      <ellipse cx="530" cy="38" rx="28" ry="12" fill="#FFFFFF" opacity="0.85" />
      <ellipse cx="300" cy="30" rx="35" ry="12" fill="#FFFFFF" opacity="0.6" />

      <path d="M-20,240 Q150,180 320,215 T620,195 L620,320 L-20,320 Z" fill="#BFE39A" opacity="0.9" />
      <path d="M-20,265 Q180,210 400,245 T620,225 L620,320 L-20,320 Z" fill="#A8D87E" />

      <g transform="translate(45, 275)">
        <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="2.2" fill="#FFE8A8" />
      </g>
      <g transform="translate(68, 290)">
        <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="1.8" fill="#FFE8A8" />
      </g>
      <g transform="translate(540, 268)">
        <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="2.2" fill="#FFE8A8" />
      </g>
      <g transform="translate(565, 282)">
        <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="1.8" fill="#FFE8A8" />
      </g>
      <g transform="translate(470, 295)">
        <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="1.5" fill="#FFE8A8" />
      </g>
    </svg>
  );
}

function RankChangeBadge({ change }: { change: number | null }) {
  if (change == null || change === 0) {
    return (
      <span className="inline-flex items-center justify-center gap-1 min-w-[58px] px-2.5 py-1 rounded-full bg-[#F3F4F6] dark:bg-[#253549] text-[#6B7280] dark:text-[#A0B3C6] font-bold text-xs tracking-wide">
        <span>—</span>
        <span>0</span>
      </span>
    );
  }
  if (change > 0) {
    return (
      <span className="inline-flex items-center justify-center gap-1 min-w-[58px] px-2.5 py-1 rounded-full bg-[#EAF7EE] dark:bg-[#1B3828] text-[#2E7D32] dark:text-[#6EE7B7] font-bold text-xs tracking-wide">
        <span className="text-[10px]">▲</span>
        <span>+{change}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center gap-1 min-w-[58px] px-2.5 py-1 rounded-full bg-[#FDE8EC] dark:bg-[#3D1E26] text-[#C24158] dark:text-[#F87171] font-bold text-xs tracking-wide">
      <span className="text-[10px]">▼</span>
      <span>{change}</span>
    </span>
  );
}

function formatPoints(pts: number): string {
  return pts.toLocaleString('id-ID') + ' pts';
}

function getCachedLeaderboard(p: PeriodType): LeaderboardPayload | null {
  try {
    const raw = sessionStorage.getItem(`temukata_lb_cache_${p}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function setCachedLeaderboard(p: PeriodType, data: LeaderboardPayload) {
  try {
    sessionStorage.setItem(`temukata_lb_cache_${p}`, JSON.stringify(data));
  } catch {}
}

// ============================================================================
// MAIN STUDENT LEADERBOARD PAGE COMPONENT
// ============================================================================

export default function StudentLeaderboardPage() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Instant 0ms payload initialization (from session cache or local registry)
  const [payload, setPayload] = useState<LeaderboardPayload>(() => {
    const cached = getCachedLeaderboard('weekly');
    if (cached) return cached;
    return buildLocalLeaderboard(
      profile ? { id: profile.id, displayName: profile.display_name } : null,
      'weekly'
    );
  });

  const [state, setState] = useState<UiState>('ready');

  const load = useCallback(async (selectedPeriod: PeriodType, silent = false) => {
    if (!silent) {
      // Coba tampilkan data cache seketika (0ms)
      const cached = getCachedLeaderboard(selectedPeriod);
      if (cached) {
        setPayload(cached);
        setState('ready');
      } else {
        const local = buildLocalLeaderboard(
          profile ? { id: profile.id, displayName: profile.display_name } : null,
          selectedPeriod
        );
        setPayload(local);
        setState('ready');
      }
    }

    setIsRefreshing(true);
    setErrorMessage('');

    try {
      let data: LeaderboardPayload | null = null;

      // 1. Coba ambil langsung dari Supabase RPC dengan timeout cepat 1.8 detik
      if (supabase) {
        try {
          const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 1800));
          const query = (async () => {
            const { data: rpcData, error: rpcErr } = await supabase.rpc('get_dynamic_leaderboard', {
              p_period: selectedPeriod,
              p_limit: 100,
            });
            if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
              const activeEntries: LeaderboardEntry[] = [];
              const unstartedList: LeaderboardEntry[] = [];

              for (const r of rpcData) {
                const item: LeaderboardEntry = {
                  userId: r.user_id,
                  displayName: r.display_name,
                  equippedBorder: r.equipped_border || 'ice-dream',
                  points: Number(r.points || 0),
                  rank: Number(r.rank || 0),
                  rankChange: r.rank_change != null ? Number(r.rank_change) : 0,
                  status: r.status === 'active' ? 'active' : 'not_started',
                };
                if (item.status === 'active') {
                  activeEntries.push(item);
                } else {
                  unstartedList.push(item);
                }
              }

              const me = profile
                ? [...activeEntries, ...unstartedList].find(e => e.userId === profile.id) || null
                : null;

              return {
                entries: activeEntries,
                unstartedUsers: unstartedList,
                currentUser: me,
                period: selectedPeriod,
              };
            }
            return null;
          })();

          data = await Promise.race([query, timeout]);
        } catch {}
      }

      // 2. Jika belum, ambil dari Backend API lokal (sangat cepat)
      if (!data) {
        try {
          data = await api<LeaderboardPayload>(`/leaderboard?period=${selectedPeriod}`, session?.access_token);
        } catch {}
      }

      const identity = profile ? { id: profile.id, displayName: profile.display_name } : null;
      const next = identity && data ? overlayCurrentUser(data, identity, selectedPeriod) : (data || payload);

      setPayload(next);
      setCachedLeaderboard(selectedPeriod, next);
      setState('ready');
    } catch (error) {
      if (!payload.entries.length) {
        setErrorMessage(error instanceof Error ? error.message : 'Tidak bisa memuat papan peringkat.');
        setState('error');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [profile, session?.access_token]);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  function handlePeriodChange(next: PeriodType) {
    if (next === period) return;
    sound.playPop();
    setPeriod(next);
  }

  // Segmentasi: Top 3 dan Ranks 4+
  const topThree = useMemo(() => payload.entries.filter(entry => entry.rank <= 3), [payload.entries]);
  const restEntries = useMemo(() => payload.entries.filter(entry => entry.rank > 3), [payload.entries]);
  const first = topThree.find(entry => entry.rank === 1);
  const second = topThree.find(entry => entry.rank === 2);
  const third = topThree.find(entry => entry.rank === 3);
  const me = payload.currentUser;

  return (
    <AppShell mode="student">
      <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
        {/* ============================================================ */}
        {/* TOP HEADER: Back button + Title + Period Segmented Control   */}
        {/* ============================================================ */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                navigate('/student');
              }}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] text-[#304D70] dark:text-[#D3E3F8] shadow-2xs flex items-center justify-center hover:bg-[#FFF8ED] dark:hover:bg-[#21334A] active:scale-95 transition-all cursor-pointer"
              aria-label="Kembali ke Beranda"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex items-center gap-2.5">
              <CrownIcon size={32} />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#304D70] dark:text-[#E8F2FF] leading-tight">
                    Papan Peringkat
                  </h1>
                  {isRefreshing && (
                    <Loader2 size={16} className="animate-spin text-[#8DB4D8]" />
                  )}
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#526F92] dark:text-[#C0D1E5]">
                  Peringkat otomatis naik saat kamu memperoleh poin lebih banyak!
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Control [Mingguan | Bulanan | Sepanjang Masa] */}
          <div className="self-end sm:self-center flex items-center bg-white dark:bg-[#1C2A3C] p-1 rounded-full border border-[#E4E8ED] dark:border-[#34475E] shadow-2xs">
            <button
              type="button"
              onClick={() => handlePeriodChange('weekly')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                period === 'weekly'
                  ? 'bg-[#6D97BF] text-white shadow-xs'
                  : 'text-[#526F92] dark:text-[#C0D1E5] hover:text-[#304D70] dark:hover:text-white'
              }`}
            >
              Mingguan
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('monthly')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-[#6D97BF] text-white shadow-xs'
                  : 'text-[#526F92] dark:text-[#C0D1E5] hover:text-[#304D70] dark:hover:text-white'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('all_time')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                period === 'all_time'
                  ? 'bg-[#6D97BF] text-white shadow-xs'
                  : 'text-[#526F92] dark:text-[#C0D1E5] hover:text-[#304D70] dark:hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>
        </header>

        {/* ============================================================ */}
        {/* LOADING STATE                                                */}
        {/* ============================================================ */}
        {state === 'loading' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-6 items-start">
            <div className="space-y-4">
              <div className="h-[360px] rounded-3xl bg-[#E8F2FC] dark:bg-[#1C2A3C] border border-[#DCEBFA] dark:border-[#34475E] animate-pulse" />
              <div className="h-[100px] rounded-3xl bg-[#FFF8ED] dark:bg-[#21334A] border border-[#EFE8DC] dark:border-[#34475E] animate-pulse" />
            </div>
            <div className="h-[480px] rounded-3xl bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] animate-pulse" />
          </div>
        )}

        {/* ============================================================ */}
        {/* ERROR STATE                                                  */}
        {/* ============================================================ */}
        {state === 'error' && (
          <div className="card-temukata p-10 text-center space-y-4 max-w-lg mx-auto">
            <div className="flex justify-center">
              <Mascot mood="thinking" size={96} />
            </div>
            <p className="text-base font-bold text-[#304D70] dark:text-[#E8F2FF]">
              {errorMessage || 'Papan peringkat sedang tidak bisa dibuka. Yuk coba lagi.'}
            </p>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                void load(period);
              }}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#8DB4D8] text-white font-bold text-sm shadow-xs hover:bg-[#6D97BF] active:scale-95 transition-all cursor-pointer"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* READY STATE: DYNAMIC LEADERBOARD                             */}
        {/* ============================================================ */}
        {state === 'ready' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-6 items-start">
              {/* ======================================================== */}
              {/* LEFT COLUMN: PODIUM CARD + CURRENT USER CARD             */}
              {/* ======================================================== */}
              <div className="space-y-5">
                {/* PODIUM TOP 3 CARD */}
                <div className="relative overflow-hidden rounded-3xl bg-[#EBF4FD] dark:bg-[#182638] border border-[#DCEBFA] dark:border-[#2D435E] shadow-[0_6px_24px_-8px_rgba(48,77,112,0.08)] p-4 sm:p-6 min-h-[360px] sm:min-h-[400px] flex flex-col justify-end">
                  <SceneryLandscape />

                  {/* Top 3 Columns flex row */}
                  <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-4 pt-8">
                    {/* RANK 2 (Left, Ice Blue) */}
                    {second ? (
                      <div className="flex-1 max-w-[125px] sm:max-w-[145px] flex flex-col items-center">
                        <div className="relative mb-2">
                          <AvatarFrame
                            borderId={second.equippedBorder || 'ice-dream'}
                            size={70}
                            initial={second.displayName.slice(0, 1).toUpperCase()}
                          />
                        </div>
                        <div className="w-full h-[155px] sm:h-[180px] rounded-t-3xl rounded-b-2xl bg-[#E8F2FC] dark:bg-[#20364F] border-2 border-[#D1E3F5] dark:border-[#2C4A70] shadow-sm flex flex-col items-center justify-between py-3 px-2 text-center transition-transform hover:-translate-y-1">
                          <span className="text-3xl sm:text-4xl font-extrabold text-[#527FA8] dark:text-[#8DBBE8] leading-none">
                            2
                          </span>
                          <div className="space-y-1 w-full">
                            <p className="font-bold text-xs sm:text-sm text-[#304D70] dark:text-[#E8F2FF] truncate w-full">
                              {second.displayName.split(' ')[0]}
                            </p>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 dark:bg-[#192738]/80 border border-[#D1E3F5] dark:border-[#2C4A70] text-[10px] sm:text-xs font-bold text-[#304D70] dark:text-[#D3E3F8]">
                              <StarCoinIcon size={13} />
                              <span>{formatPoints(second.points)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 max-w-[125px] sm:max-w-[145px] flex flex-col items-center opacity-40">
                        <div className="w-[66px] h-[66px] rounded-full border-2 border-dashed border-[#8DB4D8] flex items-center justify-center mb-2">
                          <span className="text-xs font-bold text-[#8DB4D8]">?</span>
                        </div>
                        <div className="w-full h-[155px] sm:h-[180px] rounded-t-3xl rounded-b-2xl bg-[#E8F2FC]/50 dark:bg-[#20364F]/50 border-2 border-dashed border-[#D1E3F5] flex flex-col items-center justify-between py-3 px-2 text-center">
                          <span className="text-3xl font-extrabold text-[#527FA8]/50">2</span>
                          <span className="text-[10px] font-bold text-[#527FA8]/70">Menunggu Murid</span>
                        </div>
                      </div>
                    )}

                    {/* RANK 1 (Center, Tallest, Butter Yellow) */}
                    {first ? (
                      <div className="flex-1 max-w-[140px] sm:max-w-[165px] flex flex-col items-center -mt-6 z-20">
                        <div className="relative mb-2 flex items-center justify-center">
                          <div className="absolute -top-7 animate-bounce" style={{ animationDuration: '2.5s' }}>
                            <CrownIcon size={30} />
                          </div>
                          <LaurelWreath className="absolute inset-0 -m-3 scale-110" />
                          <AvatarFrame
                            borderId={first.equippedBorder || 'flower-garden'}
                            size={84}
                            initial={first.displayName.slice(0, 1).toUpperCase()}
                          />
                        </div>
                        <div className="w-full h-[195px] sm:h-[225px] rounded-t-3xl rounded-b-2xl bg-[#FFE8A8] dark:bg-[#4E3F1F] border-2 border-[#F8DF9B] dark:border-[#6B572A] shadow-md flex flex-col items-center justify-between py-3.5 px-2 text-center transition-transform hover:-translate-y-1">
                          <span className="text-4xl sm:text-5xl font-extrabold text-[#D97706] dark:text-[#FBBF24] leading-none">
                            1
                          </span>
                          <div className="space-y-1 w-full">
                            <p className="font-extrabold text-sm sm:text-base text-[#304D70] dark:text-[#E8F2FF] truncate w-full">
                              {first.displayName.split(' ')[0]}
                            </p>
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-[#192738]/90 border border-[#F8DF9B] dark:border-[#6B572A] text-xs sm:text-sm font-extrabold text-[#304D70] dark:text-[#D3E3F8]">
                              <StarCoinIcon size={14} />
                              <span>{formatPoints(first.points)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 max-w-[140px] sm:max-w-[165px] flex flex-col items-center -mt-6 z-20 opacity-50">
                        <div className="w-[84px] h-[84px] rounded-full border-2 border-dashed border-[#D97706] flex items-center justify-center mb-2">
                          <CrownIcon size={24} className="opacity-40" />
                        </div>
                        <div className="w-full h-[195px] sm:h-[225px] rounded-t-3xl rounded-b-2xl bg-[#FFE8A8]/50 dark:bg-[#4E3F1F]/50 border-2 border-dashed border-[#F8DF9B] flex flex-col items-center justify-center p-3 text-center">
                          <span className="text-4xl font-extrabold text-[#D97706]/40">1</span>
                          <span className="text-xs font-bold text-[#D97706]/70 mt-2">Belum Ada Juara</span>
                        </div>
                      </div>
                    )}

                    {/* RANK 3 (Right, Soft Pink) */}
                    {third ? (
                      <div className="flex-1 max-w-[125px] sm:max-w-[145px] flex flex-col items-center">
                        <div className="relative mb-2">
                          <AvatarFrame
                            borderId={third.equippedBorder || 'cherry-blossom'}
                            size={66}
                            initial={third.displayName.slice(0, 1).toUpperCase()}
                          />
                        </div>
                        <div className="w-full h-[135px] sm:h-[155px] rounded-t-3xl rounded-b-2xl bg-[#F5B9C4] dark:bg-[#482835] border-2 border-[#ECAAB9] dark:border-[#663546] shadow-sm flex flex-col items-center justify-between py-3 px-2 text-center transition-transform hover:-translate-y-1">
                          <span className="text-3xl sm:text-4xl font-extrabold text-[#C45A6D] dark:text-[#ECAAB9] leading-none">
                            3
                          </span>
                          <div className="space-y-1 w-full">
                            <p className="font-bold text-xs sm:text-sm text-[#304D70] dark:text-[#E8F2FF] truncate w-full">
                              {third.displayName.split(' ')[0]}
                            </p>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 dark:bg-[#192738]/80 border border-[#ECAAB9] dark:border-[#663546] text-[10px] sm:text-xs font-bold text-[#304D70] dark:text-[#D3E3F8]">
                              <StarCoinIcon size={13} />
                              <span>{formatPoints(third.points)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 max-w-[125px] sm:max-w-[145px] flex flex-col items-center opacity-40">
                        <div className="w-[66px] h-[66px] rounded-full border-2 border-dashed border-[#F5B9C4] flex items-center justify-center mb-2">
                          <span className="text-xs font-bold text-[#F5B9C4]">?</span>
                        </div>
                        <div className="w-full h-[135px] sm:h-[155px] rounded-t-3xl rounded-b-2xl bg-[#F5B9C4]/40 dark:bg-[#482835]/40 border-2 border-dashed border-[#ECAAB9] flex flex-col items-center justify-between py-3 px-2 text-center">
                          <span className="text-3xl font-extrabold text-[#C45A6D]/50">3</span>
                          <span className="text-[10px] font-bold text-[#C45A6D]/70">Menunggu Murid</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* POSISIMU SAAT INI CARD */}
                {me && (
                  <div className="rounded-3xl bg-[#FFF8ED] dark:bg-[#1E2E42] border border-[#EFE8DC] dark:border-[#2D435E] p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h3 className="text-sm font-extrabold text-[#304D70] dark:text-[#E8F2FF]">
                        Posisimu Saat Ini
                      </h3>
                      <PaperAirplaneIcon />
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-2xl bg-white dark:bg-[#182638] border border-[#E4E8ED] dark:border-[#2D435E] shadow-2xs">
                      {/* Rank Number Pill */}
                      <span className="w-9 h-9 rounded-xl bg-[#E8F2FC] dark:bg-[#253952] text-[#304D70] dark:text-[#E8F2FF] font-black text-base flex items-center justify-center shrink-0">
                        {me.rank > 0 ? me.rank : '—'}
                      </span>
                      {/* Avatar */}
                      <AvatarFrame
                        borderId={me.equippedBorder || 'ice-dream'}
                        size={44}
                        initial={me.displayName.slice(0, 1).toUpperCase()}
                      />
                      {/* Name & Points */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm sm:text-base font-bold text-[#304D70] dark:text-[#E8F2FF] truncate">
                            {me.displayName}
                          </p>
                          <span className="px-1.5 py-0.5 rounded-md bg-[#DCEBFA] dark:bg-[#284364] text-[#304D70] dark:text-[#9EC5EA] font-extrabold text-[10px] uppercase tracking-wide">
                            Kamu
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#526F92] dark:text-[#C0D1E5] mt-0.5">
                          {me.points > 0 ? (
                            <>
                              <StarCoinIcon size={14} />
                              <span>{formatPoints(me.points)}</span>
                            </>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                              Belum Memulai (0 pts)
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Change Pill */}
                      {me.points > 0 ? (
                        <RankChangeBadge change={me.rankChange} />
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-[#FFF3DF] text-[#A66300] font-bold text-xs">
                          Baru
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* RIGHT COLUMN: LEADERBOARD TABLE                          */}
              {/* ======================================================== */}
              <div className="card-temukata p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] shadow-[0_4px_20px_-4px_rgba(48,77,112,0.06)]">
                {/* Table Column Headers */}
                <div className="grid grid-cols-[36px_1fr_auto_auto] sm:grid-cols-[44px_1fr_130px_90px] items-center gap-2 sm:gap-4 px-3 py-2 text-xs font-extrabold text-[#7E96B0] dark:text-[#8EA8C4] uppercase tracking-wider border-b border-[#F0F2F5] dark:border-[#26374D] pb-3 mb-2">
                  <span>#</span>
                  <span>Pengguna</span>
                  <span className="text-left">Poin</span>
                  <span className="text-right">Perubahan</span>
                </div>

                {/* Table Rows (Peringkat 4 ke bawah atau seluruh murid aktif) */}
                <div className="space-y-1.5">
                  {restEntries.length > 0 ? (
                    restEntries.map(entry => {
                      const isCurrentUser = me?.userId === entry.userId;
                      return (
                        <div
                          key={entry.userId}
                          className={`grid grid-cols-[36px_1fr_auto_auto] sm:grid-cols-[44px_1fr_130px_90px] items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-2xl transition-all ${
                            isCurrentUser
                              ? 'bg-[#E8F2FC]/80 dark:bg-[#22374E] border border-[#DCEBFA] dark:border-[#334D6B] shadow-2xs'
                              : 'hover:bg-[#FAF8F5] dark:hover:bg-[#21334A]/50 border border-transparent'
                          }`}
                        >
                          <span className="text-sm sm:text-base font-extrabold text-[#304D70] dark:text-[#E8F2FF] tabular-nums">
                            {entry.rank}
                          </span>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <AvatarFrame
                              borderId={entry.equippedBorder || 'ice-dream'}
                              size={38}
                              initial={entry.displayName.slice(0, 1).toUpperCase()}
                            />
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs sm:text-sm font-bold text-[#304D70] dark:text-[#E8F2FF] truncate">
                                {entry.displayName}
                              </span>
                              {isCurrentUser && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-[#DCEBFA] dark:bg-[#284364] text-[#304D70] dark:text-[#9EC5EA] font-extrabold text-[9px] uppercase tracking-wide">
                                  Kamu
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#304D70] dark:text-[#E8F2FF] whitespace-nowrap">
                            <StarCoinIcon size={14} />
                            <span>{formatPoints(entry.points)}</span>
                          </div>
                          <div className="flex justify-end">
                            <RankChangeBadge change={entry.rankChange} />
                          </div>
                        </div>
                      );
                    })
                  ) : payload.entries.length > 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-sm font-bold text-[#304D70] dark:text-[#E8F2FF]">
                        Seluruh murid aktif berada di podium Top 3!
                      </p>
                      <p className="text-xs text-[#526F92] dark:text-[#A0B3C6]">
                        Selesaikan materi bacaan baru untuk menambah poin dan mempertahankan peringkat.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-3">
                      <div className="flex justify-center">
                        <BookOpen size={36} className="text-[#8DB4D8]" />
                      </div>
                      <p className="text-sm font-bold text-[#304D70] dark:text-[#E8F2FF]">
                        Belum ada siswa yang menyelesaikan latihan pada periode ini.
                      </p>
                      <p className="text-xs text-[#526F92] dark:text-[#A0B3C6] max-w-sm mx-auto">
                        Jadilah yang pertama membaca materi dan merebut mahkota juara #1 di podium TemuKata!
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/student/materi')}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#5B8DB8] text-white font-bold text-xs shadow-xs hover:bg-[#4D7FA9] transition-all"
                      >
                        <Sparkles size={14} />
                        <span>Mulai Baca Materi</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* DAFTAR SISWA BELUM MEMULAI (Poin = 0)                    */}
            {/* ======================================================== */}
            {payload.unstartedUsers && payload.unstartedUsers.length > 0 && (
              <div className="rounded-3xl bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#7E96B0] dark:text-[#8EA8C4] uppercase tracking-wider">
                    Siswa Terdaftar Lainnya (Belum Memulai)
                  </h4>
                  <span className="text-xs font-semibold text-[#526F92]">
                    {payload.unstartedUsers.length} siswa
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {payload.unstartedUsers.map(u => {
                    const isMe = me?.userId === u.userId;
                    return (
                      <div
                        key={u.userId}
                        className={`flex items-center gap-3 p-3 rounded-2xl border ${
                          isMe
                            ? 'bg-[#E8F2FC]/70 dark:bg-[#22374E] border-[#DCEBFA]'
                            : 'bg-[#F9FAFC] dark:bg-[#182638] border-[#E4E8ED] dark:border-[#2D435E]'
                        }`}
                      >
                        <AvatarFrame
                          borderId={u.equippedBorder || 'ice-dream'}
                          size={36}
                          initial={u.displayName.slice(0, 1).toUpperCase()}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#304D70] dark:text-[#E8F2FF] truncate">
                            {u.displayName}
                            {isMe && (
                              <span className="ml-1.5 px-1 py-0.2 rounded bg-[#DCEBFA] text-[#304D70] text-[9px] font-extrabold">
                                Kamu
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-[#8FA6C1] font-semibold">
                            Belum Memulai (0 pts)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
