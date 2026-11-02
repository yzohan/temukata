export default function LandscapeFooter() {
  return (
    <div className="w-full pointer-events-none select-none overflow-hidden relative mt-8 -mb-8 sm:-mb-6">
      <svg
        viewBox="0 0 1440 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto min-h-[90px] sm:min-h-[130px] block"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gentle Daisy Symbol */}
          <g id="daisy">
            <ellipse cx="0" cy="-6" rx="2.8" ry="4" fill="#FFFFFF" />
            <ellipse cx="6" cy="-2" rx="4" ry="2.8" fill="#FFFFFF" />
            <ellipse cx="4" cy="5" rx="3.5" ry="3" fill="#FFFFFF" />
            <ellipse cx="-4" cy="5" rx="3.5" ry="3" fill="#FFFFFF" />
            <ellipse cx="-6" cy="-2" rx="4" ry="2.8" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="3" fill="#FCD34D" />
          </g>
          {/* Tiny Grass Tuft */}
          <g id="tuft">
            <path d="M0,0 C-2,-6 -4,-10 -6,-12 C-3,-9 -1,-5 0,0 C1,-6 3,-11 6,-14 C4,-9 2,-4 0,0" fill="#7FA956" opacity="0.6" />
          </g>
        </defs>

        {/* Soft Background Clouds */}
        <path
          d="M0,80 Q200,60 400,75 T800,65 T1200,70 T1440,65 L1440,160 L0,160 Z"
          fill="#EAF2FA"
          opacity="0.8"
        />

        {/* Layer 1: Distant Hill */}
        <path
          d="M0,105 Q320,65 720,85 T1440,75 L1440,160 L0,160 Z"
          fill="#C4E496"
        />

        {/* Layer 2: Middle Hill */}
        <path
          d="M0,115 Q400,80 880,100 T1440,90 L1440,160 L0,160 Z"
          fill="#AFD97E"
        />

        {/* Layer 3: Foreground Hill */}
        <path
          d="M0,125 Q280,100 680,115 T1440,105 L1440,160 L0,160 Z"
          fill="#97C866"
        />

        {/* Scattered Daisies Across Hills */}
        <use href="#daisy" x="70" y="148" transform="scale(0.9)" />
        <use href="#daisy" x="220" y="142" transform="scale(0.85)" />
        <use href="#daisy" x="310" y="152" transform="scale(0.95)" />
        <use href="#daisy" x="480" y="138" transform="scale(0.8)" />
        <use href="#daisy" x="650" y="146" transform="scale(0.9)" />
        <use href="#daisy" x="800" y="140" transform="scale(0.85)" />
        <use href="#daisy" x="950" y="150" transform="scale(0.95)" />
        <use href="#daisy" x="1120" y="142" transform="scale(0.85)" />
        <use href="#daisy" x="1260" y="148" transform="scale(0.9)" />
        <use href="#daisy" x="1380" y="140" transform="scale(0.8)" />

        {/* Grass Tufts */}
        <use href="#tuft" x="140" y="145" />
        <use href="#tuft" x="390" y="140" />
        <use href="#tuft" x="730" y="142" />
        <use href="#tuft" x="1040" y="144" />
        <use href="#tuft" x="1320" y="138" />

        {/* Leaf Sprig Framing Bottom Left */}
        <g transform="translate(15, 160)">
          <path
            d="M0,0 C10,-35 25,-70 50,-95"
            stroke="#6B9F5D"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Leaves */}
          <path
            d="M18,-35 C15,-48 24,-58 35,-60 C38,-48 30,-38 18,-35 Z"
            fill="#7BAA6D"
          />
          <path
            d="M32,-60 C42,-72 55,-74 62,-65 C58,-54 45,-52 32,-60 Z"
            fill="#8DB97F"
          />
          <path
            d="M48,-92 C46,-105 58,-115 70,-115 C71,-102 62,-92 48,-92 Z"
            fill="#7BAA6D"
          />
          <path
            d="M50,-95 C62,-102 75,-98 80,-88 C72,-80 58,-84 50,-95 Z"
            fill="#9FC88E"
          />
        </g>
      </svg>
    </div>
  );
}
