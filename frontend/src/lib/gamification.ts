import type { StoreItem, UserProgress } from '../types';

export const STORE_ITEMS: StoreItem[] = [
  {
    id: 'ice-dream',
    name: 'Ice Dream',
    category: 'border',
    price: 15,
    description: 'Bingkai kristal es lembut dengan mutiara salju.',
    rarity: 'Biasa',
    previewColor: '#8DB4D8',
    svgType: 'ice-dream',
  },
  {
    id: 'flower-garden',
    name: 'Flower Garden',
    category: 'border',
    price: 20,
    description: 'Rangkaian bunga sakura musim semi yang mekar ceria.',
    rarity: 'Langka',
    previewColor: '#F5B9C4',
    svgType: 'flower-garden',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    category: 'border',
    price: 25,
    description: 'Pesona langit malam berbintang emas nan menawan.',
    rarity: 'Langka',
    previewColor: '#304D70',
    svgType: 'midnight-blue',
  },
  {
    id: 'golden-star',
    name: 'Golden Star',
    category: 'border',
    price: 35,
    description: 'Kilauan bintang emas berkilau untuk pembaca hebat.',
    rarity: 'Epik',
    previewColor: '#FFE8A8',
    svgType: 'golden-star',
  },
  {
    id: 'aurora-night',
    name: 'Aurora Night',
    category: 'border',
    price: 40,
    description: 'Pendaran cahaya aurora ungu yang misterius dan anggun.',
    rarity: 'Epik',
    previewColor: '#B088F9',
    svgType: 'aurora-night',
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    category: 'border',
    price: 45,
    description: 'Kelopak bunga sakura lembut beraroma manis.',
    rarity: 'Epik',
    previewColor: '#FF94B8',
    svgType: 'cherry-blossom',
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    category: 'border',
    price: 50,
    description: 'Sinar rembulan perak dengan mutiara bercahaya lembut.',
    rarity: 'Legendaris',
    previewColor: '#7090C0',
    svgType: 'moonlight',
  },
  {
    id: 'ocean-pulse',
    name: 'Ocean Pulse',
    category: 'border',
    price: 50,
    description: 'Deburan ombak samudra biru berhias kerang mutiara.',
    rarity: 'Legendaris',
    previewColor: '#38BDF8',
    svgType: 'ocean-pulse',
  },
];

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
    diamonds: 45,
    streak: {
      count: 0,
      lastActiveDate: '',
      weeklyHistory: [false, false, false, false, false, false, false],
      freezeCount: 1,
    },
    equippedBorder: 'ice-dream',
    inventory: ['ice-dream'],
  };
}

export function getUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProgress;
      if (parsed?.streak) {
        // Ensure inventory and equippedBorder are set
        if (!parsed.inventory || parsed.inventory.length === 0) {
          parsed.inventory = ['ice-dream'];
        }
        if (!parsed.equippedBorder) {
          parsed.equippedBorder = 'ice-dream';
        }
        if (typeof parsed.diamonds !== 'number' || parsed.diamonds < 45) {
          parsed.diamonds = 45;
        }

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

export function buyStoreItem(item: StoreItem): { success: boolean; message: string } {
  const current = getUserProgress();
  if (current.inventory?.includes(item.id)) {
    return { success: false, message: 'Item ini sudah kamu miliki!' };
  }
  if ((current.diamonds || 0) < item.price) {
    return { success: false, message: 'Permata tidak cukup! Selesaikan modul membaca untuk menambah permata.' };
  }
  current.diamonds = (current.diamonds || 0) - item.price;
  if (!current.inventory) current.inventory = [];
  current.inventory.push(item.id);
  current.equippedBorder = item.id;
  saveUserProgress(current);
  return { success: true, message: `Berhasil membeli dan memakai border ${item.name}! ✨` };
}

export function equipBorder(borderId: string): void {
  const current = getUserProgress();
  current.equippedBorder = borderId;
  saveUserProgress(current);
}
