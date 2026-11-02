import type { StreakData } from '../types';

export function isStreakActiveToday(streak?: StreakData | null): boolean {
  if (!streak || streak.count <= 0) return false;
  const today = new Date().toISOString().slice(0, 10);
  return streak.lastActiveDate === today;
}

interface StreakFlameProps {
  active?: boolean;
  size?: number;
  className?: string;
  animate?: boolean;
}

export default function StreakFlame({
  active = false,
  size = 20,
  className = '',
  animate = true,
}: StreakFlameProps) {
  // If active: animated SVG with burning motion.
  // If inactive: 100% static grey SVG with no movement.
  const src = active ? '/streak-active.svg' : '/streak-inactive.svg';
  return (
    <img
      src={src}
      alt={active ? 'Streak Aktif' : 'Streak Mati / Belum Belajar'}
      style={{ width: size, height: size }}
      className={`object-contain inline-block shrink-0 select-none ${
        active && animate ? 'animate-wiggle' : ''
      } ${className}`}
      draggable={false}
    />
  );
}
