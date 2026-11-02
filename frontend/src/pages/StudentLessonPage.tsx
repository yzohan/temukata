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
    const body = lesson.body;
    const spans: Array<{ start: number; end: number; className: string; key: string }> = [];

    // Permanent confirmed highlights
    highlights.forEach((h, i) => {
      spans.push({
        start: h.start,
        end: h.end,
        className: h.correct
          ? 'bg-[#bbf7d0] dark:bg-[#1c4b2f] text-[#14532d] dark:text-[#86efac] font-bold rounded-sm px-0.5 border-b-2 border-[#22c55e]'
          : 'bg-[#fecaca] dark:bg-[#521c1c] text-[#7f1d1d] dark:text-[#fca5a5] rounded-sm px-0.5',
        key: `hl-${i}`,
      });
    });

    // Current unsubmitted selection
    if (selection) {
      spans.push({
        start: selection.start,
        end: selection.end,
        className:
          'bg-[#fde68a] dark:bg-[#4d3810] text-[#78350f] dark:text-[#fde68a] font-bold rounded-sm px-0.5 border-b-2 border-amber-400 animate-pulse',
        key: 'current-sel',
      });
    }

    spans.sort((a, b) => a.start - b.start);

    // Merge spans and plain text
    const elements: ReactNode[] = [];
    let cursor = 0;

    spans.forEach(s => {
      if (s.start > cursor) {
        elements.push(body.slice(cursor, s.start));
      }
      if (s.end > cursor) {
        const actualStart = Math.max(cursor, s.start);
        elements.push(
          <mark key={s.key} className={s.className}>
            {body.slice(actualStart, s.end)}
          </mark>
        );
        cursor = Math.max(cursor, s.end);
      }
    });

    if (cursor < body.length) {
      elements.push(body.slice(cursor));
    }

    return elements;
  }, [lesson, highlights, selection]);

  // Handle text selection from reader
  const handleMouseUp = useCallback(() => {
    if (isCorrect !== null) return; // Locked once answered
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !articleRef.current) return;

    const range = sel.getRangeAt(0);
    if (!articleRef.current.contains(range.commonAncestorContainer)) return;

    const fullText = lesson?.body || '';
    const selectedText = sel.toString().trim();
    if (selectedText.length < 3) return;

    // Locate offset in full article body
    let start = fullText.indexOf(selectedText);
    if (start === -1) {
      const normalizedFull = fullText.replace(/\s+/g, ' ');
      const normalizedSel = selectedText.replace(/\s+/g, ' ');
      start = normalizedFull.indexOf(normalizedSel);
    }

    if (start >= 0 && question) {
      sound.playPop();
      setSelection({
        questionId: question.id,
        start,
        end: start + selectedText.length,
      });
    }
  }, [lesson, question, isCorrect]);

  // Instant Check Answer
  async function check() {
    if (!selection || !question || !lesson || !session) return;
    setBusy(true);

    try {
      const res = await api<{ correct: boolean }>('/attempts/check', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          lessonId: lesson.id,
          questionId: question.id,
          start: selection.start,
          end: selection.end,
        }),
      });

      setIsCorrect(res.correct);
      setAnswers(prev => ({ ...prev, [question.id]: selection }));
      setHighlights(prev => [...prev, { ...selection, correct: res.correct }]);

      if (res.correct) {
        sound.playSuccess();
        launchConfetti();
        setFeedback('Luar biasa! Kalimat bukti yang kamu temukan sangat tepat.');
      } else {
        sound.playError();
        setFeedback('Belum tepat. Coba perhatikan kata kunci pada pertanyaan dan baca paragraf terkait sekali lagi.');
      }
    } catch {
      sound.playError();
      setFeedback('Gagal memeriksa jawaban. Silakan coba kembali.');
    } finally {
      setBusy(false);
    }
  }

  // Next question
  function next() {
    sound.playPop();
    setSelection(null);
    setIsCorrect(null);
    setFeedback('');
    setIndex(prev => prev + 1);
  }

  // Clear current selection
  function clearSelection() {
    sound.playPop();
    setSelection(null);
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  }

  // Final Submit
  async function submit() {
    if (!lesson || !session) return;
    setBusy(true);

    const payload = {
      lessonId: lesson.id,
      answers: Object.values(answers),
    };

    try {
      const result = await api<{ score: number; total: number }>('/attempts', session.access_token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setFinalScore(result);
      setSubmitted(true);
      sound.playCheer();
      launchConfetti();

      // Award +5 Diamonds
      awardDiamonds(5);

      // Advance Streak
      recordDailyLessonCompletion();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengirim hasil latihan.');
    } finally {
      setBusy(false);
    }
  }

  const progressPercent = Math.round(((index + (isCorrect !== null ? 1 : 0)) / 5) * 100);

  return (
    <div className="min-h-screen bg-[#EBF4FD] dark:bg-[#111C2B] flex flex-col justify-between text-[#304D70] dark:text-[#F0F6FF] antialiased transition-colors duration-250 relative">
      {/* Light Mode Scenic Desktop Wallpaper Background */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-no-repeat bg-cover bg-bottom opacity-100 dark:opacity-0 transition-opacity duration-300 select-none"
        style={{ backgroundImage: "url('/bg-desktop-light.png')" }}
      />
      {/* Soft overlay wash to ensure text readability */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#EBF4FD]/75 via-[#EBF4FD]/45 to-transparent dark:hidden select-none" />

      {/* Top Header & Breadcrumbs */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#1C2A3C]/95 backdrop-blur-md border-b border-[#E2EDF8] dark:border-[#34475E] px-4 py-3 sm:px-8 transition-colors duration-250">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          {/* Breadcrumb Navigation */}
          <Link
            to="/student/materi"
            onClick={() => sound.playPop()}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#526F92] dark:text-[#C0D1E5] hover:text-[#8DB4D8] dark:hover:text-[#8DBBE8] transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Materi &gt; </span>
            <span className="text-[#304D70] dark:text-[#F0F6FF]">Detail Bacaan</span>
          </Link>

          {/* Progress bar and Timer */}
          <div className="flex items-center gap-3 sm:gap-6 flex-1 max-w-md justify-end">
            <div className="w-full max-w-[180px] sm:max-w-xs h-3 bg-[#E8F2FC] dark:bg-[#21334A] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#8DB4D8] to-[#8DBBE8] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, progressPercent))}%` }}
              />
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black select-none ${
                timeLeft < 60
                  ? 'bg-rose-50 text-rose-500 animate-pulse'
                  : 'bg-[#FFFFFF] dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] text-[#304D70] dark:text-[#8DBBE8]'
              }`}
            >
              <Clock size={14} />
              <span className="tabular-nums">{formatTime(timeLeft)}</span>
            </div>

            <Link
              to="/student"
              onClick={() => sound.playPop()}
              className="w-8 h-8 rounded-xl bg-[#FFFFFF] dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] flex items-center justify-center text-[#526F92] dark:text-[#C0D1E5] hover:text-[#304D70] dark:hover:text-white transition-colors"
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
            <div className="w-12 h-12 mx-auto rounded-full border-4 border-[#E8F2FC] border-t-[#8DB4D8] dark:border-[#21334A] dark:border-t-[#8DBBE8] animate-spin mb-4" />
            <p className="text-sm font-black text-[#526F92] dark:text-[#C0D1E5]">Menyiapkan bacaan dan modul latihan...</p>
          </div>
        ) : error ? (
          <div className="card-temukata p-6 text-center max-w-md mx-auto">
            <p className="text-sm font-bold text-rose-500">{error}</p>
            <Link
              to="/student"
              className="mt-4 px-4 py-2 rounded-xl bg-[#8DB4D8] dark:bg-[#8DBBE8] text-white dark:text-[#111C2B] text-xs font-black inline-block"
            >
              Kembali ke Beranda
            </Link>
          </div>
        ) : lesson && question ? (
          <div className="space-y-6">
            {/* Scenic Nature Meadow Banner */}
            <div className="w-full h-32 sm:h-44 rounded-3xl overflow-hidden relative shadow-xs border border-[#E4E8ED] dark:border-[#34475E]">
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
                <div className="bg-[#FFFFFF] dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] rounded-3xl p-5 sm:p-6 shadow-xs transition-colors duration-250">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-[#E8F2FC] dark:bg-[#21334A] text-[10px] font-black text-[#304D70] dark:text-[#8DBBE8] uppercase tracking-wider">
                      {lesson.subject || 'Teks Eksposisi'}
                    </span>

                    {/* Font Size Selector */}
                    <div className="flex items-center gap-1 bg-[#F8F7F2] dark:bg-[#21334A] p-1 rounded-xl border border-[#E4E8ED] dark:border-[#34475E]">
                      <button
                        onClick={() => setFontSize('sm')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          fontSize === 'sm' ? 'bg-[#8DB4D8] text-white' : 'text-[#526F92] dark:text-[#C0D1E5]'
                        }`}
                      >
                        A-
                      </button>
                      <button
                        onClick={() => setFontSize('base')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          fontSize === 'base' ? 'bg-[#8DB4D8] text-white' : 'text-[#526F92] dark:text-[#C0D1E5]'
                        }`}
                      >
                        A
                      </button>
                      <button
                        onClick={() => setFontSize('lg')}
                        className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          fontSize === 'lg' ? 'bg-[#8DB4D8] text-white' : 'text-[#526F92] dark:text-[#C0D1E5]'
                        }`}
                      >
                        A+
                      </button>
                    </div>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-[#304D70] dark:text-[#F0F6FF] leading-snug">
                    {lesson.title}
                  </h1>

                  <div className="flex items-center gap-4 text-xs font-bold text-[#526F92] dark:text-[#C0D1E5] mt-2 pt-2 border-t border-[#E4E8ED] dark:border-[#34475E]">
                    <span>⏱ {lesson.readingTimeMin || 5} menit</span>
                    <span>❓ 5 soal</span>
                    <span>⭐ Level 3</span>
                  </div>
                </div>

                {/* Question Prompt Card */}
                <div className="bg-[#FFFFFF] dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] rounded-3xl p-5 border-l-4 border-l-[#8DB4D8] dark:border-l-[#8DBBE8] shadow-xs transition-colors duration-250">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-black uppercase text-[#304D70] dark:text-[#8DBBE8]">
                      Soal {index + 1} dari 5
                    </span>
                    <span className="text-[11px] font-bold text-[#526F92] dark:text-[#C0D1E5]">
                      Sorot bukti di teks bacaan
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#304D70] dark:text-[#F0F6FF] leading-relaxed">
                    {question.prompt}
                  </h3>
                </div>

                {/* Reading Passage Body with Interactive Sentence Highlighter */}
                <div className="bg-[#FFFFFF] dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] rounded-3xl p-6 sm:p-8 shadow-xs relative transition-colors duration-250">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E4E8ED] dark:border-[#34475E]">
                    <div className="flex items-center gap-2">
                      <BookOpen size={18} className="text-[#8DB4D8] dark:text-[#8DBBE8]" />
                      <h4 className="font-black text-sm text-[#304D70] dark:text-[#F0F6FF]">
                        Teks Bacaan (Stabilo Digital)
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-[#22c55e] bg-[#e6f7ec] dark:bg-[#142e20] px-2.5 py-0.5 rounded-full">
                      Stabilo Aktif ✨
                    </span>
                  </div>

                  {/* Text Container with Selection Listener */}
                  <div
                    ref={articleRef}
                    onMouseUp={handleMouseUp}
                    className={`leading-loose select-text cursor-text font-normal text-[#304D70] dark:text-[#F0F6FF] ${
                      fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'
                    }`}
                  >
                    {highlightedText}
                  </div>

                  {/* Floating Selection Tooltip/Action */}
                  {selection && isCorrect === null && (
                    <div className="mt-4 pt-3 border-t border-[#E4E8ED] dark:border-[#34475E] flex items-center justify-between bg-[#FFF8ED] dark:bg-[#21334A] p-3 rounded-2xl animate-pop">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#304D70] dark:text-[#F0F6FF]">
                        <span>Bukti terpilih:</span>
                        <span className="italic line-clamp-1 max-w-[200px] sm:max-w-xs font-semibold">
                          "{lesson.body.slice(selection.start, selection.end)}"
                        </span>
                      </div>
                      <button
                        onClick={clearSelection}
                        className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1 shrink-0 ml-2"
                      >
                        <Eraser size={14} /> Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Reading Goal, Mascot Hints, & Instructions */}
              <div className="space-y-5">
                {/* Mascot Coach Hint */}
                <div className="bg-[#FFF8ED] dark:bg-[#21334A] border border-[#E4E8ED] dark:border-[#34475E] rounded-3xl p-5 shadow-xs transition-colors duration-250">
                  <Mascot
                    mood={isCorrect === true ? 'cheering' : isCorrect === false ? 'thinking' : 'happy'}
                    message={
                      <span className="text-xs font-bold text-[#304D70] dark:text-[#F0F6FF]">
                        {feedback || 'Tarik kursor untuk menstabilo kalimat yang membuktikan jawabanmu! 🐧'}
                      </span>
                    }
                    size={84}
                  />
                </div>

                {/* Reading Target Card */}
                <div className="bg-[#FFFFFF] dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] rounded-3xl p-5 shadow-xs transition-colors duration-250">
                  <h4 className="font-black text-sm text-[#304D70] dark:text-[#F0F6FF] mb-2 flex items-center gap-1.5">
                    <span>🎯 Target Pembelajaran</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs font-semibold text-[#526F92] dark:text-[#C0D1E5]">
                    <li>• Menemukan kalimat bukti tersurat.</li>
                    <li>• Membedakan fakta utama dan penjelas.</li>
                    <li>• Menyimpulkan gagasan pokok teks.</li>
                  </ul>
                </div>

                {/* Petunjuk Latihan Card */}
                <div className="bg-[#FFFFFF] dark:bg-[#1C2A3C] border border-[#E4E8ED] dark:border-[#34475E] rounded-3xl p-5 shadow-xs transition-colors duration-250">
                  <h4 className="font-black text-sm text-[#304D70] dark:text-[#F0F6FF] mb-2 flex items-center gap-1.5">
                    <HelpCircle size={16} className="text-[#8DB4D8] dark:text-[#8DBBE8]" />
                    <span>Petunjuk Latihan</span>
                  </h4>
                  <p className="text-xs font-semibold text-[#526F92] dark:text-[#C0D1E5] leading-relaxed">
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
        className={`fixed bottom-0 left-0 right-0 z-40 border-t transition-all duration-250 px-4 py-4 sm:px-8 ${
          isCorrect === true
            ? 'bg-[#e6f7ec] dark:bg-[#142e20] border-[#bbf7d0] dark:border-[#22c55e]/30'
            : isCorrect === false
            ? 'bg-[#fef2f2] dark:bg-[#381a1a] border-[#fecaca] dark:border-[#ef4444]/30'
            : 'bg-[#FFFFFF]/95 dark:bg-[#1C2A3C]/95 backdrop-blur-md border-[#E4E8ED] dark:border-[#34475E]'
        }`}
      >
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isCorrect === true ? (
              <div className="flex items-center gap-2.5 text-[#14532d] dark:text-[#86efac]">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1C2A3C] flex items-center justify-center font-black shadow-xs">
                  <CheckCircle2 size={24} className="text-[#22c55e]" />
                </div>
                <div>
                  <span className="text-sm font-black block">Jawaban Tepat!</span>
                  <span className="text-xs font-bold opacity-80">Bukti kalimatmu akurat.</span>
                </div>
              </div>
            ) : isCorrect === false ? (
              <div className="flex items-center gap-2.5 text-[#7f1d1d] dark:text-[#fca5a5]">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-[#1C2A3C] flex items-center justify-center font-black shadow-xs">
                  <X size={24} className="text-[#ef4444]" />
                </div>
                <div>
                  <span className="text-sm font-black block">Belum Tepat!</span>
                  <span className="text-xs font-bold opacity-80">{feedback || 'Sorot kalimat bukti yang lebih sesuai.'}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-bold text-[#526F92] dark:text-[#C0D1E5]">
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
                className={`w-full sm:w-auto px-8 py-3 rounded-2xl font-black text-sm transition-all cursor-pointer ${
                  selection
                    ? 'bg-[#8DB4D8] dark:bg-[#8DBBE8] hover:opacity-90 text-white dark:text-[#111C2B] shadow-xs active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                {busy ? 'Memeriksa...' : 'Periksa Jawaban'}
              </button>
            ) : index < 4 ? (
              <button
                onClick={next}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#8DB4D8] dark:bg-[#8DBBE8] hover:opacity-90 text-white dark:text-[#111C2B] font-black text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>Soal Berikutnya</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => void submit()}
                disabled={busy || submitted}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#F5A65B] dark:bg-[#F8DF9B] hover:opacity-90 text-white dark:text-[#111C2B] font-black text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-[#111C2B]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFFFFF] dark:bg-[#1C2A3C] border-2 border-[#E4E8ED] dark:border-[#34475E] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 animate-pop shadow-2xl transition-colors duration-250">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#E8F2FC] dark:bg-[#21334A] flex items-center justify-center text-4xl shadow-xs">
              🎉
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#304D70] dark:text-[#F0F6FF]">
                Latihan Selesai!
              </h2>
              <p className="text-xs font-semibold text-[#526F92] dark:text-[#C0D1E5] mt-1">
                Kamu telah menyelesaikan 5 soal pemahaman teks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-[#E8F2FC] dark:bg-[#21334A] border border-[#E4E8ED] dark:border-[#34475E]">
                <span className="text-[10px] font-black uppercase text-[#304D70] dark:text-[#8DBBE8]">Skor Akurasi</span>
                <span className="text-2xl font-black text-[#304D70] dark:text-[#F0F6FF] block mt-0.5">
                  {finalScore.score} / {finalScore.total}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#e6f7ec] dark:bg-[#142e20] border border-[#bbf7d0] dark:border-[#22c55e]/30">
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
              className="w-full py-3.5 rounded-2xl bg-[#8DB4D8] dark:bg-[#8DBBE8] text-white dark:text-[#111C2B] font-black text-sm shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
