import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LoaderCircle } from 'lucide-react';
import type { Role } from '../types';

export default function RequireRole({ role }: { role: Role }) {
  const { user, profile, loading, configured } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-violet-700"><LoaderCircle className="animate-spin"/></div>;
  if (!configured) return <Navigate to="/login" replace state={{ from: location.pathname, configMissing: true }} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) return <div className="grid min-h-screen place-items-center bg-violet-50 p-6"><div className="max-w-md rounded-2xl bg-white p-6 shadow"><h1 className="text-xl font-bold">Profil belum siap</h1><p className="mt-2 text-sm text-slate-500">Profil belum ditemukan. Pastikan trigger profil pada schema Supabase sudah dijalankan.</p></div></div>;
  if (profile.role !== role) return <Navigate to={profile.role === 'teacher' ? '/teacher' : '/student'} replace />;
  return <Outlet />;
}
