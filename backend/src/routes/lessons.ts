import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
const lessonSchema = z.object({
  title: z.string().trim().min(3).max(160), subject: z.string().trim().min(2).max(80),
  body: z.string().trim().min(30).max(50000), published: z.boolean().default(false),
  questions: z.array(z.object({ prompt: z.string().trim().min(3).max(500), answerText: z.string().trim().min(1).max(2000) })).length(5),
});
router.get('/', authenticate, async (req, res) => {
  let query = supabase.from('lessons').select('id,title,subject,body,published,created_at,created_by').order('created_at', { ascending: false });
  if (req.user!.role === 'student') query = query.eq('published', true);
  else query = query.eq('created_by', req.user!.id);
  const { data: lessons, error } = await query;
  if (error) return res.status(500).json({ error: 'Could not load lessons' });
  if (!lessons?.length) return res.json({ data: [] });
  const ids = lessons.map(l => l.id);
  const cols = req.user!.role === 'teacher' ? 'id,lesson_id,position,prompt,answer_spans' : 'id,lesson_id,position,prompt';
  const { data: questions, error: qError } = await supabase.from(req.user!.role === 'student' ? 'student_questions' : 'questions').select(cols).in('lesson_id', ids).order('position', { ascending: true });
  if (qError) return res.status(500).json({ error: 'Could not load questions' });
  const data = lessons.map(lesson => ({ ...lesson, questions: ((questions as any[]) ?? []).filter(q => q.lesson_id === lesson.id) }));
  return res.json({ data });
});
router.post('/', authenticate, requireRole('teacher'), async (req, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid lesson data', details: parsed.error.flatten() });
  const input = parsed.data;
  const questionRows = input.questions.map((question, index) => {
    const start = input.body.indexOf(question.answerText);
    return { question, index, start };
  });
  const missing = questionRows.find(row => row.start < 0);
  if (missing) return res.status(400).json({ error: `Answer key for question ${missing.index + 1} was not found in the lesson text` });
  const { data: lesson, error: lessonError } = await supabase.from('lessons').insert({
    title: input.title, subject: input.subject, body: input.body, published: input.published, created_by: req.user!.id,
  }).select('id,title,subject,body,published,created_at').single();
  if (lessonError || !lesson) return res.status(500).json({ error: 'Could not create lesson' });
  const rows = questionRows.map(({ question, index, start }) => ({
    lesson_id: lesson.id, position: index + 1, prompt: question.prompt,
    answer_spans: [{ start, end: start + question.answerText.length }],
  }));
  const { error: questionError } = await supabase.from('questions').insert(rows);
  if (questionError) {
    await supabase.from('lessons').delete().eq('id', lesson.id).eq('created_by', req.user!.id);
    return res.status(500).json({ error: 'Could not save questions; lesson creation was rolled back' });
  }
  return res.status(201).json({ data: lesson });
});
export default router;
