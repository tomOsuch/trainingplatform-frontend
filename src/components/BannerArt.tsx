interface BannerArtProps {
  className?: string;
}

function BannerArt({ className }: BannerArtProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 96"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <circle cx="40" cy="20" r="34" fill="#3b82f6" opacity="0.5" />
      <circle cx="370" cy="80" r="44" fill="#3b82f6" opacity="0.5" />
      <circle cx="330" cy="14" r="16" fill="#60a5fa" opacity="0.4" />
      <g transform="translate(26,62)" stroke="#bfdbfe" strokeWidth="5" strokeLinecap="round" opacity="0.9">
        <line x1="14" y1="0" x2="46" y2="0" />
        <line x1="8" y1="-11" x2="8" y2="11" />
        <line x1="17" y1="-8" x2="17" y2="8" />
        <line x1="52" y1="-11" x2="52" y2="11" />
        <line x1="43" y1="-8" x2="43" y2="8" />
      </g>
      <polyline
        points="300,70 316,70 323,56 331,80 338,64 345,70 384,70"
        fill="none" stroke="#bfdbfe" strokeWidth="3.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.9"
      />
    </svg>
  );
}

export default BannerArt;