export default function StoreStallIcon({ size = 56 }: { size?: number }) {
  const height = Math.round((size * 48) / 56);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 56 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
    >
      {/* Store Stall Counter Base */}
      <rect x="8" y="24" width="40" height="20" rx="3" fill="#FCEADE" stroke="#E5C7B5" strokeWidth="1.5" />
      {/* Shop Window Display */}
      <rect x="13" y="29" width="30" height="11" rx="2" fill="#BEE3F8" stroke="#90CDF4" strokeWidth="1.2" />
      <path d="M28 29V40" stroke="#90CDF4" strokeWidth="1" strokeDasharray="2 2" />

      {/* Awning (Striped Roof in Pink and Cream) */}
      <path d="M4 14C4 11 6 9 9 9H47C50 9 52 11 52 14L49 24H7L4 14Z" fill="#FFF8EE" stroke="#E2C9B8" strokeWidth="1.5" />
      {/* Pink Stripes */}
      <path d="M11 9L9.5 24H16L17 9H11Z" fill="#F5B9C4" />
      <path d="M23 9L22.5 24H29L29 9H23Z" fill="#F5B9C4" />
      <path d="M35 9L35.5 24H42L41 9H35Z" fill="#F5B9C4" />
      <path d="M47 9L48.5 24H52L49.5 9H47Z" fill="#F5B9C4" />

      {/* Scalloped Awning Frills */}
      <circle cx="9.5" cy="24" r="2.5" fill="#F5B9C4" />
      <circle cx="16" cy="24" r="2.5" fill="#FFF8EE" />
      <circle cx="22.5" cy="24" r="2.5" fill="#F5B9C4" />
      <circle cx="29" cy="24" r="2.5" fill="#FFF8EE" />
      <circle cx="35.5" cy="24" r="2.5" fill="#F5B9C4" />
      <circle cx="42" cy="24" r="2.5" fill="#FFF8EE" />
      <circle cx="48.5" cy="24" r="2.5" fill="#F5B9C4" />
    </svg>
  );
}
