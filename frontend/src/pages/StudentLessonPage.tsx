import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eraser,
  Send,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Mascot from '../components/Mascot';
import StreakFlame from '../components/StreakFlame';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { sound } from '../lib/sounds';
import { launchConfetti } from '../lib/confetti';
import {
  awardDiamonds,
  getRandomQuote,
  recordDailyLessonCompletion,
} from '../lib/gamification';
import type { AnswerSelection, Lesson } from '../types';
import type { ReactNode } from 'react';

type Highlight = AnswerSelection & { correct: boolean };

export default function StudentLessonPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);

  const [selection, setSelection] = useState<AnswerSelection | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerSelection>>({});
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState<{ score: number; total: number } | null>(null);
  const [motivationalQuote, setMotivationalQuote] = useState(getRandomQuote());
  const [timeLeft, setTimeLeft] = useState(300); // 5 menit = 300 detik

  // 5-minute countdown timer per lesson
  useEffect(() => {
    if (loading || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, submitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    api<Lesson[]>('/lessons', session.access_token)
      .then(items => {
        const found = items.find(l => l.id === id);
        if (!found) throw new Error('Materi tidak ditemukan atau belum diterbitkan.');
        if (found.questions.length !== 5) throw new Error('Materi ini belum memiliki lima soal.');
        setLesson(found);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Materi gagal dimuat.'))
      .finally(() => setLoading(false));
  }, [id, session]);

  const question = lesson?.questions[index];

  // Render text with soft pastel highlights
  const highlightedText = useMemo(() => {
    if (!lesson) return null;
    const sorted = [...highlights].sort((a, b) => a.start - b.start);
    const parts: ReactNode[] = [];
    let cursor = 0;

    sorted.forEach((h, i) => {
      if (h.start < cursor || h.end > lesson.body.length || h.start >= h.end) return;
      if (h.start > cursor) parts.push(lesson.body.slice(cursor, h.start));
      parts.push(
        <mark
          key={`${h.questionId}-${i}`}
          className={`cursor-pointer transition-all ${
            h.correct ? 'mark-correct' : 'mark-wrong'
          }`}
          title={h.correct ? 'Kunci Jawaban Benar! ✨' : 'Jawaban Belum Sesuai ❌'}
        >
          {lesson.body.slice(h.start, h.end)}
        </mark>
      );
      cursor = h.end;
    });

    if (cursor < lesson.body.length) {
      parts.push(lesson.body.slice(cursor));
    }
    return parts;
  }, [lesson, highlights]);

  // Capture text selection from the reading passage
  const captureSelection = useCallback(() => {
    const selected = window.getSelection();
    const root = articleRef.current;
    if (!selected || selected.isCollapsed || !root) return;
    const range = selected.getRangeAt(0);
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return;

    const pre = range.cloneRange();
    pre.selectNodeContents(root);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const text = selected.toString().trim();

    if (text.length > 0) {
      sound.playPop();
      setSelection({
        questionId: question?.id ?? '',
        start,
        end: start + selected.toString().length,
      });
      setFeedback('');
      setIsCorrect(null);
    }
  }, [question]);

  // Check the selected answer
  async function check() {
    if (!session || !question || !selection) {
      sound.playError();
      setFeedback('Pilih dulu kalimat di dalam bacaan dengan stabilo (drag/sorot teks)!');
      return;
    }
    setBusy(true);
    setFeedback('');
    try {
      const result = await api<{ correct: boolean }>('/attempts/check', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          lessonId: id,
          questionId: question.id,
          start: selection.start,
          end: selection.end,
        }),
      });

      setIsCorrect(result.correct);
      setAnswers(prev => ({ ...prev, [question.id]: selection }));
      setHighlights(prev => [
        ...prev.filter(h => h.questionId !== question.id),
        { ...selection, correct: result.correct },
      ]);

      if (result.correct) {
        sound.playSuccess();
        launchConfetti({ particleCount: 50, durationMs: 2000 });
        setFeedback('Tepat sekali! Pilihan kalimatmu membuktikan jawaban dengan sempurna.');
      } else {
        sound.playError();
        setFeedback('Belum tepat. Coba teliti kembali kalimat bukti yang paling sesuai.');
      }
    } catch (e) {
      sound.playError();
      setFeedback(e instanceof Error ? e.message : 'Jawaban gagal diperiksa.');
    } finally {
      setBusy(false);
    }
  }

  // Go to next question
  function next() {
    sound.playPop();
    if (index < 4) {
      setIndex(index + 1);
      setSelection(null);
      setFeedback('');
      setIsCorrect(null);
      window.getSelection()?.removeAllRanges();
    }
  }

  // Submit entire attempt
  async function submit() {
    if (!session || !lesson) return;
    const payload = lesson.questions.map(q => answers[q.id]).filter(Boolean);
    if (payload.length !== 5) {
      sound.playError();
      setFeedback('Selesaikan dan periksa kelima soal sebelum mengirim hasil latihan.');
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ score: number; total: number }>('/attempts', session.access_token, {
        method: 'POST',
        body: JSON.stringify({ lessonId: id, answers: payload }),
      });

      // Award +5 Diamonds
      awardDiamonds(5);

      // Advance Streak
      recordDailyLessonCompletion();

      // Pick fresh quote
      setMotivationalQuote(getRandomQuote());

      setSubmitted(true);
      setFinalScore(result);
      sound.playCheer();
      launchConfetti({ particleCount: 90, durationMs: 3200 });
    } catch (e) {
      sound.playError();
      setFeedback(e instanceof Error ? e.message : 'Latihan gagal dikirim.');
    } finally {
      setBusy(false);
    }
  }

  const progressPercent = Math.round(((index + (isCorrect !== null ? 1 : 0)) / 5) * 100);

  return (
    <div className="min-h-screen bg-[#f6f3ed] flex flex-col justify-between text-[#2c3848]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#fdfcf9]/95 backdrop-blur-md border-b-2 border-[#e7e2d8] px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4">
          <Link
            to="/student"
            onClick={() => sound.playPop()}
            title="Keluar dari Latihan"
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-[#faf8f4] transition-colors"
          >
            <X size={24} />
          </Link>

          {/* Chunky Pastel Progress Bar */}
          <div className="flex-1 max-w-xl">
            <div className="h-4 sm:h-5 rounded-full bg-[#e7e2d8] p-0.5 overflow-hidden shadow-inner relative">
              <div
                className="h-full rounded-full bg-[#92b4d2] transition-all duration-500 ease-out relative"
                style={{ width: `${Math.min(100, Math.max(8, progressPercent))}%` }}
              >
                <div className="absolute top-1 left-2 right-2 h-1 rounded-full bg-white/40" />
              </div>
            </div>
          </div>

          {/* 5-Minute Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 font-black text-xs sm:text-sm select-none transition-colors ${
              timeLeft < 60
                ? 'bg-rose-50 border-rose-200 text-rose-500 animate-pulse'
                : 'bg-[#edf5fc] border-[#d3e5f5] text-[#4a6b8c]'
            }`}
            title="Waktu Mengerjakan Materi (5 Menit)"
          >
            <Clock size={17} className={timeLeft < 60 ? 'text-rose-500' : 'text-[#4a6b8c]'} />
            <span className="tabular-nums tracking-wide">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* Main Reading & Quiz Area */}
      <main className="mx-auto max-w-4xl w-full flex-1 px-4 sm:px-6 py-6 pb-36">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-14 h-14 mx-auto rounded-full border-4 border-[#e7e2d8] border-t-[#92b4d2] animate-spin mb-4" />
            <p className="text-base font-black text-slate-500">Menyiapkan bacaan & kuis stabilo...</p>
          </div>
        ) : error ? (
          <div className="card-duo p-6 bg-rose-50 border-rose-200 text-rose-700 text-center max-w-md mx-auto">
            <p className="text-base font-bold">{error}</p>
            <Link to="/student" className="btn-3d-pastel mt-4 px-4 py-2 rounded-xl inline-block text-xs font-black">
              Kembali ke Peta Petualangan
            </Link>
          </div>
        ) : lesson && question ? (
          <div className="space-y-6">
            {/* Question Card */}
            <div className="card-duo p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {isCorrect !== null && (
                <div className="animate-pop shrink-0">
                  <Mascot
                    mood={isCorrect ? 'happy' : 'wrong'}
                    size={85}
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#edf5fc] text-[#4a6b8c] text-[10px] font-black uppercase tracking-wider">
                    Soal {index + 1} dari 5
                  </span>
                  <span className="text-xs font-black text-slate-400">
                    {lesson.subject}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-[#2c3848] leading-snug">
                  {question.prompt}
                </h1>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  Sorot kalimat pada teks bacaan di bawah ini yang menjadi bukti jawabanmu.
                </p>
              </div>
            </div>

            {/* Reading Passage Card */}
            <div className="card-duo p-5 sm:p-8 bg-white relative">
              <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#f1ede5]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📖</span>
                  <h2 className="text-base sm:text-lg font-black text-[#2c3848]">
                    {lesson.title}
                  </h2>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-[#edf5fc] text-[#4a6b8c] text-xs font-black">
                  Stabilo Aktif ✨
                </span>
              </div>

              {/* Text Body */}
              <div
                ref={articleRef}
                onMouseUp={captureSelection}
                onTouchEnd={() => setTimeout(captureSelection, 60)}
                className="select-text text-base sm:text-lg leading-relaxed text-[#3b495b] font-semibold tracking-normal cursor-text p-2 rounded-xl hover:bg-[#faf8f4] transition-colors"
                style={{ lineHeight: '2.1' }}
              >
                {highlightedText}
              </div>

              {/* Selection Notification Pill */}
              {selection && isCorrect === null && (
                <div className="mt-4 p-3.5 rounded-2xl bg-[#edf5fc] border-2 border-[#d3e5f5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pop">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🖍️</span>
                    <div>
                      <span className="text-[11px] font-black text-[#4a6b8c] uppercase tracking-wider block">
                        Kalimat Terpilih:
                      </span>
                      <p className="text-xs font-bold text-[#2c3848] italic line-clamp-1">
                        "{lesson.body.slice(selection.start, selection.end)}"
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playPop();
                      setSelection(null);
                      window.getSelection()?.removeAllRanges();
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 shrink-0"
                  >
                    <Eraser size={14} />
                    <span>Hapus Pilihan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 transition-all duration-200 px-4 py-4 sm:px-8 ${
          isCorrect === true
            ? 'bg-[#e5f5eb] border-[#c0e6ce]'
            : isCorrect === false
            ? 'bg-[#fdedeb] border-[#fad2cd]'
            : 'bg-white border-[#e7e2d8]'
        }`}
      >
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Feedback message */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isCorrect === true ? (
              <div className="flex items-center gap-2.5 text-[#215934]">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black shadow-sm">
                  <CheckCircle2 size={24} className="text-[#8bcfa4]" />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black block">Jawaban Tepat!</span>
                  <span className="text-xs font-bold text-[#215934]/80">Bukti bacaanmu sangat akurat.</span>
                </div>
              </div>
            ) : isCorrect === false ? (
              <div className="flex items-center gap-2.5 text-[#913430]">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black shadow-sm">
                  <X size={24} className="text-[#f5a39d]" />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black block">Coba Lagi!</span>
                  <span className="text-xs font-bold text-[#913430]/80">{feedback || 'Sorot kembali bagian bukti teks.'}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-bold text-slate-500">
                {selection
                  ? 'Siap memeriksa! Klik tombol di samping kanan.'
                  : 'Sorot kalimat dengan mouse atau sentuh layar untuk memilih jawaban.'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isCorrect === null ? (
              <button
                onClick={() => void check()}
                disabled={busy || !selection}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-sm transition-all ${
                  selection
                    ? 'btn-3d-pastel'
                    : 'bg-[#e7e2d8] text-slate-400 border-b-4 border-[#d5cec2] cursor-not-allowed'
                }`}
              >
                {busy ? 'Memeriksa...' : 'Periksa Jawaban'}
              </button>
            ) : index < 4 ? (
              <button
                onClick={next}
                className="w-full sm:w-auto btn-3d-pastel px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
              >
                <span>Soal Berikutnya</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => void submit()}
                disabled={busy || submitted}
                className="w-full sm:w-auto btn-3d-amber px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
              >
                <span>Kirim Hasil Latihan</span>
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Motivational Celebration Modal on Level Completion */}
      {submitted && finalScore && (
        <div className="fixed inset-0 z-50 bg-[#2c3848]/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-duo p-6 sm:p-8 bg-white max-w-lg w-full text-center animate-pop border-2 border-[#e7e2d8] shadow-2xl my-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Mascot mood="happy" size={90} />
              <div className="w-16 h-16 rounded-2xl bg-amber-100 border-b-4 border-amber-300 flex items-center justify-center text-amber-600 shadow-sm">
                <Trophy size={36} className="animate-bounce" />
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-[#edf5fc] text-[#4a6b8c] text-xs font-black uppercase tracking-wider">
              Level Selesai! 🎉
            </span>

            <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#2c3848]">
              Pencapaian Hebat!
            </h2>

            {/* Motivational Quotes Box */}
            <div className="mt-4 p-4 rounded-2xl bg-[#faf8f4] border-2 border-[#e7e2d8] text-left relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#92b4d2] mb-1">
                <Sparkles size={13} className="text-[#92b4d2]" />
                <span>Kata Motivasi Hari Ini · {motivationalQuote.tag}</span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-[#2c3848] italic leading-relaxed">
                "{motivationalQuote.quote}"
              </p>
              <span className="block mt-1 text-[11px] font-black text-[#92b4d2] text-right">
                — {motivationalQuote.author}
              </span>
            </div>

            {/* Reward Box: 5 Diamonds + Score */}
            <div className="my-5 grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#edf5fc] border-2 border-[#d3e5f5] flex flex-col items-center">
                <span className="text-[10px] font-black uppercase text-[#4a6b8c] tracking-wider">
                  Hadiah Level
                </span>
                <strong className="text-xl sm:text-2xl font-black text-[#1cb0f6] flex items-center gap-1.5 mt-0.5">
                  <img src="/gem-diamond.svg" alt="Permata" className="w-6 h-6 object-contain inline-block" draggable={false} />
                  +5
                </strong>
                <span className="text-[10px] font-bold text-slate-500 mt-0.5">Permata Didapatkan!</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#e5f5eb] border-2 border-[#c0e6ce] flex flex-col items-center">
                <span className="text-[10px] font-black uppercase text-[#215934] tracking-wider">
                  Skor Akurasi
                </span>
                <strong className="text-xl sm:text-2xl font-black text-[#215934] mt-0.5">
                  {finalScore.score} / {finalScore.total}
                </strong>
                <span className="text-[10px] font-bold text-[#215934]/80 mt-0.5 flex items-center gap-1.5">
                  <StreakFlame active={true} size={20} />
                  Streak Menyala!
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playPop();
                navigate('/student');
              }}
              className="w-full btn-3d-pastel py-3.5 rounded-2xl font-black text-sm shadow-sm"
            >
              Kembali ke Peta Petualangan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
