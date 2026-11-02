import type { UserProgress } from '../types';

export const MOTIVATIONAL_QUOTES = [
  {
    quote: 'Membaca adalah petualangan pikiran yang menembus ruang dan waktu.',
    author: 'Carl Sagan',
    tag: 'Eksplorasi',
  },
  {
    quote: 'Satu halaman yang dipahami dengan cermat lebih berharga dari seribu halaman yang hanya dilewati.',
    author: 'Seneca',
    tag: 'Ketelitian',
  },
  {
    quote: 'Setiap baris yang kamu pelajari hari ini membentuk fondasi kebijaksanaan esok hari.',
    author: 'Aristoteles',
    tag: 'Pertumbuhan',
  },
  {
    quote: 'Membaca bukan hanya menyerap kata, melainkan menyalakan lentera pemahaman di dalam dirimu.',
    author: 'TemuKata Mentor',
    tag: 'Inspirasi',
  },
  {
    quote: 'Fokusmu luar biasa! Ketelitianmu menemukan bukti teks membuktikan ketajaman berpikirmu.',
    author: 'TemuKata Lab',
    tag: 'Apresiasi',
  },
  {
    quote: 'Orang yang banyak membaca hidup seribu kehidupan sebelum ia menutup usia.',
    author: 'George R.R. Martin',
    tag: 'Wawasan',
  },
];

const STORAGE_KEY = 'temukata_user_progress';
const EVENT_NAME = 'temukata_progress_update';

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultProgress(): UserProgress {
  return {
    diamonds: 0,
    streak: {
      count: 0,
      lastActiveDate: '',
      weeklyHistory: [false, false, false, false, false, false, false],
      freezeCount: 1,
    },
  };
}

export function getUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProgress;
      if (parsed?.streak) {
        // Auto-migrate legacy 3-day demo dummy data to authentic 0-day start
        if (
          parsed.streak.count === 3 &&
          parsed.streak.weeklyHistory?.[0] === true &&
          parsed.streak.weeklyHistory?.[1] === true &&
          parsed.streak.weeklyHistory?.[2] === false
        ) {
          parsed.streak.count = 0;
          parsed.streak.lastActiveDate = '';
          parsed.streak.weeklyHistory = [false, false, false, false, false, false, false];
          parsed.diamonds = 0;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch {}
        }
        return parsed;
      }
    }
  } catch {}

  const initial = getDefaultProgress();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: progress }));
  } catch {}
}

export function subscribeProgress(callback: (progress: UserProgress) => void): () => void {
  function handler(e: Event) {
    const custom = e as CustomEvent<UserProgress>;
    if (custom.detail) callback(custom.detail);
    else callback(getUserProgress());
  }
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

// Award diamonds (e.g. +5 after completing a level)
export function awardDiamonds(amount: number): { newTotal: number; added: number } {
  const current = getUserProgress();
  current.diamonds = (current.diamonds || 0) + amount;
  saveUserProgress(current);
  return { newTotal: current.diamonds, added: amount };
}

// Record daily learning activity and advance streak
export function recordDailyLessonCompletion(): { currentStreak: number; isFirstToday: boolean } {
  const current = getUserProgress();
  const today = getTodayString();
  const lastActive = current.streak.lastActiveDate;

  let isFirstToday = false;

  if (lastActive !== today) {
    isFirstToday = true;
    const todayDate = new Date(today);

    if (!lastActive) {
      current.streak.count = 1;
    } else {
      const lastDate = new Date(lastActive);
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        current.streak.count += 1;
      } else if (diffDays > 1) {
        if (current.streak.freezeCount > 0) {
          current.streak.freezeCount -= 1;
          current.streak.count += 1;
        } else {
          current.streak.count = 1;
        }
      }
    }

    current.streak.lastActiveDate = today;

    const dayOfWeek = (todayDate.getDay() + 6) % 7;
    if (!current.streak.weeklyHistory) {
      current.streak.weeklyHistory = [false, false, false, false, false, false, false];
    }
    current.streak.weeklyHistory[dayOfWeek] = true;

    saveUserProgress(current);
  }

  return { currentStreak: current.streak.count, isFirstToday };
}

export function getRandomQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}
