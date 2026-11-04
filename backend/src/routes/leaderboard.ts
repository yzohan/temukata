import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

type LeaderboardRow = {
  userId: string;
  displayName: string;
  equippedBorder: string;
  points: number;
  rank: number;
  rankChange: number;
  status: 'active' | 'not_started';
};

// 1. Ambil data melalui RPC fungsi get_dynamic_leaderboard di Supabase (dengan timeout 1.8 detik)
async function loadFromDynamicRpc(period: 'weekly' | 'monthly' | 'all_time') {
  try {
    const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 1800));
    const query = (async () => {
      const { data, error } = await supabase.rpc('get_dynamic_leaderboard', {
        p_period: period,
        p_limit: 100,
      });
      if (error || !data || !Array.isArray(data)) return null;

      return data.map((row: any) => ({
        userId: row.user_id,
        displayName: row.display_name,
        equippedBorder: row.equipped_border || 'ice-dream',
        points: Number(row.points ?? 0),
        rank: Number(row.rank ?? 0),
        rankChange: Number(row.rank_change ?? 0),
        status: (row.status === 'active' ? 'active' : 'not_started') as 'active' | 'not_started',
      }));
    })();

    const result = await Promise.race([query, timeout]);
    return result;
  } catch {
    return null;
  }
}

// 2. Query fallback langsung ke tabel point_transactions dan profiles (tanpa data fiktif)
async function loadFromTables(period: 'weekly' | 'monthly' | 'all_time') {
  try {
    // Ambil seluruh profil murid yang terdaftar
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, display_name, equipped_border, diamonds')
      .eq('role', 'student');

    if (pErr || !profiles) return [];

    // Tentukan waktu awal periode
    let periodStart: Date | null = null;
    const now = new Date();
    if (period === 'weekly') {
      // Senin 00:00 WIB
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      periodStart = monday;
    } else if (period === 'monthly') {
      // Tanggal 1 00:00 WIB
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    // Ambil transaksi poin
    let query = supabase.from('point_transactions').select('user_id, points, created_at');
    if (periodStart) {
      query = query.gte('created_at', periodStart.toISOString());
    }
    const { data: transactions } = await query;

    // Agregasikan poin per murid
    const pointsMap = new Map<string, number>();
    for (const tx of transactions || []) {
      pointsMap.set(tx.user_id, (pointsMap.get(tx.user_id) || 0) + Number(tx.points || 0));
    }

    const activeList: LeaderboardRow[] = [];
    const unstartedList: LeaderboardRow[] = [];

    for (const p of profiles) {
      // Jika belum ada point_transactions, gunakan diamonds jika murid sudah punya
      const pts = pointsMap.get(p.id) ?? Number(p.diamonds || 0);
      const studentName = p.display_name || 'Siswa';
      const border = p.equipped_border || 'ice-dream';

      if (pts > 0) {
        activeList.push({
          userId: p.id,
          displayName: studentName,
          equippedBorder: border,
          points: pts,
          rank: 0,
          rankChange: 0,
          status: 'active',
        });
      } else {
        unstartedList.push({
          userId: p.id,
          displayName: studentName,
          equippedBorder: border,
          points: 0,
          rank: 0,
          rankChange: 0,
          status: 'not_started',
        });
      }
    }

    // Hitung DENSE_RANK() untuk peserta aktif
    activeList.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.displayName.localeCompare(b.displayName, 'id');
    });

    let currentRank = 1;
    for (let i = 0; i < activeList.length; i++) {
      const curr = activeList[i];
      const prev = activeList[i - 1];
      if (curr) {
        if (i > 0 && prev && curr.points < prev.points) {
          currentRank = i + 1;
        }
        curr.rank = currentRank;
      }
    }

    return [...activeList, ...unstartedList];
  } catch {
    return [];
  }
}

router.get('/', async (req, res) => {
  try {
    const periodParam = (req.query.period as string) || 'weekly';
    const period =
      periodParam === 'monthly' ? 'monthly' : periodParam === 'all_time' ? 'all_time' : 'weekly';

    // 1. Coba RPC get_dynamic_leaderboard
    let allRows = await loadFromDynamicRpc(period);

    // 2. Jika RPC belum terpasang di database, gunakan query tabel langsung
    if (!allRows || allRows.length === 0) {
      allRows = await loadFromTables(period);
    }

    const entries = allRows.filter(r => r.status === 'active');
    const unstartedUsers = allRows.filter(r => r.status === 'not_started');

    // 3. Deteksi identitas pengguna yang sedang login
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

    let currentUser = currentUserId
      ? allRows.find(entry => entry.userId === currentUserId) || null
      : null;

    return res.json({
      data: {
        entries,
        unstartedUsers,
        currentUser,
        period,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Could not load dynamic leaderboard' });
  }
});

export default router;
