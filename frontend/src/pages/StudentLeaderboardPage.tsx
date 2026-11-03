import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import AvatarFrame from '../components/AvatarFrame';
import Mascot from '../components/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { overlayCurrentUser } from '../lib/leaderboard';
import { sound } from '../lib/sounds';
import { supabase } from '../lib/supabase';
import type { LeaderboardPayload } from '../types';

type UiState = 'loading' | 'error' | 'empty' | 'ready';
type PeriodType = 'weekly' | 'monthly';

// ============================================================================
// BRAND GRAPHIC COMPONENTS (TemuKata Illustrated Game Aesthetic)
// ============================================================================

// Star Coin Icon (matches golden star coin in reference screenshot)
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

// Golden Crown (matches crown on header and 1st place in screenshot)
function CrownIcon({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`select-none ${className}`}>
      {/* Crown base shape */}
      <path
        d="M4 22L7 9L13 15L16 5L19 15L25 9L28 22H4Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Jewels on peaks */}
      <circle cx="7" cy="8.5" r="2" fill="#F59E0B" />
      <circle cx="16" cy="4.5" r="2.5" fill="#EF4444" />
      <circle cx="25" cy="8.5" r="2" fill="#F59E0B" />
      {/* Bottom rim */}
      <rect x="5" y="22" width="22" height="4.5" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2" />
      <circle cx="10" cy="24.2" r="1" fill="#FFFFFF" />
      <circle cx="16" cy="24.2" r="1.3" fill="#FFFFFF" />
      <circle cx="22" cy="24.2" r="1" fill="#FFFFFF" />
    </svg>
  );
}

// Golden Laurel Wreath for Rank 1
function LaurelWreath({ className = '' }: { className?: string }) {
  return (
    <svg width="128" height="128" viewBox="0 0 120 120" fill="none" className={`pointer-events-none select-none ${className}`}>
      {/* Left branch */}
      <path d="M26 88 C18 66 22 44 34 26" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
      <ellipse cx="21" cy="74" rx="5.5" ry="2.8" transform="rotate(-30 21 74)" fill="#FBBF24" />
      <ellipse cx="20" cy="58" rx="5.5" ry="2.8" transform="rotate(-15 20 58)" fill="#FBBF24" />
      <ellipse cx="24" cy="42" rx="5.5" ry="2.8" transform="rotate(10 24 42)" fill="#FBBF24" />
      <ellipse cx="32" cy="26" rx="5.5" ry="2.8" transform="rotate(35 32 26)" fill="#FBBF24" />
      {/* Right branch */}
      <path d="M94 88 C102 66 98 44 86 26" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85" />
      <ellipse cx="99" cy="74" rx="5.5" ry="2.8" transform="rotate(30 99 74)" fill="#FBBF24" />
      <ellipse cx="100" cy="58" rx="5.5" ry="2.8" transform="rotate(15 100 58)" fill="#FBBF24" />
      <ellipse cx="96" cy="42" rx="5.5" ry="2.8" transform="rotate(-10 96 42)" fill="#FBBF24" />
      <ellipse cx="88" cy="26" rx="5.5" ry="2.8" transform="rotate(-35 88 26)" fill="#FBBF24" />
    </svg>
  );
}

// Paper Airplane Doodle (for "Posisimu Saat Ini")
function PaperAirplaneIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className={`select-none ${className}`}>
      <path d="M22 2L11 13" stroke="#8DB4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#8DB4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#E8F2FC" />
      {/* Trail dashes */}
      <path d="M3 18C5 19.5 8 18 10 16" stroke="#8DB4D8" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" opacity="0.6" />
    </svg>
  );
}

