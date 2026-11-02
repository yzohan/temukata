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
    <div className="fixed inset-0 z-50 bg-[#2c3848]/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-duo bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-pop border-2 border-[#e7e2d8]">
        {/* Header Banner */}
        <div
          className={`p-6 text-white text-center relative transition-colors ${
            isTodayActive
              ? 'bg-gradient-to-r from-[#f5a65b] to-[#f8be8c]'
              : 'bg-gradient-to-r from-[#92b4d2] to-[#80a4c4]'
          }`}
        >
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner">
            <StreakFlame active={isTodayActive} size={64} />
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            {streak.count} Hari Beruntun! {isTodayActive ? '🔥' : '⏳'}
          </h2>
          <p className="mt-1 text-xs font-bold text-white/90">
            {isTodayActive
              ? 'Luar biasa! Kamu telah menjaga api streak membaca hari ini.'
              : 'Api streakmu belum menyala hari ini. Selesaikan 1 bacaan untuk menyalakannya!'}
          </p>
        </div>

        {/* Weekly Calendar Tracker */}
        <div className="p-6 bg-white">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-3 text-center">
            Aktivitas Membaca Minggu Ini
          </span>

          <div className="grid grid-cols-7 gap-2 text-center mb-6">
            {days.map((dayName, idx) => {
              const isActive = streak.weeklyHistory?.[idx];
              const isToday = idx === todayDayIndex;

              return (
                <div key={dayName} className="flex flex-col items-center">
                  <span className="text-[11px] font-black text-slate-400 mb-1.5">{dayName}</span>
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                      isActive
                        ? 'bg-amber-100 border-2 border-amber-300 text-amber-700 shadow-sm'
                        : isToday
                        ? 'bg-[#f6f3ed] border-2 border-dashed border-[#92b4d2] text-[#2c3848]'
                        : 'bg-[#f6f3ed] border-2 border-[#e7e2d8] text-slate-300'
                    }`}
                  >
                    {isActive ? (
                      <StreakFlame active={true} size={26} />
                    ) : isToday ? (
                      <StreakFlame active={false} size={26} />
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
            <div className="p-3.5 rounded-2xl bg-[#edf5fc] border-2 border-[#d3e5f5] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#92b4d2] flex items-center justify-center shrink-0 border border-[#d3e5f5]">
                <Shield size={20} className="fill-[#d3e5f5]" />
              </div>
              <div>
                <b className="text-xs font-black text-[#2c3848] block">
                  {streak.freezeCount}x Pelindung Streak Aktif
                </b>
                <p className="text-[11px] font-bold text-slate-500 leading-snug">
                  Streakmu terlindungi otomatis jika terlewat 1 hari membaca.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#fdfcf9] border-2 border-[#e7e2d8] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <Trophy size={20} className="text-amber-500" />
              </div>
              <div>
                <b className="text-xs font-black text-[#2c3848] block">Target Berikutnya: 7 Hari</b>
                <p className="text-[11px] font-bold text-slate-400 leading-snug">
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
            className="w-full btn-3d-pastel mt-6 py-3 rounded-2xl font-black text-xs sm:text-sm"
          >
            Lanjutkan Membaca Hari Ini
          </button>
        </div>
      </div>
    </div>
  );
}
