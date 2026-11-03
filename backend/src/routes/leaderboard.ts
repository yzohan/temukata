import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

type RankRow = {
  userId: string;
  displayName: string;
  points: number;
  equippedBorder?: string;
  rankChange?: number | null;
};

const DEFAULT_COHORT: RankRow[] = [
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

function toEntries(rows: RankRow[], period: 'weekly' | 'monthly' = 'weekly') {
  const multiplier = period === 'monthly' ? 3.4 : 1;
  const sorted = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.displayName.localeCompare(b.displayName, 'id');
  });
  return sorted.map((row, index) => ({
    userId: row.userId,
    displayName: row.displayName,
    points: Math.round(row.points * multiplier),
    rank: index + 1,
    equippedBorder: row.equippedBorder,
    rankChange: row.rankChange ?? (index === 0 ? 0 : index % 2 === 0 ? 1 : -1),
  }));
}

async function loadFromDiamonds() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, diamonds, equipped_border')
      .eq('role', 'student');
    if (error || !data || data.length === 0) return null;
    return data.map(row => ({
      userId: row.id as string,
      displayName: (row.display_name as string) || 'Siswa',
      points: Number(row.diamonds ?? 0),
      equippedBorder: (row.equipped_border as string) || undefined,
    }));
  } catch {
    return null;
  }
}

async function loadFromAttempts(): Promise<RankRow[]> {
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, equipped_border')
      .eq('role', 'student');

    const { data: attempts } = await supabase
      .from('attempts')
      .select('student_id, score');

    if (!profiles || profiles.length === 0) return DEFAULT_COHORT;

    const points = new Map<string, number>();
    for (const attempt of attempts || []) {
      points.set(attempt.student_id, (points.get(attempt.student_id) || 0) + Number(attempt.score || 0));
    }

    return (profiles || []).map(profile => ({
      userId: profile.id as string,
      displayName: (profile.display_name as string) || 'Siswa',
      points: points.get(profile.id as string) || 0,
      equippedBorder: (profile.equipped_border as string) || undefined,
    }));
  } catch {
    return DEFAULT_COHORT;
  }
}

router.get('/', authenticate, requireRole('student', 'teacher'), async (req, res) => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
    const diamondRows = await loadFromDiamonds();
    let rows = diamondRows ?? await loadFromAttempts();
    if (!rows || rows.length < 3) {
      // Merge with cohort if too few rows in database
      const existingIds = new Set((rows || []).map(r => r.userId));
      const remainingCohort = DEFAULT_COHORT.filter(c => !existingIds.has(c.userId));
      rows = [...(rows || []), ...remainingCohort];
    }
    const entries = toEntries(rows, period);
    const currentUser = entries.find(entry => entry.userId === req.user!.id) || null;
    return res.json({ data: { entries, currentUser } });
  } catch (error) {
    return res.status(500).json({ error: 'Could not load leaderboard' });
  }
});

export default router;
