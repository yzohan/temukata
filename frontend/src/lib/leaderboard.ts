import type { LeaderboardEntry, LeaderboardPayload } from '../types';
import { getUserProgress } from './gamification';

export interface RegisteredStudent {
  id: string;
  displayName: string;
  points: number;
  equippedBorder?: string;
}

// Mengambil daftar akun murid riil yang pernah login atau register di perangkat ini
export function getRegisteredStudents(): RegisteredStudent[] {
  try {
    const raw = localStorage.getItem('temukata_registered_students');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

// Merekam akun murid riil saat login/register
export function recordRegisteredStudent(student: RegisteredStudent) {
  const list = getRegisteredStudents();
  const idx = list.findIndex(s => s.id === student.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...student };
  } else {
    list.push(student);
  }
  localStorage.setItem('temukata_registered_students', JSON.stringify(list));
}

export function rankEntries(
  raw: Array<Omit<LeaderboardEntry, 'rank'>>,
): LeaderboardEntry[] {
  const sorted = [...raw].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.displayName.localeCompare(b.displayName, 'id');
  });
  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    rankChange: entry.rankChange ?? 0,
  }));
}

/**
 * Memetakan pengguna yang sedang login ke dalam data leaderboard riil dari database.
 * TIDAK MENAMBAH data fiktif / dummy.
 */
export function overlayCurrentUser(
  payload: LeaderboardPayload,
  current: { id: string; displayName: string },
  _period: 'weekly' | 'monthly' | 'all_time' = 'weekly',
): LeaderboardPayload {
  const progress = getUserProgress();
  const byId = new Map<string, Omit<LeaderboardEntry, 'rank'>>();

  // Rekam akun pengguna saat ini ke registry akun riil
  recordRegisteredStudent({
    id: current.id,
    displayName: current.displayName || 'Kamu',
    points: progress.diamonds,
    equippedBorder: progress.equippedBorder || 'ice-dream',
  });

  // 1. Masukkan semua akun riil yang didapat dari query Supabase
  for (const entry of payload.entries) {
    byId.set(entry.userId, {
      userId: entry.userId,
      displayName: entry.displayName,
      points: entry.points,
      equippedBorder: entry.equippedBorder,
      rankChange: entry.rankChange ?? 0,
    });
  }

  // 2. Sinkronkan profil user yang sedang login dengan poin riil
  const existing = byId.get(current.id);
  const actualPoints = existing?.points !== undefined && existing.points > 0 ? existing.points : (progress.diamonds || 0);

  byId.set(current.id, {
    userId: current.id,
    displayName: current.displayName || existing?.displayName || 'Kamu',
    points: actualPoints,
    equippedBorder: progress.equippedBorder || existing?.equippedBorder || 'ice-dream',
    rankChange: existing?.rankChange ?? 0,
  });

  // Pisahkan yang sudah memiliki poin (> 0) dengan yang belum memulai (= 0)
  const allList = [...byId.values()];
  const activeOnly = allList.filter(e => e.points > 0);
  const unstartedFromList = allList.filter(e => e.points === 0).map(e => ({
    ...e,
    rank: 0,
    rankChange: 0,
    status: 'not_started' as const,
  }));

  const entries = rankEntries(activeOnly);
  const me = [...entries, ...unstartedFromList].find(entry => entry.userId === current.id) || null;

  // Gabungkan unstartedUsers dari payload jika ada
  const unstartedMap = new Map<string, LeaderboardEntry>();
  for (const u of payload.unstartedUsers ?? []) {
    unstartedMap.set(u.userId, u);
  }
  for (const u of unstartedFromList) {
    unstartedMap.set(u.userId, u);
  }

  return {
    entries,
    currentUser: me,
    unstartedUsers: [...unstartedMap.values()],
    period: payload.period || _period,
  };
}

/**
 * Fallback lokal murni: hanya menampilkan user-user yang pernah login / register
 */
export function buildLocalLeaderboard(
  current?: { id: string; displayName: string } | null,
  _period: 'weekly' | 'monthly' | 'all_time' = 'weekly',
): LeaderboardPayload {
  const progress = getUserProgress();
  const registered = getRegisteredStudents();
  const byId = new Map<string, Omit<LeaderboardEntry, 'rank'>>();

  for (const student of registered) {
    byId.set(student.id, {
      userId: student.id,
      displayName: student.displayName,
      points: student.points || 0,
      equippedBorder: student.equippedBorder || 'ice-dream',
      rankChange: 0,
    });
  }

  if (current) {
    byId.set(current.id, {
      userId: current.id,
      displayName: current.displayName,
      points: progress.diamonds || 0,
      equippedBorder: progress.equippedBorder || 'ice-dream',
      rankChange: 0,
    });
  }

  const allList = [...byId.values()];
  const activeOnly = allList.filter(e => e.points > 0);
  const unstarted = allList.filter(e => e.points === 0).map(e => ({
    ...e,
    rank: 0,
    rankChange: 0,
    status: 'not_started' as const,
  }));

  const entries = rankEntries(activeOnly);
  const me = current ? [...entries, ...unstarted].find(entry => entry.userId === current.id) || null : null;

  return {
    entries,
    currentUser: me,
    unstartedUsers: unstarted,
    period: _period,
  };
}
