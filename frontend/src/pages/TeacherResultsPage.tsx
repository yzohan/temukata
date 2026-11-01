import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, ClipboardList, Trophy, X } from 'lucide-react';
import AppShell from '../components/AppShell';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { sound } from '../lib/sounds';
import type { StudentAttempt } from '../types';

export default function TeacherResultsPage() {
  const { session } = useAuth();
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      api<StudentAttempt[]>('/teacher/results', session.access_token)
        .then(setAttempts)
        .catch(e => setError(e instanceof Error ? e.message : 'Hasil tidak dapat dimuat.'))
        .finally(() => setLoading(false));
    }
  }, [session]);

  return (
    <AppShell mode="teacher">
      <div className="mb-6">
        <span className="text-[10px] font-black uppercase tracking-wider text-violet-500">
          TEACHER WORKSPACE / ASSESSMENT
        </span>
        <h1 className="mt-1 text-2xl font-black text-slate-800">Nilai & Jawaban Murid</h1>
        <p className="mt-1 text-xs sm:text-sm font-bold text-slate-400">
          Tinjau skor akhir dan verifikasi kalimat yang distabilo oleh murid pada setiap soal.
        </p>
      </div>

      <section className="card-duo p-5 sm:p-6 bg-white">
        <div className="mb-4 flex items-center justify-between pb-3 border-b-2 border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
              <ClipboardList size={20} />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-800">Riwayat Pengumpulan Latihan</h2>
              <p className="text-[11px] font-bold text-slate-400">Pemeriksaan evaluasi membaca otomatis.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-violet-100 text-violet-700 text-xs font-black">
            {attempts.length} Pengumpulan
          </span>
        </div>

        {loading && <p className="py-8 text-center text-xs font-bold text-slate-400">Memuat hasil murid...</p>}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold mb-4">
            {error}
          </div>
        )}

        {!loading && !error && attempts.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <Trophy size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-black text-slate-700">Belum Ada Pengumpulan</p>
            <p className="mt-1 text-xs font-bold text-slate-400">
              Hasil pengerjaan akan muncul otomatis setelah murid menyelesaikan kuis stabilo.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {attempts.map(attempt => {
            const isExp = expanded === attempt.id;
            return (
              <div key={attempt.id} className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setExpanded(isExp ? null : attempt.id);
                  }}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center shrink-0 border border-amber-300">
                      {(attempt.profiles?.display_name || 'M').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <b className="text-sm font-black text-slate-800 block truncate">
                        {attempt.profiles?.display_name || 'Murid'}
                      </b>
                      <span className="text-[11px] font-bold text-slate-400 block truncate mt-0.5">
                        {attempt.lessons?.title || 'Materi'} · {new Date(attempt.submitted_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">
                      Skor {attempt.score} / {attempt.total}
                    </span>
                    {isExp ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </button>

                {isExp && (
                  <div className="p-4 bg-slate-50 border-t-2 border-slate-200 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      Rincian Jawaban Soal:
                    </span>
                    {attempt.answers.map((answer, i) => (
                      <div
                        key={answer.questionId || i}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs font-bold"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              answer.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {answer.correct ? <Check size={14} /> : <X size={14} />}
                          </span>
                          <span className="text-slate-700">Soal {i + 1}</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          Rentang karakter: {answer.start} - {answer.end}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