// Illustrated Pastoral Scenery Background (Clouds, Meadow, Daisies)
function SceneryLandscape() {
  return (
    <svg
      viewBox="0 0 600 320"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Soft pastel clouds in the sky */}
      <ellipse cx="70" cy="45" rx="42" ry="16" fill="#FFFFFF" opacity="0.75" />
      <ellipse cx="98" cy="43" rx="26" ry="13" fill="#FFFFFF" opacity="0.85" />
      <ellipse cx="500" cy="40" rx="46" ry="16" fill="#FFFFFF" opacity="0.75" />
      <ellipse cx="530" cy="38" rx="28" ry="12" fill="#FFFFFF" opacity="0.85" />
      <ellipse cx="300" cy="30" rx="35" ry="12" fill="#FFFFFF" opacity="0.6" />

      {/* Background Soft Green Meadow Hill */}
      <path d="M-20,240 Q150,180 320,215 T620,195 L620,320 L-20,320 Z" fill="#BFE39A" opacity="0.9" />
      {/* Foreground Bright Meadow Hill */}
      <path d="M-20,265 Q180,210 400,245 T620,225 L620,320 L-20,320 Z" fill="#A8D87E" />

      {/* Cute daisies / white flowers scattered on the grass */}
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

// Position change badge (▲ +3, ▼ -2, — 0)
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

// Format point numbers as Indonesian locale (1.520 pts)
function formatPoints(pts: number): string {
  return pts.toLocaleString('id-ID') + ' pts';
}

// ============================================================================
// MAIN STUDENT LEADERBOARD PAGE COMPONENT
// ============================================================================

export default function StudentLeaderboardPage() {
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState<UiState>('loading');
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [errorMessage, setErrorMessage] = useState('');
  const [payload, setPayload] = useState<LeaderboardPayload>({ entries: [], currentUser: null });

  const load = useCallback(async (selectedPeriod: PeriodType) => {
    setState('loading');
    setErrorMessage('');
    try {
      let data: LeaderboardPayload | null = null;

      // 1. Coba ambil langsung dari Supabase RPC jika koneksi klien tersedia
      if (supabase) {
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc('get_leaderboard', { p_period: selectedPeriod });
          if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
            const entries = rpcData.map((r: any) => ({
              userId: r.user_id,
              displayName: r.display_name,
              equippedBorder: r.equipped_border || 'ice-dream',
              points: Number(r.points || 0),
              rank: Number(r.rank),
              rankChange: r.rank_change != null ? Number(r.rank_change) : 0,
            }));
            const me = profile ? entries.find(e => e.userId === profile.id) || null : null;
            data = { entries, currentUser: me };
          }
        } catch {}
      }

      // 2. Jika belum, ambil dari Backend API
      if (!data) {
        data = await api<LeaderboardPayload>(`/leaderboard?period=${selectedPeriod}`, session?.access_token);
      }

      const identity = profile
        ? { id: profile.id, displayName: profile.display_name }
        : null;
      const next = identity ? overlayCurrentUser(data, identity, selectedPeriod) : data;
      setPayload(next);
      setState(next.entries.length === 0 ? 'empty' : 'ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Tidak bisa memuat papan peringkat.');
      setState('error');
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

  // Segment leaderboard into Top 3 and remaining entries
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
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#304D70] dark:text-[#E8F2FF] leading-tight">
                  Papan Peringkat
                </h1>
                <p className="text-xs sm:text-sm font-medium text-[#526F92] dark:text-[#C0D1E5]">
                  Lihat posisi dan pencapaianmu bersama teman-teman!
                </p>
              </div>
            </div>
          </div>

          {/* Segmented Control [Mingguan | Bulanan] */}
          <div className="self-end sm:self-center flex items-center bg-white dark:bg-[#1C2A3C] p-1 rounded-full border border-[#E4E8ED] dark:border-[#34475E] shadow-2xs">
            <button
              type="button"
              onClick={() => handlePeriodChange('weekly')}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
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
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                period === 'monthly'
                  ? 'bg-[#6D97BF] text-white shadow-xs'
                  : 'text-[#526F92] dark:text-[#C0D1E5] hover:text-[#304D70] dark:hover:text-white'
              }`}
            >
              Bulanan
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
        {/* EMPTY STATE                                                  */}
        {/* ============================================================ */}
        {state === 'empty' && (
          <div className="card-temukata p-10 text-center space-y-4 max-w-lg mx-auto">
            <div className="flex justify-center">
              <Mascot mood="happy" size={110} />
            </div>
            <p className="text-lg font-bold text-[#304D70] dark:text-[#E8F2FF]">
              Belum ada peringkat yang tersedia.
            </p>
            <p className="text-sm font-medium text-[#526F92] dark:text-[#C0D1E5]">
              Selesaikan bacaan hari ini untuk mulai mengumpulkan poin dan melihat posisimu di papan peringkat!
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* READY STATE: 2-COLUMN DESKTOP & VERTICAL STACK MOBILE        */}
        {/* ============================================================ */}
        {state === 'ready' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-6 items-start">
            {/* ======================================================== */}
            {/* LEFT COLUMN: PODIUM CARD + CURRENT USER POSITION CARD    */}
            {/* ======================================================== */}
            <div className="space-y-5">
              {/* PODIUM TOP 3 CARD */}
              <div className="relative overflow-hidden rounded-3xl bg-[#EBF4FD] dark:bg-[#182638] border border-[#DCEBFA] dark:border-[#2D435E] shadow-[0_6px_24px_-8px_rgba(48,77,112,0.08)] p-4 sm:p-6 min-h-[360px] sm:min-h-[400px] flex flex-col justify-end">
                {/* Pastoral Scenery Background */}
                <SceneryLandscape />

                {/* Top 3 Columns flex row */}
                <div className="relative z-10 flex items-end justify-center gap-2 sm:gap-4 pt-8">
                  {/* RANK 2: RAKA (Left, Ice Blue) */}
                  {second && (
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
                  )}

                  {/* RANK 1: AURELIA (Center, Tallest, Butter Yellow) */}
                  {first && (
                    <div className="flex-1 max-w-[140px] sm:max-w-[165px] flex flex-col items-center -mt-6 z-20">
                      {/* Floating Crown and Laurel Wreath */}
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
                  )}

                  {/* RANK 3: NADINE (Right, Soft Pink) */}
                  {third && (
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
                  )}
                </div>
              </div>

              {/* "POSISIMU SAAT INI" CARD (Matches bottom left in screenshot) */}
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
                      {me.rank}
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
                        <StarCoinIcon size={14} />
                        <span>{formatPoints(me.points)}</span>
                      </div>
                    </div>
                    {/* Change Pill */}
                    <RankChangeBadge change={me.rankChange} />
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: LEADERBOARD TABLE (Rank 4 to 10+)          */}
            {/* ======================================================== */}
            <div className="card-temukata p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] shadow-[0_4px_20px_-4px_rgba(48,77,112,0.06)]">
              {/* Table Column Headers */}
              <div className="grid grid-cols-[36px_1fr_auto_auto] sm:grid-cols-[44px_1fr_130px_90px] items-center gap-2 sm:gap-4 px-3 py-2 text-xs font-extrabold text-[#7E96B0] dark:text-[#8EA8C4] uppercase tracking-wider border-b border-[#F0F2F5] dark:border-[#26374D] pb-3 mb-2">
                <span>#</span>
                <span>Pengguna</span>
                <span className="text-left">Poin</span>
                <span className="text-right">Perubahan</span>
              </div>

              {/* Table Rows */}
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
                        {/* Rank # */}
                        <span className="text-sm sm:text-base font-extrabold text-[#304D70] dark:text-[#E8F2FF] tabular-nums">
                          {entry.rank}
                        </span>

                        {/* User Avatar & Name */}
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

                        {/* Points with Star Coin */}
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-[#304D70] dark:text-[#E8F2FF] whitespace-nowrap">
                          <StarCoinIcon size={14} />
                          <span>{formatPoints(entry.points)}</span>
                        </div>

                        {/* Change Badge */}
                        <div className="flex justify-end">
                          <RankChangeBadge change={entry.rankChange} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-sm font-bold text-[#304D70] dark:text-[#E8F2FF]">
                      Semua siswa berada di papan podium!
                    </p>
                    <p className="text-xs text-[#526F92] dark:text-[#A0B3C6]">
                      Terus baca dan kerjakan latihan untuk mempertahankan posisimu.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
