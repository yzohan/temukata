import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Mascot, { MascotIcon } from '../components/Mascot';
import { useAuth } from '../auth/AuthProvider';
import { sound } from '../lib/sounds';

export default function LoginPage() {
  const { signIn, signInWithGoogle, user, profile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === 'teacher' ? '/teacher' : '/student', { replace: true });
    }
  }, [user, profile, navigate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    sound.playPop();
    try {
      await signIn(email, password);
      sound.playSuccess();
      navigate('/', { replace: true });
    } catch (e) {
      sound.playError();
      setError(e instanceof Error ? e.message : 'Gagal masuk. Periksa email dan password.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setBusy(true);
    sound.playPop();
    try {
      await signInWithGoogle();
      sound.playSuccess();
      navigate('/', { replace: true });
    } catch (e) {
      sound.playError();
      setError(e instanceof Error ? e.message : 'Login Google gagal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f3ed] flex items-center justify-center p-4 sm:p-6 text-[#2c3848]">
      <div className="card-duo bg-white w-full max-w-4xl md:max-w-[920px] overflow-hidden grid md:grid-cols-[1.1fr_1fr] shadow-xl border-2 border-[#e7e2d8]">
        {/* Left Side: Soft Pastel Blue & Warm Cream Chibi Art */}
        <div className="bg-gradient-to-br from-[#92b4d2] to-[#80a4c4] p-8 sm:p-10 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#e7e2d8] overflow-hidden flex items-center justify-center shadow-sm">
                <MascotIcon size={42} />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight block leading-none">TemuKata</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/80 block mt-0.5">
                  Reading Lab ✨
                </span>
              </div>
            </div>

            <div className="mt-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-black text-white mb-3 backdrop-blur-sm">
                <Sparkles size={14} className="text-yellow-200" />
                <span>MEMBACA MENJADI MENYENANGKAN</span>
              </span>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                Membaca Kritis, Temukan Bukti, & Asah Fokus! 🌸
              </h1>
              <p className="mt-3 text-sm font-semibold text-white/90 leading-relaxed">
                Dirancang dengan nuansa lembut dan ramah untuk anak-anak maupun dewasa. Asah ketelitian membaca satu demi satu.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
            <Mascot mood="happy" size={95} />
            <div className="text-xs sm:text-sm font-extrabold text-white">
              <p className="leading-snug">"Halo! Aku Pingu. Yuk mulai petualangan membaca seru hari ini!"</p>
            </div>
          </div>

          {/* Ambient shapes */}
          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Right Side: Clean Form styled like Duolingo */}
        <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#2c3848]">Masuk</h2>
            <p className="mt-1 text-xs sm:text-sm font-bold text-slate-400">
              Masuk untuk melanjutkan petualangan membacamu.
            </p>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <input
                className="auth-input text-sm font-bold placeholder:text-slate-400"
                type="text"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email atau nama pengguna"
              />
            </div>

            <div className="relative">
              <input
                className="auth-input text-sm font-bold pr-12 placeholder:text-slate-400"
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Kata sandi"
              />
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setShowPassword(prev => !prev);
                }}
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#2c3848] transition-colors p-1 rounded-lg"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-bold">
                {error}
              </div>
            )}

            <button
              disabled={busy}
              className="w-full btn-3d-pastel py-3.5 px-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
            >
              <span>{busy ? 'MEMPROSES...' : 'MASUK'}</span>
            </button>
          </form>

          {/* Divider with ATAU */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-[#e7e2d8]" />
            </div>
            <span className="relative bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-400">
              ATAU
            </span>
          </div>

          {/* Google Sign In Button (Duolingo Style) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            className="w-full btn-3d-cream py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 text-xs sm:text-sm font-black tracking-wider uppercase text-slate-700 transition-all hover:border-slate-300 active:scale-95 shadow-xs"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-black text-[#2c3848]">MASUK DENGAN GOOGLE</span>
          </button>

          <p className="mt-5 text-center text-xs font-bold text-slate-500">
            Belum punya akun?{' '}
            <Link className="text-[#92b4d2] font-black hover:underline" to="/register">
              Daftar Murid Baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
