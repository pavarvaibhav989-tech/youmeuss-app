/**
 * BrandSymbol — Official YouMeUss brand symbol mark.
 *
 * Visual Metaphor:
 * - Left frosted screen = "You"
 * - Right electric rose screen = "Me"
 * - Interlocking forward aperture = "Us" (Synchronized playback together)
 */
export default function BrandSymbol({ size = 32, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
      aria-label="YouMeUss symbol"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="ym-brand-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>

          <linearGradient id="ym-brand-rose" x1="26" y1="16" x2="52" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="50%" stopColor="#f43f7e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          <linearGradient id="ym-brand-frost" x1="12" y1="16" x2="36" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>

          <radialGradient id="ym-brand-glow" cx="36" cy="32" r="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f43f7e" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f43f7e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Squircle obsidian badge */}
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="16"
          fill="url(#ym-brand-bg)"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.5"
        />

        {/* Ambient rose reflection */}
        <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#ym-brand-glow)" />

        {/* Left screen: 'You' (frosted platinum glass) */}
        <rect
          x="13"
          y="17"
          width="23"
          height="30"
          rx="8"
          fill="url(#ym-brand-frost)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1.5"
        />

        {/* Right screen: 'Me' (electric rose lens) */}
        <rect
          x="28"
          y="17"
          width="23"
          height="30"
          rx="8"
          fill="url(#ym-brand-rose)"
          fillOpacity="0.9"
          stroke="#fda4af"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />

        {/* Central Play notch: 'Us' (shared movie synchronization) */}
        <path
          d="M29.5 24.8C29.5 23.6 30.8 22.9 31.8 23.5L42.2 29.7C43.2 30.3 43.2 31.7 42.2 32.3L31.8 38.5C30.8 39.1 29.5 38.4 29.5 37.2Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}
