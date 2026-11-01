import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
const router = Router();
router.get('/results', authenticate, requireRole('teacher'), async (req, res) => {
  const { data, error } = await supabase.from('attempts')
    .select('id,student_id,lesson_id,score,total,answers,submitted_at,profiles!attempts_student_id_fkey(display_name),lessons!inner(title,created_by)')
    .eq('lessons.created_by', req.user!.id)
    .order('submitted_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'Could not load student results' });
  return res.json({ data: data ?? [] });
});
export default router;
