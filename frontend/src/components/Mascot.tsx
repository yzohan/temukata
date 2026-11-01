import type { ReactNode } from 'react';

interface MascotProps {
  mood?: 'happy' | 'cheering' | 'thinking' | 'correct' | 'wrong';
  message?: ReactNode;
  size?: number;
  className?: string;
}

export default function Mascot({
  mood = 'happy',
  message,
  size = 100,
  className = '',
}: MascotProps) {
  const isWrong = mood === 'wrong';
  const isThinking = mood === 'thinking';

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Official TemuKata Chubby Penguin Mascot */}
      <div
        className="temukata-mascot relative shrink-0 select-none cursor-pointer"
        style={{
          width: size,
          ['--mascot-size' as string]: `${size}px`,
        }}
      >
        <img
          src="/temukata-penguin.svg"
          alt="TemuKata Penguin Mascot"
          className="w-full h-auto drop-shadow-sm pointer-events-none select-none"
          draggable={false}
        />

        {/* Adorable Natural Eye-Blinking Overlay */}
        <div className="absolute inset-0 pointer-events-none temukata-blink-layer">
          {/* Left Eye Lid */}
          <span
            className="absolute rounded-full bg-white border-b-2 border-[#364b73]"
            style={{
              left: '40.4%',
              top: '37.3%',
              width: '3.6%',
              height: '2.8%',
            }}
          />
          {/* Right Eye Lid */}
          <span
            className="absolute rounded-full bg-white border-b-2 border-[#364b73]"
            style={{
              left: '57.6%',
              top: '37.3%',
              width: '3.6%',
              height: '2.8%',
            }}
          />
        </div>

        {/* Thinking Bubble */}
        {isThinking && (
          <div className="absolute -top-3 -right-2 text-base animate-bounce">
            💭
          </div>
        )}

        {/* Wrong/Oops Sweat Drop */}
        {isWrong && (
          <div className="absolute top-2 -right-1 text-xs animate-wiggle">
            💧
          </div>
        )}
      </div>

      {/* Speech Bubble */}
      {message && (
        <div className="relative rounded-2xl border-2 border-[#e7e2d8] bg-white p-3.5 shadow-sm text-xs md:text-sm font-extrabold text-[#2c3848] leading-snug">
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-y-6 border-y-transparent border-r-6 border-r-white z-10" />
          <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-0 h-0 border-y-7 border-y-transparent border-r-7 border-r-[#e7e2d8]" />
          {message}
        </div>
      )}
    </div>
  );
}

// Mini Mascot Icon for Navbar and Logo
export function MascotIcon({ size = 42, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none shrink-0 flex items-center justify-center ${className}`}
    >
      <img
        src="/temukata-penguin.svg"
        alt="TemuKata Mascot Icon"
        className="w-full h-full object-contain pointer-events-none select-none transition-transform hover:scale-110 active:scale-95"
        draggable={false}
      />
    </div>
  );
}
