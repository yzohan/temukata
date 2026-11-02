import { Shield, X, Trophy } from 'lucide-react';
import { sound } from '../lib/sounds';
import type { StreakData } from '../types';
import StreakFlame, { isStreakActiveToday } from './StreakFlame';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: StreakData;
}

export default function StreakModal({ isOpen, onClose, streak }: StreakModalProps) {
  if (!isOpen) return null;

  const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const todayDayIndex = (new Date().getDay() + 6) % 7;
  const isTodayActive = isStreakActiveToday(streak);

  return (
    <div className="fixed inset-0 z-50 bg-[#111C2B]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FFFFFF] dark:bg-[#1C2A3C] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-pop border-2 border-[#E4E8ED] dark:border-[#34475E] transition-colors duration-200">
        {/* Header Banner */}
        <div
          className={`p-6 text-white text-center relative transition-colors ${
            isTodayActive
              ? 'bg-gradient-to-r from-[#F5A65B] to-[#F8DF9B]'
              : 'bg-gradient-to-r from-[#8DB4D8] to-[#8DBBE8]'
          }`}
        >
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-black/15 hover:bg-black/25 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner">
            <StreakFlame active={isTodayActive} size={64} />
          </div>

          <h2 className="text-2xl font-black tracking-tight drop-shadow-xs">
            {streak.count} Hari Beruntun! {isTodayActive ? '🔥' : '⏳'}
          </h2>
          <p className="mt-1 text-xs font-bold text-white/95">
            {isTodayActive
              ? 'Luar biasa! Kamu telah menjaga api streak membaca hari ini.'
              : 'Api streakmu belum menyala hari ini. Selesaikan 1 bacaan untuk menyalakannya!'}
          </p>
        </div>

        {/* Weekly Calendar Tracker */}
        <div className="p-6 bg-[#FFFFFF] dark:bg-[#1C2A3C]">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#526F92] dark:text-[#C0D1E5] block mb-3 text-center">
            Aktivitas Membaca Minggu Ini
          </span>

          <div className="grid grid-cols-7 gap-2 text-center mb-6">
            {days.map((dayName, idx) => {
              const isActive = streak.weeklyHistory?.[idx];
              const isToday = idx === todayDayIndex;

              return (
                <div key={dayName} className="flex flex-col items-center">
                  <span className="text-[11px] font-black text-[#526F92] dark:text-[#C0D1E5] mb-1.5">{dayName}</span>
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                      isActive
                        ? 'bg-[#FFF8ED] dark:bg-[#21334A] border-2 border-[#F5A65B] dark:border-[#F8DF9B] text-[#F5A65B] dark:text-[#F8DF9B] shadow-xs'
                        : isToday
                        ? 'bg-[#E8F2FC] dark:bg-[#21334A] border-2 border-dashed border-[#8DB4D8] dark:border-[#8DBBE8] text-[#304D70] dark:text-[#F0F6FF]'
                        : 'bg-[#F8F7F2] dark:bg-[#111C2B] border-2 border-[#E4E8ED] dark:border-[#34475E] text-slate-400'
                    }`}
                  >
                    {isActive ? (
                      <StreakFlame active={true} size={28} />
                    ) : isToday ? (
                      <StreakFlame active={false} size={28} />
                    ) : (
                      '•'
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Streak Freeze & Milestones */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#E8F2FC] dark:bg-[#21334A] border-2 border-[#8DB4D8]/30 dark:border-[#8DBBE8]/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C2A3C] text-[#8DB4D8] dark:text-[#8DBBE8] flex items-center justify-center shrink-0 border border-[#8DB4D8]/20 dark:border-[#8DBBE8]/20">
                <Shield size={20} className="fill-[#8DB4D8]/20 dark:fill-[#8DBBE8]/20" />
              </div>
              <div>
                <b className="text-xs font-black text-[#304D70] dark:text-[#F0F6FF] block">
                  {streak.freezeCount}x Pelindung Streak Aktif
                </b>
                <p className="text-[11px] font-bold text-[#526F92] dark:text-[#C0D1E5] leading-snug">
                  Streakmu terlindungi otomatis jika terlewat 1 hari membaca.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFF8ED] dark:bg-[#263D57] border-2 border-[#F8DF9B]/30 dark:border-[#F8DF9B]/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1C2A3C] text-amber-500 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-700/30">
                <Trophy size={20} className="text-amber-500" />
              </div>
              <div>
                <b className="text-xs font-black text-[#304D70] dark:text-[#F0F6FF] block">Target Berikutnya: 7 Hari</b>
                <p className="text-[11px] font-bold text-[#526F92] dark:text-[#C0D1E5] leading-snug">
                  Raih pencapaian mingguan dan bonus +10 Permata!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="w-full mt-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-[#8DB4D8] dark:bg-[#8DBBE8] text-white dark:text-[#111C2B] hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs"
          >
            Lanjutkan Membaca Hari Ini
          </button>
        </div>
      </div>
    </div>
  );
}
