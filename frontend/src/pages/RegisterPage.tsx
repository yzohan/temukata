import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { sound } from '../lib/sounds';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    sound.playPop();

    if (password !== confirm) {
      sound.playError();
      setError('Konfirmasi password belum cocok.');
      return;
    }
    if (password.length < 6) {
      sound.playError();
      setError('Password minimal 6 karakter.');
      return;
    }

    setBusy(true);
    try {
      const hasSession = await signUp(name.trim(), email.trim(), password);
      sound.playSuccess();
      if (hasSession) {
        setSuccess('Akun berhasil dibuat! Mengarahkan ke petualangan membaca...');
        setTimeout(() => navigate('/student', { replace: true }), 800);
      } else {
        setSuccess('Pendaftaran terkirim! Periksa email untuk verifikasi atau gunakan akun demo.');
      }
    } catch (e) {
      sound.playError();
      setError(e instanceof Error ? e.message : 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3ed] flex items-center justify-center p-4 sm:p-6 text-[#2c3848]">
      <div className="card-duo bg-white w-full max-w-4xl md:max-w-[920px] overflow-hidden grid md:grid-cols-[1.1fr_1fr] shadow-xl border-2 border-[#e7e2d8]">
        {/* Left Side: Soft Pastel Blue Chibi Art */}
        <div className="bg-gradient-to-br from-[#92b4d2] to-[#80a4c4] p-8 sm:p-10 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-white/80 hover:text-white mb-6"
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Halaman Masuk</span>
            </Link>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black text-white mb-3 backdrop-blur-sm">
              <Sparkles size={14} className="text-yellow-200" />
              <span>GABUNG BERSAMA RIBUAN TEMAN</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-black leading-tight">
              Daftar Murid Baru & Mulai Petualangan! 🎒
            </h1>
            <p className="mt-3 text-sm font-semibold text-white/90 leading-relaxed">
              Jelajahi teks pilihan, temukan kalimat bukti dengan stabilo, dan jaga streak harianmu.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4 bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
            <Mascot mood="happy" size={95} />
            <div className="text-xs sm:text-sm font-extrabold text-white">
              <p className="leading-snug">"Gratis, gemas, dan bikin kamu makin pintar membaca!"</p>
            </div>
          </div>

          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Right Side: Form */}
        <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#2c3848]">Buat Akun Murid 📝</h2>
            <p className="mt-1 text-xs sm:text-sm font-bold text-slate-400">
              Isi data singkat di bawah ini untuk memulai.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label className="field-label">Nama Lengkap</label>
              <input
                className="auth-input"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nama panggilan atau nama lengkapmu"
              />
            </div>

            <div>
              <label className="field-label">Email</label>
              <input
                className="auth-input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                className="auth-input"
                type="password"
                minLength={6}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="field-label">Ulangi Password</label>
              <input
                className="auth-input"
                type="password"
                minLength={6}
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Ketik ulang password"
              />
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700 text-xs font-bold">
                {success}
              </div>
            )}

            <button
              disabled={busy}
              className="w-full btn-3d-pastel py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>{busy ? 'Mendaftar...' : 'Daftar Sekarang'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="mt-5 text-center text-xs font-bold text-slate-500">
            Sudah punya akun?{' '}
            <Link className="text-[#92b4d2] font-black hover:underline" to="/login">
              Masuk di Sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
