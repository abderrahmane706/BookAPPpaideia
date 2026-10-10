/**
 * Original Greek-inspired engraved illustration (SVG).
 * Deliberately architecture-focused (columns, arch, library motifs) — not
 * mythology or human figures. Used as the single decorative accent in the
 * dashboard hero.
 */
export function GreekIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 260"
      fill="none"
      role="img"
      aria-label="Illustration of a classical library with columns and an arch"
      className={className}
    >
      {/* Arch / pediment */}
      <path
        d="M40 200 l120 -70 l120 70 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        className="text-engraving/70"
      />
      <path
        d="M60 200 l100 -56 l100 56"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        className="text-engraving/40"
      />

      {/* Columns */}
      {[90, 150, 210, 270].map((x) => (
        <g key={x} className="text-engraving/60">
          <rect x={x - 9} y={120} width={18} height={80} stroke="currentColor" strokeWidth="1.3" />
          <rect x={x - 14} y={110} width={28} height={10} stroke="currentColor" strokeWidth="1.2" />
          <rect x={x - 9} y={200} width={18} height={18} stroke="currentColor" strokeWidth="1.2" />
          {/* fluting lines */}
          <path d={`M${x - 4} 124 v72`} stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
          <path d={`M${x + 4} 124 v72`} stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
        </g>
      ))}

      {/* Base */}
      <path
        d="M40 218 h240"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="text-engraving/70"
      />

      {/* Scroll / manuscript */}
      <g className="text-engraving/50">
        <rect x="130" y="60" width="60" height="26" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M135 66 h50 M135 72 h50 M135 78 h36" stroke="currentColor" strokeWidth="0.8" />
      </g>

      {/* Urn / oil lamp (academic still life) */}
      <g className="text-engraving/50">
        <path d="M296 200 c0 -14 12 -18 12 -28 c0 -10 -12 -10 -12 -22 c0 12 -12 12 -12 22 c0 10 12 14 12 28 Z" stroke="currentColor" strokeWidth="1.2" transform="translate(-20,0)" />
      </g>

      {/* Stars / asterisks accents */}
      <g className="text-gold-soft/50">
        <path d="M30 40 l3 7 7 -3 -3 7 7 3 -7 3 3 7 -7 -3 -3 7 -3 -7 -7 3 3 -7 -7 -3 7 -3 -3 -7 7 3 3 -7 Z" stroke="currentColor" strokeWidth="0.7" transform="scale(0.6)" />
      </g>
    </svg>
  );
}
