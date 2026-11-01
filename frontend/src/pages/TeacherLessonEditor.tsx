import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../lib/api';
import { sound } from '../lib/sounds';

export default function TeacherLessonEditor() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Biologi');
  const [body, setBody] = useState('');
  const [questions, setQuestions] = useState(Array.from({ length: 5 }, () => ({ prompt: '', answerText: '' })));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  function updateQuestion(i: number, key: 'prompt' | 'answerText', value: string) {
    setQuestions(prev => prev.map((q, index) => (index === i ? { ...q, [key]: value } : q)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    sound.playPop();

    if (!session) {
      setError('Sesi login tidak ditemukan. Silakan masuk kembali.');
      return;
    }

    const invalid = questions.findIndex(q => !q.prompt.trim() || !q.answerText.trim());
    if (invalid !== -1) {
      sound.playError();
      setError(`Soal ${invalid + 1}: pertanyaan dan kunci jawaban harus diisi.`);
      return;
    }

    const missing = questions.findIndex(q => !body.includes(q.answerText.trim()));
    if (missing !== -1) {
      sound.playError();
      setError(`Kunci soal ${missing + 1} tidak ditemukan persis pada teks bacaan. Salin potongan teks jawaban yang benar.`);
      return;
    }

    setBusy(true);
    try {
      await api('/lessons', session.access_token, {
        method: 'POST',
        body: JSON.stringify({
          title,
          subject,
          body,
          published: true,
          questions: questions.map(q => ({ prompt: q.prompt, answerText: q.answerText.trim() })),
        }),
      });

      sound.playSuccess();
      setSuccess('Materi berhasil diterbitkan bersama lima kunci jawaban!');
      setTimeout(() => navigate('/teacher'), 800);
    } catch (e) {
      sound.playError();
      setError(e instanceof Error ? e.message : 'Materi gagal disimpan.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell mode="teacher">
      <Link
        to="/teacher"
        onClick={() => sound.playPop()}
        className="mb-4 inline-flex items-center gap-2 text-xs font-black text-violet-700 hover:underline"
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard Guru
      </Link>

      <div className="mb-6">
        <span className="text-[10px] font-black uppercase tracking-wider text-violet-500">
          TEACHER WORKSPACE / CONTENT EDITOR
        </span>
        <h1 className="mt-1 text-2xl font-black text-slate-800">Buat Materi & Kunci Stabilo</h1>
        <p className="mt-1 text-xs sm:text-sm font-bold text-slate-400">
          Setiap bacaan memiliki lima soal. Salin frasa teks persis dari bacaan untuk menjadi kunci jawaban murid.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {/* Article Info */}
          <section className="card-duo p-5 sm:p-6 bg-white">
            <div className="mb-4 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                <FileText size={20} />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-800">Informasi Bacaan</h2>
                <p className="text-[11px] font-bold text-slate-400">Judul dan isi teks panjang yang akan dibaca murid.</p>
              </div>
            </div>

            <label className="field-label">Judul Materi</label>
            <input
              className="form-field"
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Petualangan Menjelajah Hutan Hujan Tropis"
            />

            <label className="field-label">Mata Pelajaran / Topik</label>
            <select className="form-field" value={subject} onChange={e => setSubject(e.target.value)}>
              <option>Sains</option>
              <option>Sejarah</option>
              <option>Literasi</option>
              <option>Biologi</option>
              <option>Matematika</option>
            </select>

            <label className="field-label">Teks Bacaan Lengkap</label>
            <textarea
              className="form-field min-h-60 leading-relaxed font-semibold resize-y"
              required
              minLength={30}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Tuliskan atau tempel cerita / artikel lengkap di sini..."
            />
            <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>{body.length} karakter</span>
              <span>Minimal 30 karakter</span>
            </div>
          </section>

          {/* 5 Questions */}
          <section className="card-duo p-5 sm:p-6 bg-white">
            <h2 className="text-sm font-black text-slate-800">Lima Pertanyaan Bacaan</h2>
            <p className="mt-0.5 text-xs font-bold text-slate-400 mb-4">
              Setiap soal wajib memiliki pertanyaan dan potongan teks jawaban yang cocok.
            </p>

            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={i} className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-violet-700">SOAL {i + 1} DARI 5</span>
                    <span className="text-[10px] font-black uppercase text-slate-400">Pertanyaan + Kunci</span>
                  </div>

                  <label className="field-label mt-1">Pertanyaan</label>
                  <input
                    className="form-field bg-white"
                    required
                    value={q.prompt}
                    onChange={e => updateQuestion(i, 'prompt', e.target.value)}
                    placeholder="Contoh: Apa fungsi klorofil pada tumbuhan?"
                  />

                  <label className="field-label mt-2">Frasa Jawaban Benar (Salin dari Teks)</label>
                  <input
                    className="form-field bg-white"
                    required
                    value={q.answerText}
                    onChange={e => updateQuestion(i, 'answerText', e.target.value)}
                    placeholder="Salin potongan kalimat persis dari bacaan di atas"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Validation */}
        <aside className="space-y-6">
          <section className="card-duo p-5 sm:p-6 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </span>
              <div>
                <h2 className="text-sm font-black text-slate-800">Validasi Kunci Jawaban</h2>
                <p className="text-[11px] font-bold text-slate-400">Pemeriksaan kecocokan teks otomatis.</p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-500 leading-relaxed mb-4">
              Frasa jawaban harus terdapat persis di dalam teks bacaan. Rentang karakter dihitung di server sehingga kunci jawaban aman dari murid.
            </p>

            <div className="space-y-2.5">
              {questions.map((q, i) => {
                const valid = Boolean(q.answerText.trim() && body.includes(q.answerText.trim()));
                return (
                  <div key={i} className="flex items-start gap-2.5 text-xs font-bold p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        valid ? 'bg-emerald-100 text-[#46a302]' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {valid ? '✓' : i + 1}
                    </span>
                    <div className="min-w-0">
                      <b className="text-slate-700 block">Soal {i + 1}</b>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {q.answerText || 'Kunci belum diisi'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-xs font-bold">
              {success}
            </div>
          )}

          <button
            disabled={busy}
            className="w-full btn-3d-pastel py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
          >
            <Save size={18} />
            <span>{busy ? 'Menyimpan Materi...' : 'Terbitkan Materi & Soal'}</span>
          </button>
        </aside>
      </form>
    </AppShell>
  );
}
