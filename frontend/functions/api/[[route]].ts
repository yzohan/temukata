import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

interface UserAuth {
  id: string;
  email?: string;
  role: 'student' | 'teacher';
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data: unknown, status = 200, request?: Request): Response {
  const headers = new Headers(request ? corsHeaders(request) : {});
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers });
}

function errorResponse(error: string, status = 400, request?: Request, details?: unknown): Response {
  return jsonResponse({ error, details }, status, request);
}

function getSupabaseClient(env: Env) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://xcsfdufhqckzntwvgrdn.supabase.co';
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
  if (!key) {
    throw new Error('Supabase key not configured in environment variables');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function authenticate(request: Request, supabase: ReturnType<typeof createClient>): Promise<UserAuth | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  const role = (profile?.role === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher';
  return { id: data.user.id, email: data.user.email, role };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }

  const url = new URL(request.url);
  // Match path after /api/
  // e.g. /api/lessons -> lessons, /api/attempts/check -> attempts/check
  const subpath = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');

  try {
    const supabase = getSupabaseClient(env);

    // 1. GET /api/health
    if (subpath === 'health' && request.method === 'GET') {
      return jsonResponse({
        data: {
          status: 'ok',
          runtime: 'cloudflare-pages-functions',
          timestamp: new Date().toISOString(),
        },
      }, 200, request);
    }

    // Authenticate user for all remaining protected API endpoints
    const user = await authenticate(request, supabase);
    if (!user) {
      return errorResponse('Invalid or expired session. Missing valid bearer token.', 401, request);
    }

    // 2. GET /api/lessons
    if (subpath === 'lessons' && request.method === 'GET') {
      let query = supabase
        .from('lessons')
        .select('id,title,subject,body,published,created_at,created_by')
        .order('created_at', { ascending: false });

      if (user.role === 'student') {
        query = query.eq('published', true);
      } else {
        query = query.eq('created_by', user.id);
      }

      const { data: lessons, error: lError } = await query;
      if (lError) return errorResponse('Could not load lessons', 500, request);
      if (!lessons || lessons.length === 0) return jsonResponse({ data: [] }, 200, request);

      const ids = lessons.map(l => l.id);
      const cols = user.role === 'teacher'
        ? 'id,lesson_id,position,prompt,answer_spans'
        : 'id,lesson_id,position,prompt';

      const targetTable = user.role === 'student' ? 'student_questions' : 'questions';
      const { data: questions, error: qError } = await supabase
        .from(targetTable)
        .select(cols)
        .in('lesson_id', ids)
        .order('position', { ascending: true });

      if (qError) return errorResponse('Could not load questions', 500, request);

      const combined = lessons.map(lesson => ({
        ...lesson,
        questions: (questions || []).filter(q => q.lesson_id === lesson.id),
      }));

      return jsonResponse({ data: combined }, 200, request);
    }

    // 3. POST /api/lessons (Teacher only)
    if (subpath === 'lessons' && request.method === 'POST') {
      if (user.role !== 'teacher') {
        return errorResponse('Forbidden: Only teachers can create lessons', 403, request);
      }

      const body = await request.json() as {
        title: string;
        subject: string;
        body: string;
        published?: boolean;
        questions: Array<{ prompt: string; answerText: string }>;
      };

      if (!body.title || !body.subject || !body.body || !Array.isArray(body.questions) || body.questions.length !== 5) {
        return errorResponse('Invalid lesson format: title, subject, body, and exactly 5 questions are required', 400, request);
      }

      const questionRows = body.questions.map((question, index) => {
        const start = body.body.indexOf(question.answerText);
        return { question, index, start };
      });

      const missing = questionRows.find(row => row.start < 0);
      if (missing) {
        return errorResponse(`Answer key for question ${missing.index + 1} was not found in the lesson text`, 400, request);
      }

      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title: body.title.trim(),
          subject: body.subject.trim(),
          body: body.body.trim(),
          published: Boolean(body.published),
          created_by: user.id,
        })
        .select('id,title,subject,body,published,created_at')
        .single();

      if (lessonError || !lesson) {
        return errorResponse('Could not create lesson in database', 500, request);
      }

      const rows = questionRows.map(({ question, index, start }) => ({
        lesson_id: lesson.id,
        position: index + 1,
        prompt: question.prompt.trim(),
        answer_spans: [{ start, end: start + question.answerText.length }],
      }));

      const { error: questionError } = await supabase.from('questions').insert(rows);
      if (questionError) {
        await supabase.from('lessons').delete().eq('id', lesson.id).eq('created_by', user.id);
        return errorResponse('Could not save questions; lesson creation was rolled back', 500, request);
      }

      return jsonResponse({ data: lesson }, 201, request);
    }

    // 4. POST /api/attempts/check (Student single answer check)
    if (subpath === 'attempts/check' && request.method === 'POST') {
      const body = await request.json() as {
        lessonId: string;
        questionId: string;
        start: number;
        end: number;
      };

      const { data: lesson, error: lErr } = await supabase
        .from('lessons')
        .select('id,body,published')
        .eq('id', body.lessonId)
        .single();

      if (lErr || !lesson) return errorResponse('Lesson not found', 404, request);
      if (!lesson.published) return errorResponse('Lesson is not published', 403, request);
      if (body.start >= body.end || body.end > lesson.body.length) {
        return errorResponse('Selected text range is invalid', 400, request);
      }

      const { data: question, error: qErr } = await supabase
        .from('questions')
        .select('id,lesson_id,answer_spans')
        .eq('id', body.questionId)
        .eq('lesson_id', body.lessonId)
        .single();

      if (qErr || !question) return errorResponse('Question not found in this lesson', 404, request);

      const spans = (question.answer_spans || []) as Array<{ start: number; end: number }>;
      const correct = spans.some(span => span.start === body.start && span.end === body.end);

      return jsonResponse({ data: { correct } }, 200, request);
    }

    // 5. POST /api/attempts (Submit full quiz attempt)
    if (subpath === 'attempts' && request.method === 'POST') {
      const body = await request.json() as {
        lessonId: string;
        answers: Array<{ questionId: string; start: number; end: number }>;
      };

      if (!body.lessonId || !Array.isArray(body.answers) || body.answers.length !== 5) {
        return errorResponse('Submit exactly five selected answers', 400, request);
      }

      const { data: lesson, error: lErr } = await supabase
        .from('lessons')
        .select('id,published,title')
        .eq('id', body.lessonId)
        .single();

      if (lErr || !lesson) return errorResponse('Lesson not found', 404, request);
      if (!lesson.published) return errorResponse('Lesson is not published', 403, request);

      const { data: questionRows, error: qErr } = await supabase
        .from('questions')
        .select('id,lesson_id,position,answer_spans')
        .eq('lesson_id', body.lessonId)
        .order('position', { ascending: true });

      if (qErr || !questionRows || questionRows.length !== 5) {
        return errorResponse('Lesson questions unavailable', 400, request);
      }

      const results = body.answers.map(answer => {
        const q = questionRows.find(item => item.id === answer.questionId);
        const spans = (q?.answer_spans ?? []) as Array<{ start: number; end: number }>;
        const correct = Boolean(q && spans.some(span => span.start === answer.start && span.end === answer.end));
        return { questionId: answer.questionId, start: answer.start, end: answer.end, correct };
      });

      const score = results.filter(r => r.correct).length;
      const { data: attempt, error: saveError } = await supabase
        .from('attempts')
        .insert({
          student_id: user.id,
          lesson_id: body.lessonId,
          score,
          total: 5,
          answers: results,
        })
        .select('id,score,total,answers,submitted_at')
        .single();

      if (saveError || !attempt) {
        return errorResponse('Could not save attempt to database', 500, request);
      }

      let pointsAwarded = 0;
      try {
        const earnedPoints = 50 + (score * 20);
        const { data: pt } = await supabase.from('point_transactions').insert({
          user_id: user.id,
          points: earnedPoints,
          reason: `Menyelesaikan bacaan: ${(lesson as any)?.title || 'Materi Literasi'}`,
          source_type: 'lesson_completion',
          source_id: body.lessonId,
        }).select().maybeSingle();

        if (pt) {
          pointsAwarded = earnedPoints;
          await supabase.rpc('award_lesson_points', {
            p_user_id: user.id,
            p_lesson_id: body.lessonId,
            p_score: score,
          });
        }
      } catch {}

      return jsonResponse({ data: { ...attempt, pointsAwarded } }, 201, request);
    }

    // 6. GET /api/teacher/results (Teacher evaluation overview)
    if (subpath === 'teacher/results' && request.method === 'GET') {
      if (user.role !== 'teacher') {
        return errorResponse('Forbidden: Only teachers can view results', 403, request);
      }

      const { data, error } = await supabase
        .from('attempts')
        .select('id,student_id,lesson_id,score,total,answers,submitted_at,profiles!attempts_student_id_fkey(display_name),lessons!inner(title,created_by)')
        .eq('lessons.created_by', user.id)
        .order('submitted_at', { ascending: false });

      if (error) return errorResponse('Could not load student results', 500, request);
      return jsonResponse({ data: data || [] }, 200, request);
    }

    // 7. GET /api/teacher/overview
    if (subpath === 'teacher/overview' && request.method === 'GET') {
      if (user.role !== 'teacher') {
        return errorResponse('Forbidden: Only teachers can view overview', 403, request);
      }

      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id);

      const { data: attempts } = await supabase
        .from('attempts')
        .select('id,student_id,lesson_id,score,total,submitted_at,profiles!attempts_student_id_fkey(display_name),lessons!inner(title,created_by)')
        .eq('lessons.created_by', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      return jsonResponse({
        data: {
          totalLessons: totalLessons || 0,
          totalAttempts: attempts?.length || 0,
          recentAttempts: attempts || [],
        },
      }, 200, request);
    }

    // 8. GET /api/leaderboard
    if (subpath === 'leaderboard' && request.method === 'GET') {
      const period = url.searchParams.get('period') || 'weekly';

      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_dynamic_leaderboard', {
          p_period: period,
          p_limit: 100,
        });

        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          const activeEntries: any[] = [];
          const unstartedList: any[] = [];

          for (const r of rpcData) {
            const item = {
              userId: r.user_id,
              displayName: r.display_name,
              equippedBorder: r.equipped_border || 'ice-dream',
              points: Number(r.points || 0),
              rank: Number(r.rank || 0),
              rankChange: r.rank_change != null ? Number(r.rank_change) : 0,
              status: (r.status === 'active' ? 'active' : 'not_started') as 'active' | 'not_started',
            };
            if (item.status === 'active') {
              activeEntries.push(item);
            } else {
              unstartedList.push(item);
            }
          }

          const currentUser = [...activeEntries, ...unstartedList].find(e => e.userId === user.id) || null;
          return jsonResponse({
            data: {
              entries: activeEntries,
              unstartedUsers: unstartedList,
              currentUser,
              period,
            },
          }, 200, request);
        }
      } catch {}

      // Fallback: profiles table
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, diamonds, equipped_border')
        .eq('role', 'student');

      const rows = (profiles || []).map(p => ({
        userId: p.id as string,
        displayName: (p.display_name as string) || 'Siswa',
        equippedBorder: (p as any).equipped_border || 'ice-dream',
        points: Number((p as any).diamonds ?? 0),
        rank: 0,
        rankChange: 0,
        status: (Number((p as any).diamonds ?? 0) > 0 ? 'active' : 'not_started') as 'active' | 'not_started',
      }));

      const active = rows
        .filter(r => r.status === 'active')
        .sort((a, b) => b.points - a.points)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      const unstarted = rows.filter(r => r.status === 'not_started');
      const currentUser = [...active, ...unstarted].find(e => e.userId === user.id) || null;

      return jsonResponse({
        data: {
          entries: active,
          unstartedUsers: unstarted,
          currentUser,
          period,
        },
      }, 200, request);
    }

    return errorResponse(`Endpoint '/api/${subpath}' not found`, 404, request);
  } catch (err: any) {
    return errorResponse(err?.message || 'Internal Server Error', 500, request);
  }
};
