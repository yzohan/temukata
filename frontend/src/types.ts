export type Role = 'student' | 'teacher';

export interface Profile {
  id: string;
  role: Role;
  display_name: string;
}

export interface LessonQuestion {
  id: string;
  position: number;
  prompt: string;
  answer_spans?: Array<{ start: number; end: number }>;
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  body: string;
  published: boolean;
  created_at?: string;
  difficulty?: 'Dasar' | 'Menengah' | 'Lanjutan';
  readingTimeMin?: number;
  questions: LessonQuestion[];
}

export interface AnswerSelection {
  questionId: string;
  start: number;
  end: number;
}

export interface AttemptResult {
  questionId: string;
  start: number;
  end: number;
  correct: boolean;
}

export interface StudentAttempt {
  id: string;
  student_id: string;
  lesson_id: string;
  score: number;
  total: number;
  answers: AttemptResult[];
  submitted_at: string;
  profiles?: { display_name: string };
  lessons?: { title: string; created_by: string };
}

export interface StreakData {
  count: number;
  lastActiveDate: string; // YYYY-MM-DD
  weeklyHistory: boolean[]; // 7 days (Mon-Sun)
  freezeCount: number;
}

export interface StoreItem {
  id: string;
  name: string;
  category: 'border' | 'badge' | 'background';
  price: number;
  description: string;
  rarity?: 'Biasa' | 'Langka' | 'Epik' | 'Legendaris';
  previewColor?: string;
  svgType: string;
}

export interface UserProgress {
  diamonds: number;
  streak: StreakData;
  equippedBorder?: string;
  inventory?: string[];
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  points: number;
  rank: number;
  equippedBorder?: string;
  /** Positive = naik, negative = turun. null jika tidak ada riwayat. */
  rankChange: number | null;
  status?: 'active' | 'not_started';
}

export interface LeaderboardPayload {
  entries: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  unstartedUsers?: LeaderboardEntry[];
  period?: 'weekly' | 'monthly' | 'all_time';
}
