import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';
const router = Router();
const selectionSchema = z.object({ lessonId: z.string().uuid(), questionId: z.string().uuid(), start: z.number().int().nonnegative(), end: z.number().int().positive() });
const submitSchema = z.object({ lessonId: z.string().uuid(), answers: z.array(z.object({ questionId: z.string().uuid(), start: z.number().int().nonnegative(), end: z.number().int().positive() })).length(5) });
async function checkSelection(lessonId: string, questionId: string, start: number, end: number) {
  const { data: lesson, error: lessonError } = await supabase.from('lessons').select('id,body,published').eq('id', lessonId).single();
  if (lessonError || !lesson) return { error: 'Lesson not found', status: 404 as const };
  if (!lesson.published) return { error: 'Lesson is not published', status: 403 as const };
  if (start >= end || end > lesson.body.length) return { error: 'Selected text range is invalid', status: 400 as const };
  const { data: question, error } = await supabase.from('questions').select('id,lesson_id,answer_spans').eq('id', questionId).eq('lesson_id', lessonId).single();
  if (error || !question) return { error: 'Question not found in this lesson', status: 404 as const };
  const spans = question.answer_spans as Array<{ start: number; end: number }>;
  return { correct: spans.some(span => span.start === start && span.end === end), status: 200 as const };
}
router.post('/check', authenticate, requireRole('student'), async (req, res) => {
  const parsed = selectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid selected text range', details: parsed.error.flatten() });
  const result = await checkSelection(parsed.data.lessonId, parsed.data.questionId, parsed.data.start, parsed.data.end);
  if ('error' in result) return res.status(result.status).json({ error: result.error });
  return res.json({ data: { correct: result.correct } });
});
router.post('/', authenticate, requireRole('student'), async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Submit exactly five selected answers', details: parsed.error.flatten() });
  const { lessonId, answers } = parsed.data;
  if (new Set(answers.map(a => a.questionId)).size !== 5) return res.status(400).json({ error: 'Each of the five questions must appear once' });
  const { data: lesson, error: lessonError } = await supabase.from('lessons').select('id,published').eq('id', lessonId).single();
  if (lessonError || !lesson) return res.status(404).json({ error: 'Lesson not found' });
  if (!lesson.published) return res.status(403).json({ error: 'Lesson is not published' });
  const { data: questionRows, error: questionsError } = await supabase.from('questions').select('id,lesson_id,position,answer_spans').eq('lesson_id', lessonId).order('position', { ascending: true });
  if (questionsError || !questionRows || questionRows.length !== 5) return res.status(400).json({ error: 'Lesson does not have five questions' });
  const results = answers.map(answer => {
    const q = questionRows.find(item => item.id === answer.questionId);
    const spans = (q?.answer_spans ?? []) as Array<{ start: number; end: number }>;
    const correct = Boolean(q && q.lesson_id === lessonId && spans.some(span => span.start === answer.start && span.end === answer.end));
    return { questionId: answer.questionId, start: answer.start, end: answer.end, correct };
  });
  if (results.some(result => !questionRows.some(q => q.id === result.questionId))) return res.status(400).json({ error: 'One or more question IDs are invalid' });
  const score = results.filter(result => result.correct).length;
  const { data: attempt, error: saveError } = await supabase.from('attempts').insert({ student_id: req.user!.id, lesson_id: lessonId, score, total: 5, answers: results }).select('id,score,total,answers,submitted_at').single();
  if (saveError || !attempt) return res.status(500).json({ error: 'Could not save attempt' });
  return res.status(201).json({ data: attempt });
});
export default router;
