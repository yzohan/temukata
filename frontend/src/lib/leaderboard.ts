import type { LeaderboardEntry, LeaderboardPayload } from '../types';
import { getUserProgress } from './gamification';

export const DEFAULT_LEADERBOARD_COHORT: Array<Omit<LeaderboardEntry, 'rank'>> = [
  { userId: 'student-aurelia', displayName: 'Aurelia', points: 1520, equippedBorder: 'flower-garden', rankChange: 0 },
  { userId: 'student-raka', displayName: 'Raka', points: 1340, equippedBorder: 'ice-dream', rankChange: 1 },
  { userId: 'student-nadine', displayName: 'Nadine', points: 1270, equippedBorder: 'cherry-blossom', rankChange: -1 },
  { userId: 'student-jennifer', displayName: 'Jennifer', points: 1020, equippedBorder: 'midnight-blue', rankChange: 3 },
  { userId: 'student-william', displayName: 'William', points: 1000, equippedBorder: 'golden-star', rankChange: 1 },
  { userId: 'student-emory', displayName: 'Emory', points: 920, equippedBorder: 'aurora-night', rankChange: -1 },
  { userId: 'student-lydia', displayName: 'Lydia', points: 900, equippedBorder: 'ocean-pulse', rankChange: 0 },
  { userId: 'student-arvin', displayName: 'Arvin', points: 880, equippedBorder: 'moonlight', rankChange: 2 },
  { userId: 'student-bianca', displayName: 'Bianca', points: 860, equippedBorder: 'flower-garden', rankChange: -1 },
];

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
    rankChange: entry.rankChange ?? null,
  }));
}

export function overlayCurrentUser(
  payload: LeaderboardPayload,
  current: { id: string; displayName: string },
  period: 'weekly' | 'monthly' = 'weekly',
): LeaderboardPayload {
  const progress = getUserProgress();
  const byId = new Map<string, Omit<LeaderboardEntry, 'rank'>>();

  // Baseline cohort
  const cohort = payload.entries.length > 0 ? payload.entries : DEFAULT_LEADERBOARD_COHORT;

  for (const entry of cohort) {
    const multiplier = period === 'monthly' ? 3.4 : 1;
    byId.set(entry.userId, {
      userId: entry.userId,
      displayName: entry.displayName,
      points: Math.round(entry.points * multiplier),
      equippedBorder: entry.equippedBorder,
      rankChange: entry.rankChange,
    });
  }

  // Calculate user points for the period
  const userBase = progress.diamonds > 100 ? progress.diamonds : 980;
  const userPoints = period === 'monthly' ? Math.round(userBase * 3.3) : userBase;

  byId.set(current.id, {
    userId: current.id,
    displayName: current.displayName || byId.get(current.id)?.displayName || 'Kamu',
    points: userPoints,
    equippedBorder: progress.equippedBorder || 'ice-dream',
    rankChange: -2,
  });

  const entries = rankEntries([...byId.values()]);
  const me =
    entries.find(entry => entry.userId === current.id) ||
    payload.currentUser ||
    null;

  return { entries, currentUser: me };
}

function readDemoIdentity(): { id: string; displayName: string } | null {
  try {
    const raw = localStorage.getItem('temukata_demo_auth') || localStorage.getItem('eduvista_demo_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { profile?: { id?: string; display_name?: string; role?: string } };
    if (!parsed.profile?.id) return null;
    if (parsed.profile.role === 'teacher') return null;
    return { id: parsed.profile.id, displayName: parsed.profile.display_name || 'Samantha' };
  } catch {
    return null;
  }
}

/**
 * Membangun data leaderboard lokal dengan cohort siswa & skor pengguna
 */
export function buildLocalLeaderboard(
  current?: { id: string; displayName: string } | null,
  period: 'weekly' | 'monthly' = 'weekly',
): LeaderboardPayload {
  const identity = current || readDemoIdentity() || { id: 'demo-student-me', displayName: 'Samantha' };
  const progress = getUserProgress();
  const byId = new Map<string, Omit<LeaderboardEntry, 'rank'>>();

  const multiplier = period === 'monthly' ? 3.4 : 1;

  for (const entry of DEFAULT_LEADERBOARD_COHORT) {
    byId.set(entry.userId, {
      userId: entry.userId,
      displayName: entry.displayName,
      points: Math.round(entry.points * multiplier),
      equippedBorder: entry.equippedBorder,
      rankChange: entry.rankChange,
    });
  }

  const userBase = progress.diamonds > 100 ? progress.diamonds : 980;
  const userPoints = period === 'monthly' ? Math.round(userBase * 3.3) : userBase;

  byId.set(identity.id, {
    userId: identity.id,
    displayName: identity.displayName,
    points: userPoints,
    equippedBorder: progress.equippedBorder || 'ice-dream',
    rankChange: -2,
  });

  const entries = rankEntries([...byId.values()]);
  const me = entries.find(entry => entry.userId === identity.id) || null;

  return { entries, currentUser: me };
}
