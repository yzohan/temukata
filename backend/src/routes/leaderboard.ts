import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

type RankRow = {
  userId: string;
  displayName: string;
  points: number;
  equippedBorder?: string;
  rankChange?: number | null;
  previousRank?: number | null;
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
  const sorted = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.displayName.localeCompare(b.displayName, 'id');
  });
  return sorted.map((row, index) => {
    const rank = index + 1;
    const rankChange =
      row.rankChange !== undefined && row.rankChange !== null
        ? row.rankChange
        : row.previousRank
        ? row.previousRank - rank
        : 0;
    return {
      userId: row.userId,
      displayName: row.displayName,
      points: row.points,
      rank,
      equippedBorder: row.equippedBorder || 'ice-dream',
      rankChange,
    };
  });
}

// 1. Ambil data melalui RPC fungsi get_leaderboard di Supabase (jika sudah di-deploy)
async function loadFromRpc(period: 'weekly' | 'monthly') {
  try {
    const { data, error } = await supabase.rpc('get_leaderboard', { p_period: period });
    if (error || !data || !Array.isArray(data) || data.length === 0) return null;
    return data.map((row: any) => ({
      userId: row.user_id,
      displayName: row.display_name,
      points: Number(row.points ?? 0),
      equippedBorder: row.equipped_border,
      rankChange: row.rank_change != null ? Number(row.rank_change) : 0,
      previousRank: row.previous_rank != null ? Number(row.previous_rank) : null,
    }));
  } catch {
    return null;
  }
}

// 2. Ambil data langsung dari tabel profiles di Supabase
async function loadFromProfiles(period: 'weekly' | 'monthly') {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, diamonds, weekly_points, monthly_points, total_points, previous_rank, equipped_border')
      .eq('role', 'student');
    if (error || !data || data.length === 0) return null;
    return data.map((row: any) => {
      let points = 0;
      if (period === 'monthly') {
        points = Number(row.monthly_points || row.total_points || (row.diamonds ? row.diamonds * 3 : 0));
      } else {
        points = Number(row.weekly_points || row.diamonds || 0);
      }
      return {
        userId: row.id,
        displayName: row.display_name || 'Siswa',
        points,
        equippedBorder: row.equipped_border || 'ice-dream',
        previousRank: row.previous_rank != null ? Number(row.previous_rank) : null,
      };
    });
  } catch {
    return null;
  }
}

router.get('/', async (req, res) => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';

    // Coba ambil data riil database (RPC -> Profiles Table -> Fallback)
    const rpcRows = await loadFromRpc(period);
    const profileRows = rpcRows ?? await loadFromProfiles(period);
    const rows = profileRows && profileRows.length > 0 ? profileRows : DEFAULT_COHORT;

    const entries = toEntries(rows, period);

    // Cek auth header jika tersedia
    let currentUserId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const { data: userRes } = await supabase.auth.getUser(token);
        if (userRes?.user?.id) {
          currentUserId = userRes.user.id;
        }
      } catch {}
    }

    const currentUser = currentUserId
      ? entries.find(entry => entry.userId === currentUserId) || null
      : null;

    return res.json({ data: { entries, currentUser } });
  } catch (error) {
    return res.status(500).json({ error: 'Could not load leaderboard' });
  }
});

export default router;
