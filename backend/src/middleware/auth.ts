import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
export type UserRole = 'student' | 'teacher';
declare global { namespace Express { interface Request { user?: { id: string; role: UserRole } } } }
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing bearer token' });
  const token = header.slice(7);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired session' });
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
  if (profileError || !profile) return res.status(403).json({ error: 'Profile not found' });
  if (profile.role !== 'student' && profile.role !== 'teacher') return res.status(403).json({ error: 'Invalid role' });
  req.user = { id: data.user.id, role: profile.role as UserRole };
  next();
}
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden for this role' });
    next();
  };
}
