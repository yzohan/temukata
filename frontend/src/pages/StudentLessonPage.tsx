import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Eraser,
  HelpCircle,
  Send,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Mascot from '../components/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { sound } from '../lib/sounds';
import { launchConfetti } from '../lib/confetti';
import {
  awardDiamonds,
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
  const [timeLeft, setTimeLeft] = useState(300); // 5 menit
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

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
          className={`cursor-pointer transition-all rounded-sm px-0.5 ${
            h.correct
              ? 'bg-[#bbf7d0] text-[#14532d] underline decoration-[#22c55e]'
              : 'bg-[#fecaca] text-[#7f1d1d] underline decoration-[#ef4444]'
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

      awardDiamonds(5);
      recordDailyLessonCompletion();
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
    <div className="min-h-screen bg-[#f7f9fd] dark:bg-[#131b26] flex flex-col justify-between text-[#2f4f7f] dark:text-[#d3e3f8] antialiased">
      {/* Top Header & Breadcrumbs */}
      <header className="sticky top-0 z-40 bg-[#f7f9fd]/95 dark:bg-[#131b26]/95 backdrop-blur-md border-b border-[#e5edf7] dark:border-[#223044] px-4 py-3 sm:px-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <Link
            to="/student/materi"
            onClick={() => sound.playPop()}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#5a7394] hover:text-[#1cb0f6] transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Materi &gt; </span>
            <span className="text-[#1e3a5f] dark:text-[#e8f2ff]">Detail Bacaan</span>
          </Link>

          {/* Progress bar and Timer */}
          <div className="flex items-center gap-3 sm:gap-6 flex-1 max-w-md justify-end">
            <div className="w-full max-w-[180px] sm:max-w-xs h-3 bg-[#e8f2ff] dark:bg-[#1f2e42] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#1cb0f6] to-[#3b82f6] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, progressPercent))}%` }}
              />
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black select-none ${
                timeLeft < 60
                  ? 'bg-rose-50 text-rose-500 animate-pulse'
                  : 'bg-white dark:bg-[#1e2e42] border border-[#e5edf7] dark:border-[#2b3e56] text-[#2f4f7f] dark:text-[#a5c7f2]'
              }`}
            >
              <Clock size={14} />
              <span className="tabular-nums">{formatTime(timeLeft)}</span>
            </div>

            <Link
              to="/student"
              onClick={() => sound.playPop()}
              className="w-8 h-8 rounded-xl bg-white dark:bg-[#1e2e42] border border-[#e5edf7] dark:border-[#2b3e56] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              title="Keluar"
            >
              <X size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl w-full flex-1 px-4 sm:px-8 py-6 pb-36">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#dcebfa] border-t-[#1cb0f6] animate-spin mb-4" />
            <p className="text-sm font-black text-[#5a7394]">Menyiapkan bacaan dan modul latihan...</p>
          </div>
        ) : error ? (
          <div className="card-temukata p-6 text-center max-w-md mx-auto">
            <p className="text-sm font-bold text-rose-500">{error}</p>
            <Link
              to="/student"
              className="mt-4 px-4 py-2 rounded-xl bg-[#1cb0f6] text-white text-xs font-black inline-block"
            >
              Kembali ke Beranda
            </Link>
          </div>
        ) : lesson && question ? (
          <div className="space-y-6">
            {/* Scenic Nature Meadow Banner */}
            <div className="w-full h-32 sm:h-44 rounded-3xl overflow-hidden relative shadow-xs border border-[#e5edf7] dark:border-[#24354a]">
              <svg viewBox="0 0 800 240" className="w-full h-full object-cover">
                <rect width="800" height="240" fill="#cde4fd" />
                {/* Fluffy clouds */}
                <ellipse cx="120" cy="50" rx="45" ry="25" fill="#ffffff" opacity="0.85" />
                <ellipse cx="150" cy="45" rx="35" ry="20" fill="#ffffff" opacity="0.85" />
                <ellipse cx="680" cy="65" rx="50" ry="28" fill="#ffffff" opacity="0.8" />
                {/* Rolling Green Hills */}
                <path d="M0,170 Q200,120 400,155 T800,135 L800,240 L0,240 Z" fill="#75ba75" />
                <path d="M0,195 Q250,155 500,185 T800,170 L800,240 L0,240 Z" fill="#5ea85e" />
                {/* Daisies */}
                {[50, 110, 180, 240, 320, 420, 500, 600, 710, 770].map((cx, i) => (
                  <g key={i}>
                    <circle cx={cx} cy={205 + (i % 3) * 6} r="4" fill="#ffffff" />
                    <circle cx={cx} cy={205 + (i % 3) * 6} r="1.8" fill="#f59e0b" />
                  </g>
                ))}
              </svg>
            </div>

            {/* Desktop 2-Column Grid: Left (Reading & Highlighting) + Right (Goals & Instructions) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
              {/* Left Column: Reading Content & Questions */}
              <div className="space-y-5">
                {/* Meta Header */}
                <div className="card-temukata p-5 sm:p-6 dark:bg-[#182332] dark:border-[#24354a]">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-[#e8f2ff] dark:bg-[#1e2e42] text-[10px] font-black text-[#1cb0f6] uppercase tracking-wider">
                      {lesson.subject || 'Teks Eksposisi'}
                    </span>

                    {/* Font Size Selector */}
                    <div className="flex items-center gap-1 bg-[#f7f9fd] dark:bg-[#151f2b] p-1 rounded-xl border border-[#e5edf7] dark:border-[#24354a]">
                      <button
                        onClick={() => setFontSize('sm')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          fontSize === 'sm' ? 'bg-[#1cb0f6] text-white' : 'text-slate-400'
                        }`}
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setFontSize('base')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          fontSize === 'base' ? 'bg-[#1cb0f6] text-white' : 'text-slate-400'
                        }`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => setFontSize('lg')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          fontSize === 'lg' ? 'bg-[#1cb0f6] text-white' : 'text-slate-400'
                        }`}
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-[#1e3a5f] dark:text-[#e8f2ff] leading-snug">
                    {lesson.title}
                  </h1>

                  <div className="flex items-center gap-4 text-xs font-bold text-[#8fa6c1] mt-2 pt-2 border-t border-[#f0f4f9] dark:border-[#24354a]">
                    <span>⏱ {lesson.readingTimeMin || 5} menit</span>
                    <span>❓ 5 soal</span>
                    <span>⭐ Level 3</span>
                  </div>
                </div>

                {/* Question Prompt Card */}
                <div className="card-temukata p-5 bg-white dark:bg-[#182332] dark:border-[#24354a] border-l-4 border-l-[#1cb0f6]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase text-[#1cb0f6]">
                      Soal {index + 1} dari 5
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      Sorot bukti di teks bacaan
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#1e3a5f] dark:text-[#e8f2ff] leading-relaxed">
                    {question.prompt}
                  </h3>
                </div>

                {/* Reading Passage Body with Interactive Sentence Highlighter */}
                <div className="card-temukata p-6 sm:p-8 dark:bg-[#182332] dark:border-[#24354a] relative">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#e5edf7] dark:border-[#24354a]">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-[#1cb0f6]" />
                      <h4 className="font-black text-sm text-[#1e3a5f] dark:text-[#e8f2ff]">
                        Teks Bacaan (Stabilo Digital)
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-[#48bb78] bg-[#e6f7ec] px-2.5 py-0.5 rounded-full">
                      Stabilo Aktif ✨
                    </span>
                  </div>

                  <div
                    ref={articleRef}
                    onMouseUp={captureSelection}
                    onTouchEnd={() => setTimeout(captureSelection, 60)}
                    className={`select-text leading-loose text-[#304d70] dark:text-[#c4d8ef] font-medium cursor-text rounded-xl transition-all ${
                      fontSize === 'sm'
                        ? 'text-sm'
                        : fontSize === 'lg'
                        ? 'text-lg leading-loose'
                        : 'text-base'
                    }`}
                  >
                    {highlightedText}
                  </div>

                  {/* Active Selection Pill */}
                  {selection && isCorrect === null && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-[#e8f2ff] dark:bg-[#1a293d] border border-[#dcebfa] dark:border-[#2a3e56] flex items-center justify-between gap-3 animate-pop">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">🖍️</span>
                        <p className="text-xs font-bold text-[#1e3a5f] dark:text-[#e8f2ff] italic truncate">
                          "{lesson.body.slice(selection.start, selection.end)}"
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          sound.playPop();
                          setSelection(null);
                          window.getSelection()?.removeAllRanges();
                        }}
                        className="text-xs font-black text-slate-500 hover:text-rose-500 flex items-center gap-1 shrink-0"
                      >
                        <Eraser size={14} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Learning Goals & Instructions (Desktop) */}
              <div className="space-y-5 sticky top-24">
                {/* Mascot Mood Box */}
                <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a] flex items-center gap-4">
                  <div className="w-18 h-18 shrink-0 flex items-center justify-center">
                    <Mascot mood={isCorrect === true ? 'happy' : isCorrect === false ? 'wrong' : 'thinking'} size={72} />
                  </div>
                  <div>
                    <b className="text-xs font-black text-[#1e3a5f] dark:text-[#e8f2ff] block">
                      {isCorrect === true ? 'Jawaban Hebat!' : isCorrect === false ? 'Ayo Coba Lagi!' : 'Temukan Bukti!'}
                    </b>
                    <p className="text-[11px] font-semibold text-[#5a7394] dark:text-[#9bb7d9] leading-snug mt-0.5">
                      {isCorrect === true
                        ? 'Analisis kalimatmu sangat tepat dan membuktikan jawaban.'
                        : isCorrect === false
                        ? 'Teliti kembali kalimat pendukung di dalam teks bacaan.'
                        : 'Tarik stabilo pada kalimat yang menjadi bukti jawaban.'}
                    </p>
                  </div>
                </div>

                {/* Tujuan Pembelajaran Card */}
                <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a]">
                  <h4 className="font-black text-sm text-[#1e3a5f] dark:text-[#e8f2ff] mb-3">
                    Tujuan Pembelajaran
                  </h4>
                  <ul className="space-y-2 text-xs font-semibold text-[#5a7394] dark:text-[#9bb7d9]">
                    <li className="flex items-start gap-2">
                      <span className="text-[#22c55e] font-black">✓</span>
                      <span>Mengidentifikasi gagasan pokok paragraf.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#22c55e] font-black">✓</span>
                      <span>Menemukan kalimat bukti pendukung.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#22c55e] font-black">✓</span>
                      <span>Menyimpulkan isi bacaan secara kritis.</span>
                    </li>
                  </ul>
                </div>

                {/* Petunjuk Latihan Card */}
                <div className="card-temukata p-5 dark:bg-[#182332] dark:border-[#24354a]">
                  <h4 className="font-black text-sm text-[#1e3a5f] dark:text-[#e8f2ff] mb-2 flex items-center gap-1.5">
                    <HelpCircle size={16} className="text-[#1cb0f6]" />
                    <span>Petunjuk Latihan</span>
                  </h4>
                  <p className="text-xs font-semibold text-[#5a7394] dark:text-[#9bb7d9] leading-relaxed">
                    Siswa tidak perlu mengetik. Cukup sorot (stabilo) kalimat bukti langsung pada teks bacaan, lalu klik Periksa Jawaban.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-40 border-t transition-all duration-200 px-4 py-4 sm:px-8 ${
          isCorrect === true
            ? 'bg-[#e6f7ec] border-[#bbf7d0]'
            : isCorrect === false
            ? 'bg-[#fef2f2] border-[#fecaca]'
            : 'bg-white/95 dark:bg-[#182332]/95 backdrop-blur-md border-[#e5edf7] dark:border-[#24354a]'
        }`}
      >
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isCorrect === true ? (
              <div className="flex items-center gap-2.5 text-[#14532d]">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black shadow-xs">
                  <CheckCircle2 size={24} className="text-[#22c55e]" />
                </div>
                <div>
                  <span className="text-sm font-black block">Jawaban Tepat!</span>
                  <span className="text-xs font-bold text-[#14532d]/80">Bukti kalimatmu akurat.</span>
                </div>
              </div>
            ) : isCorrect === false ? (
              <div className="flex items-center gap-2.5 text-[#7f1d1d]">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black shadow-xs">
                  <X size={24} className="text-[#ef4444]" />
                </div>
                <div>
                  <span className="text-sm font-black block">Belum Tepat!</span>
                  <span className="text-xs font-bold text-[#7f1d1d]/80">{feedback || 'Sorot kalimat bukti yang lebih sesuai.'}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-bold text-[#5a7394]">
                {selection
                  ? 'Kalimat siap diperiksa! Klik tombol di samping kanan.'
                  : 'Sorot kalimat bukti pada bacaan untuk menjawab soal.'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {isCorrect === null ? (
              <button
                onClick={() => void check()}
                disabled={busy || !selection}
                className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-sm transition-all ${
                  selection
                    ? 'bg-[#1cb0f6] hover:bg-[#0fa0eb] text-white shadow-xs active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {busy ? 'Memeriksa...' : 'Periksa Jawaban'}
              </button>
            ) : index < 4 ? (
              <button
                onClick={next}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#1cb0f6] hover:bg-[#0fa0eb] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
              >
                <span>Soal Berikutnya</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => void submit()}
                disabled={busy || submitted}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#ff9600] hover:bg-[#e07800] text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
              >
                <span>Kirim Hasil Latihan</span>
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Completion Modal */}
      {submitted && finalScore && (
        <div className="fixed inset-0 z-50 bg-[#1e3a5f]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-temukata p-6 sm:p-8 bg-white dark:bg-[#182332] max-w-md w-full text-center space-y-5 animate-pop">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#ebf3fe] flex items-center justify-center text-4xl shadow-xs">
              🎉
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#1e3a5f] dark:text-[#e8f2ff]">
                Latihan Selesai!
              </h2>
              <p className="text-xs font-semibold text-[#5a7394] mt-1">
                Kamu telah menyelesaikan 5 soal pemahaman teks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#ebf3fe] border border-[#dcebfa]">
                <span className="text-[10px] font-black uppercase text-[#1cb0f6]">Skor Akurasi</span>
                <span className="text-2xl font-black text-[#1e3a5f] block mt-0.5">
                  {finalScore.score} / {finalScore.total}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#e6f7ec] border border-[#bbf7d0]">
                <span className="text-[10px] font-black uppercase text-[#22c55e]">Hadiah Poin</span>
                <span className="text-2xl font-black text-[#22c55e] flex items-center justify-center gap-1 mt-0.5">
                  <img src="/gem-diamond.svg" alt="Gem" className="w-5 h-5 object-contain" />
                  +5
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playPop();
                navigate('/student');
              }}
              className="w-full py-3.5 rounded-2xl bg-[#1cb0f6] text-white font-black text-sm shadow-xs hover:bg-[#0fa0eb] active:scale-95 transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
