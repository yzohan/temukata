import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { PropsWithChildren } from 'react';
import type { Profile, Role } from '../types';
import { supabase, supabaseConfigured } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  switchRole: (role: Role) => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

const TEACHER_EMAIL = 'ijah@gmail.com';
const TEACHER_PASS = 'admin123';
const DEMO_STUDENT_EMAIL = 'budi@gmail.com';
const DEMO_STUDENT_PASS = 'budi123';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user || !supabase) { setProfile(null); return; }
    const { data, error } = await supabase.from('profiles').select('id, role, display_name').eq('id', user.id).maybeSingle();
    if (error) throw error;
    setProfile(data as Profile | null);
  }, []);

  useEffect(() => {
    // Check if demo session exists in localStorage
    try {
      const savedDemo = localStorage.getItem('temukata_demo_auth') || localStorage.getItem('eduvista_demo_auth');
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo) as { session: Session; profile: Profile };
        setSession(parsed.session);
        setProfile(parsed.profile);
        setIsDemo(true);
        setLoading(false);
        return;
      }
    } catch {}

    if (!supabase) { setLoading(false); return; }
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      try { await loadProfile(data.session?.user ?? null); } catch (error) { console.error('Could not load profile', error); }
      if (mounted) setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      queueMicrotask(() => { void loadProfile(nextSession?.user ?? null).catch(error => console.error('Profile refresh failed', error)); });
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Akun Khusus Admin / Guru (Ijah)
    if (cleanEmail === TEACHER_EMAIL && password === TEACHER_PASS) {
      const teacherUser = {
        id: 'user-teacher-ijah',
        email: TEACHER_EMAIL,
        app_metadata: {},
        user_metadata: { display_name: 'Ijah (Guru)' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as User;

      const teacherSession = {
        access_token: 'token-teacher-ijah',
        token_type: 'bearer',
        user: teacherUser,
        expires_in: 86400,
        refresh_token: 'refresh-token-teacher'
      } as unknown as Session;

      const teacherProfile: Profile = {
        id: 'user-teacher-ijah',
        role: 'teacher',
        display_name: 'Ijah (Guru)'
      };

      localStorage.setItem('temukata_demo_auth', JSON.stringify({ session: teacherSession, profile: teacherProfile }));
      setSession(teacherSession);
      setProfile(teacherProfile);
      setIsDemo(true);
      return;
    }

    // 2. Akun Demo Siswa (Budi)
    if (cleanEmail === DEMO_STUDENT_EMAIL && password === DEMO_STUDENT_PASS) {
      const studentUser = {
        id: 'user-student-budi',
        email: DEMO_STUDENT_EMAIL,
        app_metadata: {},
        user_metadata: { display_name: 'Budi Santoso' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as User;

      const studentSession = {
        access_token: 'token-student-budi',
        token_type: 'bearer',
        user: studentUser,
        expires_in: 86400,
        refresh_token: 'refresh-token-student'
      } as unknown as Session;

      const studentProfile: Profile = {
        id: 'user-student-budi',
        role: 'student',
        display_name: 'Budi Santoso'
      };

      localStorage.setItem('temukata_demo_auth', JSON.stringify({ session: studentSession, profile: studentProfile }));
      setSession(studentSession);
      setProfile(studentProfile);
      setIsDemo(true);
      return;
    }

    if (!supabase) {
      throw new Error('Akun tidak terdaftar. Gunakan akun Guru (ijah@gmail.com / admin123) atau Masuk dengan Google.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (supabase && supabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase Google OAuth failed or not configured, falling back to instant Google login demo:', err);
      }
    }

    // Instant Google login demo for local testing
    const demoRole: Role = (localStorage.getItem('temukata_demo_role') as Role) || (localStorage.getItem('eduvista_demo_role') as Role) || 'student';
    const googleUser = {
      id: 'demo-google-user',
      email: 'ijah@gmail.com',
      app_metadata: { provider: 'google' },
      user_metadata: {
        display_name: 'Ijah (Guru)',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=IjahGuru',
      },
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as unknown as User;

    const googleSession = {
      access_token: 'demo-token-google-ijah',
      token_type: 'bearer',
      user: googleUser,
      expires_in: 86400,
      refresh_token: 'demo-refresh-token-google'
    } as unknown as Session;

    const googleProfile: Profile = {
      id: 'demo-google-user',
      role: demoRole,
      display_name: 'Ijah (Guru)'
    };

    localStorage.setItem('temukata_demo_auth', JSON.stringify({ session: googleSession, profile: googleProfile }));
    setSession(googleSession);
    setProfile(googleProfile);
    setIsDemo(true);
  }, []);

  const switchRole = useCallback((newRole: Role) => {
    localStorage.setItem('temukata_demo_role', newRole);
    setProfile(prev => prev ? { ...prev, role: newRole } : null);
    if (session) {
      const updatedProfile = { id: session.user.id, role: newRole, display_name: session.user.user_metadata?.display_name || 'Ijah (Guru)' };
      localStorage.setItem('temukata_demo_auth', JSON.stringify({ session, profile: updatedProfile }));
    }
  }, [session]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi. Gunakan login ijah@gmail.com atau Masuk dengan Google.');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
    if (error) throw error;
    return Boolean(data.session);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('temukata_demo_auth');
    localStorage.removeItem('eduvista_demo_auth');
    setIsDemo(false);
    if (supabase) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
    setSession(null); setProfile(null);
  }, []);

  const reloadProfile = useCallback(async () => { await loadProfile(session?.user ?? null); }, [loadProfile, session?.user]);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    session,
    profile,
    loading,
    configured: supabaseConfigured || isDemo || true,
    isDemo,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    reloadProfile,
    switchRole
  }), [session, profile, loading, isDemo, signIn, signInWithGoogle, signUp, signOut, reloadProfile, switchRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
