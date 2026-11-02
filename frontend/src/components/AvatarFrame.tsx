interface AvatarFrameProps {
  borderId?: string;
  size?: number;
  className?: string;
  avatarSrc?: string;
  initial?: string;
}

export default function AvatarFrame({
  borderId = 'ice-dream',
  size = 72,
  className = '',
  avatarSrc = '/temukata-penguin.svg',
  initial,
}: AvatarFrameProps) {
  // Render specific SVG border ring based on borderId
  function renderBorderGraphic() {
    switch (borderId) {
      case 'flower-garden':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 pointer-events-none select-none">
            {/* Soft pink blossom ring */}
            <circle cx="50" cy="50" r="44" stroke="#F5B9C4" strokeWidth="4" fill="none" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="44" stroke="#FFD1DC" strokeWidth="2" fill="none" />
            {/* Sakura flowers around rim */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 50 + 44 * Math.cos(rad);
              const y = 50 + 44 * Math.sin(rad);
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <circle cx="0" cy="0" r="4.5" fill="#FF8FB1" />
                  <circle cx="0" cy="0" r="2.2" fill="#FFE8A8" />
                </g>
              );
            })}
          </svg>
        );

      case 'midnight-blue':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 pointer-events-none select-none">
            {/* Deep navy ring */}
            <circle cx="50" cy="50" r="44" stroke="#304D70" strokeWidth="5" fill="none" />
            <circle cx="50" cy="50" r="44" stroke="#4A6B94" strokeWidth="2" fill="none" strokeDasharray="4 2" />
            {/* Golden stars */}
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 50 + 44 * Math.cos(rad);
              const y = 50 + 44 * Math.sin(rad);
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <path
                    d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z"
                    fill="#FFD700"
                    stroke="#FFA500"
                    strokeWidth="0.5"
                  />
                </g>
              );
            })}
          </svg>
        );

      case 'golden-star':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 pointer-events-none select-none">
            {/* Golden ring */}
            <circle cx="50" cy="50" r="44" stroke="#FFE8A8" strokeWidth="6" fill="none" />
            <circle cx="50" cy="50" r="44" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
            {/* Shiny stars */}
            {[20, 70, 120, 170, 220, 270, 320].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 50 + 44 * Math.cos(rad);
              const y = 50 + 44 * Math.sin(rad);
              return (
                <g key={i} transform={`translate(${x}, ${y})`}>
                  <path
                    d="M0,-5 L1.5,-1.5 L5,0 L1.5,1.5 L0,5 L-1.5,1.5 L-5,0 L-1.5,-1.5 Z"
                    fill="#FFD700"
                  />
                  <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
                </g>
              );
            })}
          </svg>
        );

      case 'aurora-night':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 pointer-events-none select-none">
            {/* Violet Aurora Ring */}
            <circle cx="50" cy="50" r="44" stroke="#C084FC" strokeWidth="5" fill="none" />
            <circle cx="50" cy="50" r="44" stroke="#E9D5FF" strokeWidth="2" fill="none" strokeDasharray="5 3" />
            {[15, 60, 105, 150, 195, 240, 285, 330].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 50 + 44 * Math.cos(rad);
              const y = 50 + 44 * Math.sin(rad);
              return (
                <circle key={i} cx={x} cy={y} r="3.5" fill={i % 2 === 0 ? '#A855F7' : '#F472B6'} />
              );
            })}
          </svg>
        );

      case 'cherry-blossom':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 pointer-events-none select-none">
            <circle cx="50" cy="50" r="44" stroke="#FDA4AF" strokeWidth="4.5" fill="none" />
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 50 + 44 * Math.cos(rad);
              const y = 50 + 44 * Math.sin(rad);
              return (
                <circle key={i} cx={x} cy={y} r="4" fill="#FB7185" />
              );
            })}
          </svg>
        );

      case 'moonlight':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 pointer-events-none select-none">
            <circle cx="50" cy="50" r="44" stroke="#94A3B8" strokeWidth="4" fill="none" />
            <circle cx="50" cy="50" r="44" stroke="#E2E8F0" strokeWidth="2" fill="none" strokeDasharray="3 3" />
            {[30, 90, 150, 210, 270, 330].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 50 + 44 * Math.cos(rad);
              const y = 50 + 44 * Math.sin(rad);
              return <circle key={i} cx={x} cy={y} r="4" fill="#CBD5E1" stroke="#FFFFFF" strokeWidth="1" />;
            })}
          </svg>
        );

      case 'ocean-pulse':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 pointer-events-none select-none">
            <circle cx="50" cy="50" r="44" stroke="#38BDF8" strokeWidth="5" fill="none" />
            <circle cx="50" cy="50" r="44" stroke="#BAE6FD" strokeWidth="2" fill="none" strokeDasharray="4 2" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 50 + 44 * Math.cos(rad);
              const y = 50 + 44 * Math.sin(rad);
              return <circle key={i} cx={x} cy={y} r="4" fill="#0284C7" />;
            })}
          </svg>
        );

      case 'ice-dream':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 pointer-events-none select-none">
            {/* Ice Dream: Soft Blue Pearls and Frost Ring */}
            <circle cx="50" cy="50" r="44" stroke="#DCEBFA" strokeWidth="5" fill="none" />
            <circle cx="50" cy="50" r="44" stroke="#8DB4D8" strokeWidth="2.5" fill="none" strokeDasharray="4 4" />
            {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x = 50 + 44 * Math.cos(rad);
              const y = 50 + 44 * Math.sin(rad);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill="#8DB4D8"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        );
    }
  }

  const innerSize = Math.round(size * 0.76);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {/* Inner Avatar Bubble */}
      <div
        style={{ width: innerSize, height: innerSize }}
        className="rounded-full bg-[#E8F2FC] dark:bg-[#1E2E42] overflow-hidden flex items-center justify-center shadow-inner"
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt="Avatar"
            className="w-full h-full object-contain pointer-events-none select-none p-1"
            draggable={false}
          />
        ) : (
          <span className="font-black text-sm text-[#304D70] dark:text-[#A5C7F2]">
            {initial || 'T'}
          </span>
        )}
      </div>

      {/* Outer Decorative Border Ring */}
      {renderBorderGraphic()}
    </div>
  );
}
