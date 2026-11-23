import React from 'react';

export interface MedicalLogoProps {
  size?: number | string;
  monochrome?: boolean;
  showText?: boolean;
  className?: string;
}

/**
 * EXACT IDENTICAL LOGO GEOMETRY as AnimatedLogo:
 * ViewBox 0 0 240 240
 * Container: rx="46" fill="#123B65"
 * Geometric M: M 52 176 V 68 L 120 128 L 188 68 V 176 (stroke-width: 16)
 * Medical Cross: M 120 94 V 162 & M 86 128 H 154 (stroke-width: 14)
 */
export const MedicalLogo: React.FC<MedicalLogoProps> = ({
  size = 48,
  monochrome = false,
  showText = false,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md select-none overflow-visible"
      >
        <defs>
          <linearGradient id="medtec-m-exact-grad" x1="40" y1="40" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#20B8A5" />
            <stop offset="50%" stopColor="#2585D8" />
            <stop offset="100%" stopColor="#123B65" />
          </linearGradient>

          <linearGradient id="medtec-cross-exact-grad" x1="80" y1="80" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2585D8" />
            <stop offset="100%" stopColor="#20B8A5" />
          </linearGradient>

          <filter id="med-exact-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Badge container */}
        <rect
          x="14"
          y="14"
          width="212"
          height="212"
          rx="46"
          fill={monochrome ? '#0F172A' : '#123B65'}
        />

        {/* Geometric M */}
        <path
          d="M 52 176 V 68 L 120 128 L 188 68 V 176"
          stroke={monochrome ? '#FFFFFF' : 'url(#medtec-m-exact-grad)'}
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Medical Cross */}
        <path
          d="M 120 94 V 162"
          stroke={monochrome ? '#FFFFFF' : 'url(#medtec-cross-exact-grad)'}
          strokeWidth="14"
          strokeLinecap="round"
          filter={monochrome ? undefined : 'url(#med-exact-glow)'}
        />
        <path
          d="M 86 128 H 154"
          stroke={monochrome ? '#FFFFFF' : 'url(#medtec-cross-exact-grad)'}
          strokeWidth="14"
          strokeLinecap="round"
          filter={monochrome ? undefined : 'url(#med-exact-glow)'}
        />
      </svg>

      {showText && (
        <div className="flex flex-col select-none">
          <span className="text-2xl font-black tracking-tight text-[#123B65] leading-none">
            MED<span className="text-[#20B8A5]">TEC</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#2585D8] mt-1">
            Healthcare, Connected.
          </span>
        </div>
      )}
    </div>
  );
};

export default MedicalLogo;
